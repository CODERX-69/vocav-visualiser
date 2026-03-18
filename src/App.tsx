import React, { useState, useEffect } from 'react';
import { Search, Volume2, BookOpen, List, RefreshCw, Image as ImageIcon, Instagram, Youtube, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getWordDetails, getWordImage, getWordAudio, WordDetails } from './services/geminiService';

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.285-.346-.096l-6.405 4.032-2.76-.863c-.6-.185-.613-.6.125-.89l10.736-4.138c.498-.18 1.01.104.83.996z"/>
  </svg>
);

const SocialLinks = () => (
  <div className="flex items-center gap-4">
    <a href="https://www.instagram.com/linguaforza/" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-emerald-500 dark:text-stone-400 dark:hover:text-emerald-400 transition-colors" title="Instagram">
      <Instagram className="w-5 h-5" />
    </a>
    <a href="https://www.youtube.com/@LinguaForza" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-emerald-500 dark:text-stone-400 dark:hover:text-emerald-400 transition-colors" title="YouTube">
      <Youtube className="w-5 h-5" />
    </a>
    <a href="https://t.me/+QK1fCs_86zBkZDE1" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-emerald-500 dark:text-stone-400 dark:hover:text-emerald-400 transition-colors" title="Telegram">
      <TelegramIcon className="w-5 h-5" />
    </a>
  </div>
);

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<WordDetails | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchWord = query.trim();
    if (!searchWord) return;

    setLoading(true);
    setError(null);
    setDetails(null);
    setImageUrl(null);
    setAudioUrl(null);

    try {
      // Fetch details, image, and audio in parallel
      const [wordDetails, image, audio] = await Promise.all([
        getWordDetails(searchWord),
        getWordImage(searchWord),
        getWordAudio(searchWord),
      ]);

      setDetails(wordDetails);
      setImageUrl(image);
      setAudioUrl(audio);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch word details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    if (audioUrl) {
      try {
        const binaryString = atob(audioUrl);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });

        // Check if it's WAV ("RIFF" header)
        const isWav = bytes.length > 4 && 
                      bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70;

        if (isWav) {
          const buffer = await audioContext.decodeAudioData(bytes.buffer);
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start();
        } else {
          // Assume raw 16-bit PCM
          const int16Array = new Int16Array(bytes.buffer);
          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
          }
          
          const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
          audioBuffer.getChannelData(0).set(float32Array);
          
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start();
        }
      } catch (err) {
        console.error("Failed to play audio:", err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50 font-sans selection:bg-emerald-200 selection:text-emerald-900 dark:selection:bg-emerald-900 dark:selection:text-emerald-100 transition-colors duration-200">
      
      {/* Header */}
      <header className="w-full flex justify-between items-center p-4 sm:px-8 border-b border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="font-bold text-xl tracking-tight text-emerald-600 dark:text-emerald-500">LinguaForza</div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:block">
            <SocialLinks />
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-12 sm:py-20">
        
        {/* Header & Search */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4"
          >
            Visual Vocab
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-stone-500 dark:text-stone-400 mb-8"
          >
            Explore words through images, meanings, and pronunciation.
          </motion.p>

          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSearch} 
            className="relative max-w-xl mx-auto"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a word to explore..."
                className="w-full pl-5 pr-14 py-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
              >
                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
              </button>
            </div>
          </motion.form>
        </div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center mb-8"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence mode="wait">
          {details && (
            <motion.div 
              key={details.word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Word Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h2 className="text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50 capitalize mb-2">
                    {details.word}
                  </h2>
                  <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
                    <span className="font-mono text-lg">{details.phonetic}</span>
                    {audioUrl && (
                      <button 
                        onClick={playAudio}
                        className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-emerald-600 dark:text-emerald-500 transition-colors"
                        title="Listen to pronunciation"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Visual Elaboration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-semibold text-lg">
                    <ImageIcon className="w-5 h-5 text-emerald-500" />
                    <h3>Visual Elaboration</h3>
                  </div>
                  <div className="bg-white dark:bg-stone-900 rounded-2xl p-2 shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden aspect-video relative flex items-center justify-center">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={`Illustration of ${details.word}`} 
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-stone-400 dark:text-stone-500 flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 opacity-50" />
                        <p>No image available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-8">
                  
                  {/* Meaning */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-semibold text-lg">
                      <BookOpen className="w-5 h-5 text-emerald-500" />
                      <h3>Meaning</h3>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-lg">
                      {details.meaning}
                    </p>
                  </div>

                  {/* Examples */}
                  {details.examples && details.examples.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-semibold text-lg">
                        <List className="w-5 h-5 text-emerald-500" />
                        <h3>Usage Examples</h3>
                      </div>
                      <ul className="space-y-2">
                        {details.examples.map((example, idx) => (
                          <li key={idx} className="flex gap-3 text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-100 dark:border-stone-800 shadow-sm">
                            <span className="text-emerald-500 font-bold opacity-50">{idx + 1}.</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Synonyms */}
                  {details.synonyms && details.synonyms.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-stone-800 dark:text-stone-200 font-semibold text-lg">Synonyms</h3>
                      <div className="flex flex-wrap gap-2">
                        {details.synonyms.map((synonym, idx) => (
                          <span 
                            key={idx} 
                            className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium border border-stone-200 dark:border-stone-700"
                          >
                            {synonym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </main>

      {/* Footer */}
      <footer className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 p-6 sm:px-8 border-t border-stone-200 dark:border-stone-800 mt-auto bg-white/50 dark:bg-stone-950/50">
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          © {new Date().getFullYear()} LinguaForza. All rights reserved.
        </p>
        <SocialLinks />
      </footer>
    </div>
  );
}
