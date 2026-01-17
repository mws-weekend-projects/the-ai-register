import React, { useState, useEffect } from 'react';

interface LoaderProps {
  initialText: string;
}

const MESSAGES = [
  "Aligning stakeholders...",
  "Summoning BOFH...",
  "Consulting deck at 83%...",
  "Powering up the PDP-11...",
  "Blaming DNS...",
  "Refilling toner cartridges...",
  "Escalating to /dev/null...",
  "Asking AI to be less hallucinate-y..."
];

export const Loader: React.FC<LoaderProps> = ({ initialText }) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % MESSAGES.length;
      setText(MESSAGES[index]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-24 text-center min-h-[50vh]">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-reg-red blur-lg opacity-20 rounded-full animate-pulse"></div>
        <div className="w-16 h-16 border-4 border-reg-red border-t-transparent rounded-full animate-spin relative z-10"></div>
      </div>
      <h3 className="text-2xl font-serif font-bold text-reg-dark mb-2">{text}</h3>
      <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Processing request via 9600 baud modem</p>
    </div>
  );
};