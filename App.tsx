import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { generateFrontPage, generateArticle } from './services/geminiService';
import { AppView, ArticleSummary, FullArticle } from './types';
import { compressState, decompressState, updateUrl } from './utils/urlState';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.SETUP);
  const [topics, setTopics] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true); // Start loading to check URL
  const [headlines, setHeadlines] = useState<ArticleSummary[]>([]);
  const [currentArticle, setCurrentArticle] = useState<FullArticle | null>(null);

  // --- 1. Hydrate from URL on Mount ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleData = urlParams.get('art');
    const frontPageData = urlParams.get('fp');

    // Priority: Specific Article -> Frontpage -> Setup
    if (articleData) {
      const article = decompressState<FullArticle>(articleData);
      if (article) {
        setCurrentArticle(article);
        setView(AppView.ARTICLE);
        setLoading(false);
        return;
      }
    }

    if (frontPageData) {
      const headlinesData = decompressState<ArticleSummary[]>(frontPageData);
      if (headlinesData) {
        setHeadlines(headlinesData);
        setView(AppView.FRONTPAGE);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
  }, []);

  // --- 2. Action Handlers ---

  const handleGenerateHeadlines = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topics.trim()) return;

    setLoading(true);
    try {
      const results = await generateFrontPage(topics);
      setHeadlines(results);
      setView(AppView.FRONTPAGE);
      
      // Update URL with compressed frontpage
      const compressed = compressState(results);
      updateUrl({ fp: compressed, art: null });
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "Unknown error";
      alert(`The hamsters powering the server died. Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReadArticle = async (summary: ArticleSummary) => {
    setLoading(true);
    try {
      const fullArticle = await generateArticle(summary);
      setCurrentArticle(fullArticle);
      setView(AppView.ARTICLE);
      window.scrollTo(0, 0);

      // Update URL with compressed article (and keep frontpage if possible, but prioritization handles restoration)
      try {
        const compressedArt = compressState(fullArticle);
        updateUrl({ art: compressedArt }); // We can keep 'fp' or remove it to shorten URL. Removing for cleaner specific link.
      } catch (urlError) {
        console.warn("URL update failed (probably too long), but continuing...", urlError);
        // Do not crash if URL is too long, just let the user read the article
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "Unknown error";
      alert(`Failed to fetch the scoop. The PR department is blocking us. Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    if (view === AppView.ARTICLE) {
      // If we have headlines in memory, go back to frontpage view
      if (headlines.length > 0) {
        setView(AppView.FRONTPAGE);
        setCurrentArticle(null);
        // Restore FP state to URL
        const compressed = compressState(headlines);
        updateUrl({ fp: compressed, art: null });
      } else {
        // If deep linked into article, we might not have headlines. Go to Setup.
        setView(AppView.SETUP);
        updateUrl({ fp: null, art: null });
      }
    } else {
      // Reset everything
      setView(AppView.SETUP);
      setHeadlines([]);
      setTopics('');
      setCurrentArticle(null);
      updateUrl({ fp: null, art: null });
    }
  };

  // --- Image Helper ---
  const getImageUrl = (article: ArticleSummary, width: number, height: number, index: number) => {
    const str = article.headline + article.id;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const positiveHash = Math.abs(hash);

    const keywords = [
        'computer', 'technology', 'server', 'data', 
        'electronics', 'internet', 'cyberpunk', 'coding', 
        'screen', 'robot', 'keyboard', 'cable'
    ];
    
    const keyword = keywords[(positiveHash + index) % keywords.length];
    return `https://loremflickr.com/${width}/${height}/${keyword}?lock=${positiveHash}`;
  };

  // --- Render Helpers ---

  const renderSetup = () => (
    <div className="max-w-xl mx-auto mt-20 p-8 bg-white shadow-2xl border-t-8 border-reg-red rounded-sm">
      <h2 className="text-3xl font-sans font-extrabold mb-4 text-reg-dark tracking-tight">Assign a Story</h2>
      <p className="mb-8 text-gray-700 leading-relaxed">
        The editor is screaming for copy. Enter keywords, companies, or tech disasters to feed the beast.
      </p>
      
      <form onSubmit={handleGenerateHeadlines} className="space-y-6">
        <input
          type="text"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="e.g. Oracle audit, AI doom, C++ memory safety..."
          className="w-full p-3 border border-gray-400 focus:border-reg-red focus:outline-none text-lg font-sans shadow-inner"
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !topics.trim()}
          className="w-full bg-reg-red hover:bg-red-800 text-white font-bold py-3 px-6 uppercase text-sm tracking-wider transition-colors disabled:opacity-50 shadow-sm rounded-sm"
        >
          {loading ? 'Consulting the Oracle...' : 'Generate News Feed'}
        </button>
      </form>
    </div>
  );

  const renderFrontPage = () => {
    if (headlines.length < 8) return null;

    const hero = headlines[0];
    const topSide = headlines.slice(1, 6); 
    const quadRow = headlines.slice(6, 10); 
    const picRow1 = headlines.slice(10, 13);
    const picRow2 = headlines.slice(13, 16);

    return (
      <div className="w-[95%] max-w-[1920px] mx-auto p-4 md:p-6 space-y-8">
        
        {/* TOP SECTION */}
        <div className="flex flex-col lg:flex-row gap-8">
            <div 
                className="lg:w-2/3 relative group cursor-pointer bg-black text-white overflow-hidden min-h-[400px]"
                onClick={() => handleReadArticle(hero)}
            >
                <div className="absolute inset-0 bg-gray-800">
                    <img 
                        src={getImageUrl(hero, 1000, 800, 0)} 
                        alt="Hero" 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300"
                    />
                </div>
                <div className="absolute bottom-0 left-0 w-full bg-black/80 p-6 md:p-8 border-t-4 border-reg-red">
                    <h2 className="text-3xl md:text-5xl font-sans font-bold leading-tight mb-3 text-white shadow-black drop-shadow-md">
                        {hero.headline}
                    </h2>
                    <p className="text-gray-300 text-lg md:text-xl font-sans leading-snug max-w-3xl">
                        {hero.subhead}
                    </p>
                    <div className="mt-4 flex items-center text-xs font-bold uppercase tracking-widest text-reg-red">
                        <span>{hero.category}</span>
                        <span className="mx-2 text-gray-500">|</span>
                        <span className="text-white">{hero.author}</span>
                    </div>
                </div>
            </div>

            <div className="lg:w-1/3 flex flex-col gap-5">
                {topSide.map((article, idx) => (
                    <div 
                        key={article.id}
                        onClick={() => handleReadArticle(article)}
                        className={`group cursor-pointer ${idx !== topSide.length -1 ? 'border-b border-gray-300 pb-5' : ''}`}
                    >
                        <h3 className="text-lg font-sans font-bold text-reg-dark group-hover:text-reg-red leading-tight mb-1">
                            {article.headline}
                        </h3>
                        <p className="text-sm text-gray-600 font-sans leading-tight">
                            {article.subhead}
                        </p>
                         <div className="mt-1 text-[10px] text-gray-400 font-bold uppercase flex items-center gap-2">
                            <span className="text-reg-red">{article.category}</span>
                            <span className="ml-auto text-black flex items-center gap-1">
                                <span className="text-xs">💬</span> {Math.floor(Math.random() * 50)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 4-COLUMN ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-t border-b border-gray-300">
            {quadRow.map((article) => (
                <div 
                    key={article.id} 
                    onClick={() => handleReadArticle(article)}
                    className="group cursor-pointer pr-4"
                >
                    <h4 className="text-base font-bold font-sans text-reg-dark group-hover:text-reg-red mb-2 leading-snug">
                        {article.headline}
                    </h4>
                    <p className="text-xs text-gray-600 font-sans leading-normal mb-2 line-clamp-3">
                        {article.summary}
                    </p>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">
                        {article.category}
                    </div>
                </div>
            ))}
        </div>

        {/* PICTURE GRID ROW 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {picRow1.map((article, idx) => (
                 <div 
                    key={article.id} 
                    onClick={() => handleReadArticle(article)}
                    className="group cursor-pointer bg-white"
                >
                    <div className="h-40 bg-gray-200 mb-3 overflow-hidden relative">
                         <img 
                            src={getImageUrl(article, 600, 300, idx + 20)}
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                         <div className="absolute bottom-0 left-0 bg-reg-red text-white text-[10px] font-bold uppercase px-2 py-0.5">
                            {article.category}
                        </div>
                    </div>
                    <h2 className="text-xl font-bold font-sans text-reg-dark group-hover:text-reg-red mb-1 leading-tight">
                        {article.headline}
                    </h2>
                    <p className="text-sm text-gray-700 font-sans leading-relaxed line-clamp-3">
                        {article.subhead}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 font-bold">
                         {article.author}
                    </div>
                </div>
            ))}
        </div>

         {/* PICTURE GRID ROW 2 */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-gray-300 pt-6">
            {picRow2.map((article, idx) => (
                 <div 
                    key={article.id} 
                    onClick={() => handleReadArticle(article)}
                    className="group cursor-pointer bg-white flex flex-row gap-3 items-start"
                >
                    <div className="w-1/3 h-24 bg-gray-200 overflow-hidden relative shrink-0">
                         <img 
                            src={getImageUrl(article, 300, 300, idx + 40)}
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                    <div className="w-2/3 flex flex-col">
                        <h2 className="text-base font-bold font-sans text-reg-dark group-hover:text-reg-red mb-1 leading-snug">
                            {article.headline}
                        </h2>
                        <div className="text-[10px] text-reg-red font-bold uppercase mt-1">
                            {article.category}
                        </div>
                    </div>
                </div>
            ))}
        </div>

      </div>
    );
  };

  const renderArticle = () => {
    if (!currentArticle) return null;

    return (
      <div className="w-[95%] max-w-5xl mx-auto p-4 md:p-8 bg-white my-8 shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 pb-6 mb-8">
             <div className="flex items-center gap-3 mb-4">
                 <span className="bg-reg-red text-white font-bold uppercase text-[10px] px-2 py-1 tracking-widest">{currentArticle.category}</span>
                 <span className="text-gray-400 text-xs font-mono uppercase">{currentArticle.date}</span>
             </div>
             
             <h1 className="text-3xl md:text-5xl font-sans font-extrabold text-reg-dark mb-6 leading-tight tracking-tight">
                {currentArticle.headline}
             </h1>
             
             <h2 className="text-xl md:text-2xl text-gray-600 font-sans font-medium leading-normal">
                {currentArticle.subhead}
             </h2>
          </div>

          <div className="flex items-center justify-between mb-8 bg-[#f8f8f8] p-4 border-t border-b border-gray-200">
             <div className="flex items-center space-x-3">
                 <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wide">Story by</span>
                    <span className="text-sm font-bold text-reg-dark hover:text-reg-red cursor-pointer underline decoration-dotted">{currentArticle.author}</span>
                 </div>
            </div>
             <div className="flex gap-4 text-gray-500 text-sm font-bold">
                <span className="hover:text-reg-red cursor-pointer">148 Comments</span>
             </div>
          </div>

          <div className="
            prose prose-lg max-w-none 
            prose-headings:font-sans prose-headings:font-bold prose-headings:text-reg-dark 
            prose-p:font-sans prose-p:text-reg-dark prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg
            prose-a:text-reg-red prose-a:font-bold prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-reg-red prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:pr-2 prose-blockquote:italic
            prose-strong:font-bold prose-strong:text-black
            [&>p:first-of-type]:font-bold [&>p:first-of-type]:text-gray-900 [&>p:first-of-type]:mb-6
            ">
            <ReactMarkdown>
                {currentArticle.content}
            </ReactMarkdown>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center">
             <button 
                onClick={() => setView(AppView.FRONTPAGE)}
                className="group flex items-center text-reg-red font-bold hover:underline"
             >
                <span className="inline-block transition-transform group-hover:-translate-x-1 mr-2">&larr;</span> 
                {headlines.length > 0 ? 'Back to Headlines' : 'Start Over'}
             </button>
             <button className="bg-reg-red text-white px-6 py-3 font-bold uppercase text-xs tracking-wider hover:bg-red-800 transition-colors">
                Read Comments (148)
             </button>
          </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-reg-dark bg-[#f4f4f4]">
      {/* Show Share button if we are not in setup mode */}
      <Header onHome={goHome} showShare={view !== AppView.SETUP} />
      
      <main className="flex-grow">
        {loading && <Loader initialText={view === AppView.SETUP ? "Restoring backup tapes..." : "Generating outrage..."} />}
        
        {!loading && view === AppView.SETUP && renderSetup()}
        {!loading && view === AppView.FRONTPAGE && renderFrontPage()}
        {!loading && view === AppView.ARTICLE && renderArticle()}
      </main>
      
      <footer className="bg-reg-dark text-gray-400 py-12 mt-12 border-t-4 border-reg-red">
        <div className="w-[95%] max-w-[1920px] mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs font-mono">
          <div className="col-span-1 md:col-span-2">
              <h5 className="text-white font-bold mb-4 uppercase">About The AI Register</h5>
              <p className="mb-4">
                  Situtation AI Publishing. Biting the hand that feeds IT since the last large language model update.
                  Generated entirely by Gemini. Not affiliated with the real "The Register".
              </p>
          </div>
          <div>
              <h5 className="text-white font-bold mb-4 uppercase">Sections</h5>
              <ul className="space-y-2">
                  <li className="hover:text-white cursor-pointer">Data Centre</li>
                  <li className="hover:text-white cursor-pointer">Software</li>
                  <li className="hover:text-white cursor-pointer">Security</li>
                  <li className="hover:text-white cursor-pointer">Off-Prem</li>
              </ul>
          </div>
          <div>
              <h5 className="text-white font-bold mb-4 uppercase">Legal</h5>
              <ul className="space-y-2">
                  <li className="hover:text-white cursor-pointer">Privacy</li>
                  <li className="hover:text-white cursor-pointer">Terms</li>
                  <li className="hover:text-white cursor-pointer">Cookies (We eat them)</li>
              </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;