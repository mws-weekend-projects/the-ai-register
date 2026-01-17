import React, { useState } from 'react';

interface HeaderProps {
  onHome: () => void;
  showShare?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onHome, showShare }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-reg-red text-white sticky top-0 z-50 shadow-md">
      <div className="w-[95%] max-w-[1920px] mx-auto px-2 md:px-4 h-12 flex items-center justify-between">
        
        {/* Left: User / Logo */}
        <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-80">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="hidden md:inline">Sign in / Up</span>
            </div>
        </div>

        {/* Center: Brand */}
        <div 
            onClick={onHome} 
            className="cursor-pointer select-none absolute left-1/2 transform -translate-x-1/2 flex items-baseline"
        >
            <h1 className="text-3xl font-sans font-extrabold tracking-tighter leading-none italic">
              The<span className="mx-0.5">AI</span>Register<span className="text-[10px] align-top relative top-1">®</span>
            </h1>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center space-x-4">
             {showShare && (
                <button 
                  onClick={handleShare}
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${copied ? 'bg-white text-reg-red' : 'bg-red-800 hover:bg-red-700 text-white'}`}
                >
                  {copied ? 'Link Copied!' : 'Share Page'}
                </button>
             )}
             <div className="cursor-pointer hover:bg-red-700 p-2 rounded hidden sm:block">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <div className="cursor-pointer hover:bg-red-700 p-2 rounded hidden sm:block">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
             </div>
        </div>
      </div>
      
      {/* Optional: Navigation Bar */}
      <div className="hidden md:block bg-white text-black border-b border-gray-300 py-2">
         <div className="w-[95%] max-w-[1920px] mx-auto px-4 flex justify-between text-xs font-bold uppercase tracking-tight text-gray-600">
            {['Data Centre', 'Software', 'Security', 'DevOps', 'Business', 'Personal Tech', 'Science', 'Offbeat'].map(item => (
                <span key={item} className="hover:text-reg-red cursor-pointer transition-colors">{item}</span>
            ))}
         </div>
      </div>
    </div>
  );
};