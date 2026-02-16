import os
import uuid
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app)

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

# BROWSER MASQUERADING OPTIONS (Crucial for FB/Insta)
def get_common_opts():
    return {
        'quiet': True,
        'no_warnings': True,
        # This User-Agent is key for Facebook/Instagram
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'nocheckcertificate': True,
    }

@app.route('/api/info', methods=['POST'])
def get_video_info():
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400

    ydl_opts = get_common_opts()

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return jsonify({
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration_string'),
                'platform': info.get('extractor_key'),
            })
    except Exception as e:
        print(f"Info Error: {e}")
        # Return a cleaner error message
        return jsonify({'error': 'Could not fetch info. The video might be private or link is invalid.'}), 400

@app.route('/api/download', methods=['POST'])
def download_video():
    cleanup_old_files()
    
    data = request.json
    url = data.get('url')
    format_type = data.get('format', 'mp4')
    quality = data.get('quality', '1080p')

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
        # Improved Quality Selection
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
            return jsonify({'error': 'Download failed processing.'}), 500

    except Exception as e:
        print(f"Download Error: {e}")
        return jsonify({'error': f'Server Error: {str(e)}'}), 500

@app.route('/downloads/<path:filename>')
def serve_file(filename):
    return send_from_directory(DOWNLOAD_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)