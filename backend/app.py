import os
import uuid
import time
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp

# Configure logging to show up in Render logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app, resources={r"/*": {"origins": "*"}})

DOWNLOAD_FOLDER = 'downloads'
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

# Clean up old files
def cleanup_old_files():
    now = time.time()
    for f in os.listdir(DOWNLOAD_FOLDER):
        f_path = os.path.join(DOWNLOAD_FOLDER, f)
        if os.stat(f_path).st_mtime < now - 3600: 
            try:
                os.remove(f_path)
            except:
                pass

# BROWSER MASQUERADING OPTIONS
def get_common_opts():
    return {
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'cachedir': False, # CRITICAL: Disable cache to prevent sticking to flagged sessions
        'extract_flat': False,
        # Aggressive masquerading for Data Center IPs (Render)
        'extractor_args': {
            'youtube': {
                # Try 'ios' and 'android' first. 
                # If these fail, 'tv' is a strong backup but might lack some formats.
                # 'web' is excluded as it is the most blocked.
                'player_client': ['ios', 'android', 'mweb']
            }
        },
        # Standard headers to look like a generic browser
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
        }
    }

# --- NEW: Root Route to fix 404s and wake up server ---
@app.route('/', methods=['GET', 'OPTIONS'])
def home():
    return jsonify({"status": "Backend is running!", "message": "Hit /api/info to get video details."}), 200

@app.route('/api/info', methods=['POST'])
def get_video_info():
    logger.info("Received /api/info request")
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400

    ydl_opts = get_common_opts()

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # download=False is key for info extraction
            info = ydl.extract_info(url, download=False)
            return jsonify({
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration_string'),
                'platform': info.get('extractor_key'),
            })
    except Exception as e:
        logger.error(f"Info Error: {e}")
        error_msg = str(e)
        if "Sign in" in error_msg:
             return jsonify({'error': 'Server IP blocked by YouTube (Bot Guard). Please try again later.'}), 429
        return jsonify({'error': 'Could not fetch info. The video might be private or link is invalid.'}), 400

@app.route('/api/download', methods=['POST'])
def download_video():
    cleanup_old_files()
    
    data = request.json
    url = data.get('url')
    format_type = data.get('format', 'mp4')
    quality = data.get('quality', '1080p')
    
    logger.info(f"Downloading URL: {url} | Format: {format_type}")

    file_id = str(uuid.uuid4())
    output_template = f'{DOWNLOAD_FOLDER}/{file_id}.%(ext)s'

    ydl_opts = get_common_opts()
    ydl_opts['outtmpl'] = output_template

    if format_type == 'mp3':
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })
    else:
        if quality == '4k':
            ydl_opts['format'] = 'bestvideo[height<=2160]+bestaudio/best[height<=2160] / best[height<=2160] / best'
        elif quality == '1080p':
            ydl_opts['format'] = 'bestvideo[height<=1080]+bestaudio/best[height<=1080] / best[height<=1080] / best'
        elif quality == '720p':
            ydl_opts['format'] = 'bestvideo[height<=720]+bestaudio/best[height<=720] / best[height<=720] / best'
        else:
            ydl_opts['format'] = 'worst'
        
        ydl_opts['merge_output_format'] = 'mp4'

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        downloaded_file = None
        for f in os.listdir(DOWNLOAD_FOLDER):
            if f.startswith(file_id):
                downloaded_file = f
                break
        
        if downloaded_file:
            return jsonify({
                'status': 'success',
                'download_url': f'/downloads/{downloaded_file}'
            })
        else:
            logger.error("Download failed processing - File not found")
            return jsonify({'error': 'Download failed processing.'}), 500

    except Exception as e:
        logger.error(f"Download Error: {e}")
        return jsonify({'error': f'Server Error: {str(e)}'}), 500

@app.route('/downloads/<path:filename>')
def serve_file(filename):
    return send_from_directory(DOWNLOAD_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)