import React, { useState, useEffect } from 'react';
import { Download, Link, Youtube, Facebook, Instagram, Twitter, Music, Video, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const App = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [status, setStatus] = useState('idle'); // idle, processing, downloading, completed, error
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Real backend interaction
  const handleDownload = async () => {
    if (!url) return;
    
    setStatus('processing');
    setProgress(0);
    setVideoInfo(null);
    setErrorMessage('');

    try {
        // Step 1: Get Video Info
        // Note: Make sure python backend is running on port 5000
        const infoResponse = await fetch('http://localhost:5000/api/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        if (!infoResponse.ok) throw new Error('Failed to fetch video info. Check URL or Backend.');
        const infoData = await infoResponse.json();

        if (infoData.error) throw new Error(infoData.error);

        setVideoInfo({
            title: infoData.title,
            thumbnail: infoData.thumbnail,
            duration: infoData.duration,
            source: infoData.platform || detectPlatform(url)
        });

        setStatus('downloading');

        // Step 2: Start Download Request
        const downloadResponse = await fetch('http://localhost:5000/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, format, quality })
        });

        if (!downloadResponse.ok) throw new Error('Download failed from server.');
        const downloadData = await downloadResponse.json();

        if (downloadData.error) throw new Error(downloadData.error);

        // Download Complete
        setStatus('completed');
        setProgress(100);
        
        // Auto-trigger file save
        // This redirects the browser to the file path served by Flask
        window.location.href = `http://localhost:5000${downloadData.download_url}`;

    } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
        setStatus('error');
    }
  };

  // Fake progress bar loop (only runs when status is downloading to show activity)
  // Since real progress from backend requires websockets (complex), we use a visual estimator for now
  useEffect(() => {
    if (status === 'downloading') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90; // Stall at 90% until actual response comes
          return prev + (Math.random() * 2); 
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [status]);

  const detectPlatform = (link) => {
    if (link.includes('youtube') || link.includes('youtu.be')) return 'YouTube';
    if (link.includes('facebook')) return 'Facebook';
    if (link.includes('instagram')) return 'Instagram';
    if (link.includes('twitter') || link.includes('x.com')) return 'X (Twitter)';
    if (link.includes('tiktok')) return 'TikTok';
    if (link.includes('snapchat')) return 'Snapchat';
    return 'Unknown Source';
  };

  const PlatformIcon = ({ name, active }) => {
    const isActive = active || (url && detectPlatform(url) === name);
    const baseClass = "p-3 rounded-2xl transition-all duration-300 flex items-center justify-center";
    const activeClass = isActive ? "bg-blue-600 text-white shadow-lg scale-110" : "bg-slate-800 text-slate-400 hover:bg-slate-700";

    const getIcon = () => {
        switch(name) {
            case 'YouTube': return <Youtube size={20} />;
            case 'Facebook': return <Facebook size={20} />;
            case 'Instagram': return <Instagram size={20} />;
            case 'X (Twitter)': return <Twitter size={20} />;
            default: return <Link size={20} />;
        }
    }

    return (
      <div className={`${baseClass} ${activeClass}`}>
        {getIcon()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            UniLoad Pro
          </h1>
          <p className="text-slate-400">Universal Video Downloader (Any Length)</p>
        </div>

        {/* Platform Indicators */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {['YouTube', 'Facebook', 'Instagram', 'X (Twitter)'].map((p) => (
             <PlatformIcon key={p} name={p} />
          ))}
        </div>

        {/* Input Area */}
        <div className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-700 p-2">
              <Link className="ml-3 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Paste video URL here..." 
                className="w-full bg-transparent border-none outline-none text-white px-4 py-3 placeholder-slate-500"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if(status === 'completed' || status === 'error') setStatus('idle');
                }}
              />
              {url && (
                <button 
                  onClick={() => setUrl('')}
                  className="p-2 text-slate-500 hover:text-white transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-1 flex items-center justify-between border border-slate-700/50">
                <button 
                  onClick={() => setFormat('mp4')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${format === 'mp4' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  <Video size={16} /> MP4
                </button>
                <button 
                  onClick={() => setFormat('mp3')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${format === 'mp3' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  <Music size={16} /> MP3
                </button>
            </div>
            
            <select 
              className="bg-slate-800/50 text-white border border-slate-700/50 rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition cursor-pointer"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              disabled={format === 'mp3'}
            >
              <option value="4k">4K (Ultra HD)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="720p">720p (HD)</option>
              <option value="480p">480p (SD)</option>
            </select>
          </div>

          {/* Download Button */}
          <button 
            onClick={handleDownload}
            disabled={!url || status === 'processing' || status === 'downloading'}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]
              ${(!url || status === 'processing' || status === 'downloading')
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-blue-500/25'
              }`}
          >
            {status === 'processing' ? (
              <><Loader2 className="animate-spin" /> Analyzing...</>
            ) : status === 'downloading' ? (
              <><Loader2 className="animate-spin" /> Downloading & Converting...</>
            ) : (
              <><Download /> Download Now</>
            )}
          </button>
        </div>

        {/* Status / Results Area */}
        {status !== 'idle' && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Error UI */}
             {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-200">
                    <AlertCircle className="text-red-500 flex-shrink-0" />
                    <p className="text-sm">{errorMessage || 'Something went wrong. Check if Backend is running.'}</p>
                </div>
             )}

             {/* Processing / Downloading UI */}
             {(status === 'processing' || status === 'downloading') && (
               <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                  {videoInfo && (
                    <div className="flex gap-4 mb-4">
                      {videoInfo.thumbnail ? (
                        <img src={videoInfo.thumbnail} alt="thumb" className="w-24 h-16 object-cover rounded-lg bg-slate-950" />
                      ) : (
                        <div className="w-24 h-16 bg-slate-700 rounded-lg flex items-center justify-center"><Video size={20}/></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{videoInfo.title || 'Unknown Title'}</h3>
                        <p className="text-xs text-slate-400">{videoInfo.source} • {videoInfo.duration || '--:--'}</p>
                      </div>
                    </div>
                  )}
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>{status === 'processing' ? 'Fetching Metadata...' : 'Downloading on Server...'}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
               </div>
             )}

             {/* Completed UI */}
             {status === 'completed' && (
               <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                 <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                   <CheckCircle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-1">Success!</h3>
                 <p className="text-slate-400 text-sm mb-4">File downloaded successfully.</p>
               </div>
             )}
          </div>
        )}

        <div className="mt-8 text-center">
            <p className="text-xs text-slate-600">
               Make sure Python backend is running on Port 5000.
            </p>
        </div>

      </div>
    </div>
  );
};

export default App;