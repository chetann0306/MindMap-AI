import React, { useState } from 'react';
import { Brain, Calendar, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function App() {
  const [topics, setTopics] = useState('');
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topics.trim()) return;

    setLoading(true);
    setPlan(null); 

    // Convert comma/newline-separated string into a clean array of strings
    const topicsArray = topics
      .split(/[,\n]/)
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);

    try {
      // Connects to your FastAPI endpoint at /api/generate
      const response = await fetch('http://127.0.0.1:8000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: topicsArray, 
          days: parseInt(days, 10)
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      
      // Maps to the "schedule" key returned by your backend dict
      if (data.status === "Success" || data.schedule) {
        setPlan(data.schedule);
      } else {
        setPlan(JSON.stringify(data, null, 2));
      }

    } catch (error) {
      console.error("Fetch Error:", error);
      setPlan(`❌ Connection Error: ${error.message}. Make sure your Uvicorn server is running on port 8000!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-6 font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Background decorative glow elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="relative z-10 text-center my-12">
        <div className="inline-flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-full mb-4 shadow-xl backdrop-blur-md">
          <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-indigo-300">MindMap AI 2.0 Operational</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          MindMap <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
        </h1>
        <p className="mt-4 text-slate-400 text-lg max-w-md mx-auto font-medium">
          Your personalized, AI-driven study planning dashboard.
        </p>
      </header>

      {/* Main Grid Container */}
      <main className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        
        {/* Left Side: Input Panel */}
        <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Enter Study Topics
              </label>
              <textarea
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="e.g. Linked Lists, Dynamic Programming, Computer Networks"
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Total Study Days Available
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !topics.trim()}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-[1px] font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2 w-full bg-slate-950 hover:bg-transparent text-white px-4 py-3.5 rounded-xl transition-all duration-300 text-sm tracking-wide">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="border-2 border-white/20 border-t-white animate-spin w-4 h-4 rounded-full" />
                    Generating Blueprint...
                  </span>
                ) : (
                  <>
                    Generate Study Plan
                    <Sparkles className="w-4 h-4 text-pink-300" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Right Side: Output Viewport */}
        <div className="md:col-span-3 bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-xl min-h-[400px] flex flex-col shadow-2xl relative">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-4 mb-4">
            <Layers className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400">Generated Syllabus Blueprint</h2>
          </div>

          {plan ? (
            <div className="flex-1 text-slate-300 text-sm leading-relaxed space-y-4 overflow-y-auto max-h-[450px] pr-2 whitespace-pre-wrap">
              <p className="font-mono text-indigo-400 bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-3 text-xs">
                ✨ Connection Active: Displaying schedule sequence payload.
              </p>
              <div className="prose prose-invert max-w-none">
                {plan}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 mb-4 text-slate-500">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 max-w-xs">
                Your AI study roadmap will compile inside this workspace configuration once generated.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}