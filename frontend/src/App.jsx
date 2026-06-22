import React, { useState, useEffect, useRef } from 'react';
import { Brain, Calendar, BookOpen, Layers, Clock, CheckCircle, Circle, Upload, FileText, Loader2, RefreshCw, BarChart2 } from 'lucide-react';

export default function App() {
  const [topics, setTopics] = useState('');
  const [days, setDays] = useState(10);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const fileInputRef = useRef(null);
  
  const [checkedSlots, setCheckedSlots] = useState(() => {
    const saved = localStorage.getItem('mindmap_checked_slots');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mindmap_checked_slots', JSON.stringify(checkedSlots));
  }, [checkedSlots]);

  useEffect(() => {
    const savedSchedule = localStorage.getItem('mindmap_current_schedule');
    if (savedSchedule) {
      setScheduleData(JSON.parse(savedSchedule));
    }
  }, []);

  // --- PROGRESS METRICS CALCULATION ---
  const totalSlotsCount = scheduleData ? scheduleData.reduce((acc, day) => acc + day.slots.length, 0) : 0;
  const completedSlotsCount = scheduleData ? scheduleData.reduce((acc, day) => {
    return acc + day.slots.filter(slot => checkedSlots.includes(slot.id)).length;
  }, 0) : 0;
  const completionPercentage = totalSlotsCount > 0 ? Math.round((completedSlotsCount / totalSlotsCount) * 100) : 0;

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error code: ${response.status}`);
      const data = await response.json();
      
      if (data.status === "Success") {
        setTopics(data.text);
      } else {
        alert(`Parsing Failed: ${data.message}`);
      }
    } catch (error) {
      console.error("PDF Parsing Exception:", error);
      alert("❌ Failed to communicate with python file server on port 8000.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topics.trim()) return;

    setLoading(true);
    setScheduleData(null); 
    setCheckedSlots([]); 

    const topicsArray = topics
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 4);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: topicsArray,
          days: parseInt(days, 10)
        }),
      });

      if (!response.ok) throw new Error(`API Connection Error: ${response.status}`);
      
      const dateLabels = generateDatesArray(parseInt(days, 10));
      const structuredDays = dateLabels.map((dateStr, index) => {
        const targetedTopic = topicsArray[index % topicsArray.length] || "Advanced Core Algorithm Synthesis";
        
        return {
          dayNumber: index + 1,
          date: dateStr,
          topic: targetedTopic,
          slots: [
            { 
              id: `day-${index + 1}-slot-1`,
              time: "09:30 AM - 11:30 AM", 
              subtopic: "Mathematical Analysis & Proofs",
              task: `Analyze performance bounds, verify edge complexities, and map core design constraints for: ${targetedTopic}.` 
            },
            { 
              id: `day-${index + 1}-slot-2`,
              time: "02:00 PM - 04:30 PM", 
              subtopic: "Implementation Lab",
              task: `Write correctness models, construct functional trace trees, and practice tracking execution metrics for: ${targetedTopic}.` 
            },
            { 
              id: `day-${index + 1}-slot-3`,
              time: "07:30 PM - 09:00 PM", 
              subtopic: "Active Recall",
              task: `Practice engineering design scenario workflows, work through past assessment templates, and target key retrieval prompts.` 
            }
          ]
        };
      });

      setScheduleData(structuredDays);
      localStorage.setItem('mindmap_current_schedule', JSON.stringify(structuredDays));
    } catch (error) {
      console.error("Fetch Execution Blocked:", error);
      alert(`❌ Sync Intercepted. Ensure your local Uvicorn FastAPI process is running smoothly on port 8000.`);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-6 font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-gradient-to-r from-indigo-600/15 via-purple-600/15 to-pink-600/15 blur-[120px] pointer-events-none rounded-full" />

      {/* Header Panel */}
      <header className="relative z-10 text-center my-12">
        <div className="inline-flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-full mb-4 shadow-xl backdrop-blur-md">
          <Brain className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-indigo-300">FastAPI Server Parsing Engine</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          MindMap <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
        </h1>
        <p className="mt-4 text-slate-400 text-lg max-w-md mx-auto">
          Upload your syllabus PDF handout to instantly build trackable study milestones.
        </p>
      </header>

      {/* Primary Workspace Grid */}
      <main className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Interactive Control Dock */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              Upload Handout Document
            </label>
            <div 
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-950/40 rounded-xl p-5 text-center cursor-pointer transition-all hover:bg-slate-950/80 group flex flex-col items-center justify-center relative overflow-hidden"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />
              <FileText className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 transition-colors mb-2" />
              <p className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                {uploading ? "Python extracting layout fields..." : "Drop Handout here"}
              </p>
              <p className="text-[10px] text-slate-600 mt-1">Processed natively via pypdf backend</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Syllabus Topics List
              </label>
              <textarea
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="Parsed algorithm blocks appear here..."
                className="w-full h-52 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none text-[11px] font-mono leading-relaxed bg-opacity-40"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Study Plan Duration (Days)
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
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                )}
                <span>Process Syllabus Timeline 🚀</span>
              </span>
            </button>
          </form>
        </div>

        {/* Right Output Roadmap Viewport Container */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-xl min-h-[550px] flex flex-col shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400">Hourly Blueprint Breakdown</h2>
            </div>
            {scheduleData && (
              <button 
                onClick={() => { setScheduleData(null); localStorage.removeItem('mindmap_current_schedule'); }}
                className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium border border-slate-800 px-3 py-1.5 rounded-md bg-slate-950/40"
              >
                Clear Workspace
              </button>
            )}
          </div>

          {/* --- GLOWING PROGRESS TRACKER DASHBOARD BAR --- */}
          {scheduleData && (
            <div className="bg-slate-950/80 border border-slate-800/70 rounded-xl p-4 mb-6 shadow-lg backdrop-blur-md flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  <span>PREPARATION SCORE</span>
                </div>
                <span className="font-mono text-indigo-400 bg-indigo-950/50 border border-indigo-900/40 px-2 py-0.5 rounded">
                  {completedSlotsCount} / {totalSlotsCount} SLOTS ({completionPercentage}%)
                </span>
              </div>
              {/* Dynamic Bar Tracking Layout */}
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          {scheduleData ? (
            <div className="flex-1 space-y-6 overflow-y-auto max-h-[600px] pr-2">
              {scheduleData.map((item) => (
                <div key={item.dayNumber} className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-5 hover:border-indigo-500/20 transition-all shadow-xl">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-mono text-xs px-3 py-1 rounded-md font-extrabold shadow-sm">
                        DAY {item.dayNumber}
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-100 tracking-tight capitalize truncate max-w-xs md:max-w-md">{item.topic}</h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 font-mono bg-indigo-950/40 border border-indigo-900/40 px-3 py-1 rounded-md shrink-0">
                      {item.date}
                    </span>
                  </div>

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
                          <div className="mt-0.5 shrink-0 transition-all duration-200">
                            {isChecked ? (
                              <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-950/50" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-600 hover:text-indigo-400" />
                            )}
                          </div>

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
                                📚 {slot.subtopic}
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
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 max-w-xs">
                Upload your semester handout PDF file or set configuration elements manually to assemble your calendar tracks!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}