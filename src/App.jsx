import React, { useState, useEffect } from 'react';
import { Download, Link, Youtube, Facebook, Instagram, Twitter, Music, Video, CheckCircle, AlertCircle, Loader2, Zap, Shield, Globe, Smartphone } from 'lucide-react';

const App = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // --- CONFIGURATION ---
  // FIX: Aapki provided link ab yahan set kar di gayi hai.
  // Note: Render free tier par server 'Sleep' mode mein chala jata hai.
  // Pehli baar request karne par 1-2 minute lag sakte hain start hone mein.
  const API_URL = 'https://video-downloader-by-dreambyte.onrender.com';

  const ADS = {
    topAdLink: "https://google.com", 
    topAdImage: "https://placehold.co/728x90/1e293b/cbd5e1?text=Top+Banner+Ad+(728x90)",
    bottomAdLink: "https://google.com",
    bottomAdImage: "https://placehold.co/728x90/1e293b/cbd5e1?text=Bottom+Banner+Ad+(728x90)"
  };

  const handleDownload = async () => {
    if (!url) return;
    setStatus('processing');
    setProgress(0);
    setVideoInfo(null);
    setErrorMessage('');

    try {
        console.log("Connecting to:", API_URL); // Debugging log

        // Step 1: Info Fetching
        const infoResponse = await fetch(`${API_URL}/api/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        if (!infoResponse.ok) {
            // Agar server error de, to koshish karein JSON read karne ki
            const errorText = await infoResponse.text();
            let errMessage = 'Failed to fetch video info.';
            try {
                const errJson = JSON.parse(errorText);
                errMessage = errJson.error || errMessage;
            } catch (e) {}
            throw new Error(errMessage);
        }
        
        const infoData = await infoResponse.json();

        setVideoInfo({
            title: infoData.title,
            thumbnail: infoData.thumbnail,
            duration: infoData.duration,
            source: infoData.platform || detectPlatform(url)
        });

        setStatus('downloading');

        // Step 2: Download Request
        const downloadResponse = await fetch(`${API_URL}/api/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, format, quality })
        });

        if (!downloadResponse.ok) {
             const errorText = await downloadResponse.text();
             let errMessage = 'Download failed from server.';
             try {
                const errJson = JSON.parse(errorText);
                errMessage = errJson.error || errMessage;
             } catch (e) {}
             throw new Error(errMessage);
        }
        
        const downloadData = await downloadResponse.json();

        setStatus('completed');
        setProgress(100);
        
        // Step 3: Redirect to file
        // Yahan bhi API_URL use hoga
        window.location.href = `${API_URL}${downloadData.download_url}`;

    } catch (error) {
        console.error("Download Error:", error);
        setErrorMessage(error.message || "Failed to connect to server. Please try again.");
        setStatus('error');
    }
  };

  useEffect(() => {
    if (status === 'downloading') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95; 
          return prev + (Math.random() * 3); 
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [status]);

  const detectPlatform = (link) => {
    const l = link.toLowerCase();
    if (l.includes('youtube') || l.includes('youtu.be')) return 'YouTube';
    if (l.includes('facebook') || l.includes('fb.watch')) return 'Facebook';
    if (l.includes('instagram')) return 'Instagram';
    if (l.includes('twitter') || l.includes('x.com')) return 'X (Twitter)';
    if (l.includes('tiktok')) return 'TikTok';
    return 'Web';
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800/60 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Download className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              UniLoad<span className="text-blue-500">Pro</span>
            </span>
          </div>
          
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition">Home</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#supported" className="hover:text-white transition">Supported Sites</a>
          </div>

          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition border border-slate-700 hover:border-blue-500/50 group">
            <Smartphone size={16} className="group-hover:text-blue-400 transition" />
            <span>Get App</span>
          </button>
        </div>
      </nav>

      {/* --- TOP AD SECTION --- */}
      <div className="w-full bg-[#0f1422] border-b border-slate-800/50 py-4">
        <div className="max-w-4xl mx-auto px-4 flex justify-center">
            {/* Ad Container */}
            <a href={ADS.topAdLink} target="_blank" rel="noopener noreferrer" className="block w-full max-w-[728px] h-[90px] bg-slate-900 rounded-lg overflow-hidden border border-slate-700 hover:opacity-90 transition relative group">
                <img src={ADS.topAdImage} alt="Advertisement" className="w-full h-full object-cover" />
                <div className="absolute top-0 right-0 bg-black/60 text-[10px] text-white px-1.5 py-0.5 rounded-bl-md">Ad</div>
            </a>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-16 pb-32">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700/50 text-blue-400 text-xs font-bold mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live Server Online
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.1]">
            Universal Video <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Downloader</span>
          </h1>
          
          <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Download high-quality videos from YouTube, Facebook, Instagram, TikTok, and more. Free, fast, and secure.
          </p>

          {/* === FIXED MAIN CARD (High Visibility) === */}
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-3xl shadow-2xl max-w-3xl mx-auto ring-4 ring-slate-800/50">
            
            {/* Input Row */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Link className="h-5 w-5 text-slate-400" />
                </div>
                {/* Lighter Input Background for better contrast */}
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-lg shadow-inner"
                  placeholder="Paste URL here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <button
                onClick={handleDownload}
                disabled={!url || status === 'processing' || status === 'downloading'}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap min-w-[160px]"
              >
                {status === 'processing' ? <Loader2 className="animate-spin" /> : <Download />}
                {status === 'processing' ? 'Fetching...' : status === 'downloading' ? 'Downloading...' : 'Download'}
              </button>
            </div>

            {/* Options Panel (Visible by default or when needed) */}
            <div className={`mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${url || status !== 'idle' ? 'opacity-100' : 'opacity-100'}`}>
               
               {/* Format Buttons - Distinct Backgrounds */}
               <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => setFormat('mp4')} 
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${format === 'mp4' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    <Video size={16} /> MP4
                  </button>
                  <button 
                    onClick={() => setFormat('mp3')} 
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${format === 'mp3' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    <Music size={16} /> MP3
                  </button>
               </div>

               {/* Quality Select - High Contrast */}
               <div className="relative">
                 <select 
                    className="appearance-none bg-slate-800 border border-slate-600 text-white text-sm font-medium rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3 px-4 outline-none cursor-pointer hover:border-slate-500 transition shadow-sm"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    disabled={format === 'mp3'}
                 >
                    <option value="4k">🌟 4K Ultra HD</option>
                    <option value="1080p">📺 1080p Full HD</option>
                    <option value="720p">📱 720p HD</option>
                    <option value="480p">💾 480p Data Saver</option>
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                 </div>
               </div>
            </div>
          </div>
          {/* === END MAIN CARD === */}

          {/* --- MIDDLE AD SECTION --- */}
          <div className="w-full mt-12 flex justify-center">
            <a href={ADS.bottomAdLink} target="_blank" rel="noopener noreferrer" className="block w-full max-w-[728px] h-[90px] bg-slate-900 rounded-lg overflow-hidden border border-slate-700 hover:opacity-90 transition relative">
                <img src={ADS.bottomAdImage} alt="Advertisement" className="w-full h-full object-cover" />
                <div className="absolute top-0 right-0 bg-black/60 text-[10px] text-white px-1.5 py-0.5 rounded-bl-md">Ad</div>
            </a>
          </div>

          {/* Status Messages */}
          {status !== 'idle' && (
            <div className="mt-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-center gap-4 text-red-200 text-left backdrop-blur-sm">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <AlertCircle className="shrink-0 text-red-500 h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-red-500 text-lg">Download Failed</p>
                    <p className="text-sm opacity-90">{errorMessage || "Check the URL and make sure Backend is running."}</p>
                  </div>
                </div>
              )}

              {(status === 'processing' || status === 'downloading') && (
                 <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 text-left shadow-2xl">
                    <div className="flex gap-5 items-center">
                        {videoInfo ? (
                             <img src={videoInfo.thumbnail} className="w-32 h-20 object-cover rounded-lg bg-slate-950 border border-slate-800 shadow-md" />
                        ) : (
                             <div className="w-32 h-20 bg-slate-800 rounded-lg animate-pulse"></div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-lg truncate">{videoInfo?.title || 'Analyzing video link...'}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">{videoInfo?.source || 'Source'}</span>
                                <span>{videoInfo?.duration && `Duration: ${videoInfo.duration}`}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5">
                        <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                             <span>{status === 'processing' ? 'Fetching Metadata...' : 'Converting & Downloading...'}</span>
                             <span className="text-blue-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${progress}%`}}></div>
                        </div>
                    </div>
                 </div>
              )}

              {status === 'completed' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 flex items-center justify-between text-green-400 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                       <CheckCircle className="shrink-0 h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-bold text-lg">Download Started!</p>
                        <p className="text-sm text-green-400/80">Your file has been saved.</p>
                    </div>
                  </div>
                  <button onClick={() => setStatus('idle')} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg text-sm font-semibold transition">
                    Convert Another
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Feature Grid */}
      <div className="py-24 bg-slate-900/30 border-t border-slate-800/50" id="features">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-[#0f1422] border border-slate-800 p-8 rounded-3xl hover:bg-slate-800/60 hover:border-slate-700 transition duration-300">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20">
                        <Zap className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Engineered for speed. Process long videos in seconds with our optimized Python backend.</p>
                </div>
                <div className="bg-[#0f1422] border border-slate-800 p-8 rounded-3xl hover:bg-slate-800/60 hover:border-slate-700 transition duration-300">
                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 border border-purple-500/20">
                        <Shield className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Secure & Private</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">We respect your privacy. No logs are kept, and files are automatically deleted after download.</p>
                </div>
                <div className="bg-[#0f1422] border border-slate-800 p-8 rounded-3xl hover:bg-slate-800/60 hover:border-slate-700 transition duration-300">
                    <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-6 border border-green-500/20">
                        <Globe className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Universal Support</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Download from over 1000+ websites including YouTube, Facebook, Instagram, and TikTok.</p>
                </div>
            </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0B0F19] py-12 text-center text-slate-600 text-sm">
         <p>&copy; {new Date().getFullYear()} UniLoad Pro. Built with React & Python.</p>
      </footer>
    </div>
  );
};

export default App;