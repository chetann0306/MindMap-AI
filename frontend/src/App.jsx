import React, { useState, useEffect } from 'react';
import { Brain, Calendar, Sparkles, BookOpen, Layers, Clock, CheckCircle, Circle } from 'lucide-react';

export default function App() {
  const [topics, setTopics] = useState('');
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  
  // Initialize checked slots from localStorage
  const [checkedSlots, setCheckedSlots] = useState(() => {
    const saved = localStorage.getItem('mindmap_checked_slots');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync checked slots to localStorage on change
  useEffect(() => {
    localStorage.setItem('mindmap_checked_slots', JSON.stringify(checkedSlots));
  }, [checkedSlots]);

  // Load existing schedule configuration on first mount
  useEffect(() => {
    const savedSchedule = localStorage.getItem('mindmap_current_schedule');
    if (savedSchedule) {
      setScheduleData(JSON.parse(savedSchedule));
    }
  }, []);

  // Helper utility to generate calendar date tags starting today
  const generateDatesArray = (totalDays) => {
    const dates = [];
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    for (let i = 0; i < totalDays; i++) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + i);
      dates.push(nextDate.toLocaleDateString('en-US', options));
    }
    return dates;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topics.trim()) return;

    setLoading(true);
    setScheduleData(null); 
    setCheckedSlots([]); // Clear out old task progress on new generation

    const topicsArray = topics
      .split(/[,\n]/)
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);

    try {
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

      if (!response.ok) throw new Error(`Server response error status: ${response.status}`);
      const data = await response.json();
      
      // Check for success confirmation from the Python API
      if (data.status === "Success" || data.schedule) {
        const dateLabels = generateDatesArray(parseInt(days, 10));
        
        const structuredDays = dateLabels.map((dateStr, index) => {
          const targetedTopic = topicsArray[index % topicsArray.length] || "Comprehensive System Integration";
          
          return {
            dayNumber: index + 1,
            date: dateStr,
            topic: targetedTopic,
            slots: [
              { 
                id: `day-${index + 1}-slot-1`,
                time: "09:00 AM - 11:30 AM", 
                subtopic: "Core Architecture & Syntax",
                task: `Deep dive overview of structural variables, foundational primitives, and memory layout of ${targetedTopic}.` 
              },
              { 
                id: `day-${index + 1}-slot-2`,
                time: "01:00 PM - 03:30 PM", 
                subtopic: "Algorithm Optimization & Edge Cases",
                task: `Execution profiling, identifying runtime bottleneck complexities, and parsing multi-threaded edge cases.` 
              },
              { 
                id: `day-${index + 1}-slot-3`,
                time: "04:00 PM - 05:30 PM", 
                subtopic: "Practical Lab Code-Along",
                task: `Building a fully isolated sandbox project implementation compiling ${targetedTopic} clean architectures.` 
              },
              { 
                id: `day-${index + 1}-slot-4`,
                time: "08:00 PM - 09:30 PM", 
                subtopic: "Active Recall & Mock Prompts",
                task: `Testing flashcards, system-design whiteboarding exercises, and self-evaluation grading.` 
              }
            ]
          };
        });

        setScheduleData(structuredDays);
        localStorage.setItem('mindmap_current_schedule', JSON.stringify(structuredDays));
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert(`❌ Connection Error. Ensure your local FastAPI app.py server is up and executing on port 8000.`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (id) => {
    if (checkedSlots.includes(id)) {
      setCheckedSlots(checkedSlots.filter(slotId => slotId !== id));
    } else {
      setCheckedSlots([...checkedSlots, id]);
    }
  };

  const resetAllProgress = () => {
    setCheckedSlots([]);
    localStorage.removeItem('mindmap_checked_slots');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-6 font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Decorative Glow backdrop layer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-gradient-to-r from-indigo-600/15 via-purple-600/15 to-pink-600/15 blur-[120px] pointer-events-none rounded-full" />

      {/* Header Container */}
      <header className="relative z-10 text-center my-12">
        <div className="inline-flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-full mb-4 shadow-xl backdrop-blur-md">
          <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-indigo-300">Persistence Workspace Live</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          MindMap <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
        </h1>
        <p className="mt-4 text-slate-400 text-lg max-w-md mx-auto">
          Your granular, interactive study tracker workspace.
        </p>
      </header>

      {/* Primary Dashboard layout Grid */}
      <main className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Input Configuration Card */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative">
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
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-sm"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !topics.trim()}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-[1px] font-bold shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2 w-full bg-slate-950 hover:bg-transparent text-white px-4 py-3.5 rounded-xl transition-all duration-300 text-sm">
                {loading ? "Compiling Matrix Array..." : "Generate Custom Schedule 🚀"}
              </span>
            </button>
          </form>
        </div>

        {/* Right Output Roadmap Viewport */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-xl min-h-[500px] flex flex-col shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400">Hourly Blueprint Breakdown</h2>
            </div>
            {scheduleData && (
              <button 
                onClick={resetAllProgress}
                className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium border border-slate-800 hover:border-indigo-500/30 px-3 py-1.5 rounded-md bg-slate-950/40"
              >
                Reset Progress
              </button>
            )}
          </div>

          {scheduleData ? (
            <div className="flex-1 space-y-6 overflow-y-auto max-h-[650px] pr-2">
              {scheduleData.map((item) => (
                <div key={item.dayNumber} className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-5 hover:border-indigo-500/20 transition-all shadow-xl">
                  
                  {/* Top Day Row Metadata Banner Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-mono text-xs px-3 py-1 rounded-md font-extrabold shadow-sm">
                        DAY {item.dayNumber}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-100 tracking-tight">{item.topic}</h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 font-mono bg-indigo-950/40 border border-indigo-900/40 px-3 py-1 rounded-md">
                      {item.date}
                    </span>
                  </div>

                  {/* Hourly Timelines Execution Cards */}
                  <div className="space-y-4">
                    {item.slots.map((slot) => {
                      const isChecked = checkedSlots.includes(slot.id);
                      return (
                        <div 
                          key={slot.id} 
                          onClick={() => toggleSlot(slot.id)}
                          className={`border rounded-xl p-4 cursor-pointer transition-all flex items-start gap-4 select-none ${
                            isChecked 
                              ? 'bg-emerald-950/10 border-emerald-500/30 shadow-inner opacity-60' 
                              : 'bg-slate-900/20 border-slate-900/60 hover:bg-slate-900/40 hover:border-slate-800'
                          }`}
                        >
                          {/* Checked Icon Selector */}
                          <div className="mt-0.5 shrink-0 transition-transform active:scale-90">
                            {isChecked ? (
                              <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-950/50" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-600 hover:text-indigo-400 transition-colors" />
                            )}
                          </div>

                          {/* Time Details Context */}
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className={`flex items-center gap-2 text-xs font-bold font-mono ${isChecked ? 'text-emerald-500/70' : 'text-purple-400'}`}>
                                <Clock className="w-3.5 h-3.5" />
                                {slot.time}
                              </div>
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                                isChecked 
                                  ? 'bg-emerald-950/40 border border-emerald-900/30 text-emerald-400/80' 
                                  : 'bg-purple-950/40 border border-purple-900/30 text-purple-300'
                              }`}>
                                📚 Subtopic: {slot.subtopic}
                              </span>
                            </div>
                            <p className={`text-sm leading-relaxed transition-all ${isChecked ? 'text-slate-500 line-through decoration-slate-700' : 'text-slate-300'}`}>
                              {slot.task}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 mb-4 text-slate-500">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 max-w-xs">
                Your subtopics, timing configurations, and lesson objectives will display inside this container module once generated.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}