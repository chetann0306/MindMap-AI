import React, { useState, useEffect, useRef } from 'react';
import { Brain, Calendar, BookOpen, Layers, Clock, CheckCircle, Circle, Upload, FileText, Loader2, RefreshCw, BarChart2, Download, FileEdit, X, Save, HelpCircle, Eye, Play, Pause, RotateCcw, Sliders } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '3.11.174'}/build/pdf.worker.min.js`;

export default function App() {
  const [topics, setTopics] = useState('');
  const [days, setDays] = useState(10);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [activeNoteSlot, setActiveNoteSlot] = useState(null);
  const fileInputRef = useRef(null);
  
  // --- POMODORO CORE CONFIGURABLE STATES ---
  const [selectedDuration, setSelectedDuration] = useState(25); // Configurable length tier (Minutes)
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [timerRunning, setTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef(null);

  const [checkedSlots, setCheckedSlots] = useState(() => {
    const saved = localStorage.getItem('mindmap_checked_slots');
    return saved ? JSON.parse(saved) : [];
  });

  const [slotNotes, setSlotNotes] = useState(() => {
    const saved = localStorage.getItem('mindmap_slot_notes');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('mindmap_checked_slots', JSON.stringify(checkedSlots));
  }, [checkedSlots]);

  useEffect(() => {
    localStorage.setItem('mindmap_slot_notes', JSON.stringify(slotNotes));
  }, [slotNotes]);

  useEffect(() => {
    const savedSchedule = localStorage.getItem('mindmap_current_schedule');
    if (savedSchedule) {
      setScheduleData(JSON.parse(savedSchedule));
    }
  }, []);

  // Sync clock face instantly whenever you swap your configuration dropdown value
  useEffect(() => {
    if (!timerRunning && !isBreak) {
      setTimeLeft(selectedDuration * 60);
    }
  }, [selectedDuration, timerRunning, isBreak]);

  // Pomodoro Engine Tick Handlers
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            const nextIsBreak = !isBreak;
            setIsBreak(nextIsBreak);
            setTimerRunning(false);
            alert(nextIsBreak ? "🔔 Focus interval complete! Rest time." : "⏳ Interval complete! Step back into focus.");
            return nextIsBreak ? 5 * 60 : selectedDuration * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, isBreak, selectedDuration]);

  const formatTimerTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setIsBreak(false);
    setTimeLeft(selectedDuration * 60);
  };

  // Progress Metrics Computations
  const totalSlotsCount = scheduleData ? scheduleData.reduce((acc, day) => acc + day.slots.length, 0) : 0;
  const completedSlotsCount = scheduleData ? scheduleData.reduce((acc, day) => {
    return acc + day.slots.filter(slot => checkedSlots.includes(slot.id)).length;
  }, 0) : 0;
  const completionPercentage = totalSlotsCount > 0 ? Math.round((completedSlotsCount / totalSlotsCount) * 100) : 0;

  // Flashcards Dataset compiler 
  const generateFlashcardPrompt = (topic) => {
    if (!topic) return { question: "General review?", answer: "Consult core parameters." };
    const clean = topic.toLowerCase();
    if (clean.includes("recurrence") || clean.includes("master method") || clean.includes("substitution")) {
      return {
        question: "When does the Master Method fail to evaluate a recurrence relation?",
        answer: "It fails if the recurrence function is not polynomial, if the ratio is not polynomial, or if the regularity condition fails for Case 3."
      };
    }
    if (clean.includes("divide and conquer") || clean.includes("merge") || clean.includes("quick")) {
      return {
        question: "What is the primary worst-case performance trade-off of Quick Sort vs. Merge Sort?",
        answer: "Quick Sort drops to O(n²) efficiency if partitions are heavily skewed, whereas Merge Sort guarantees a strict O(n log n) bound but demands O(n) extra helper memory space."
      };
    }
    if (clean.includes("greedy") || clean.includes("knapsack") || clean.includes("spanning")) {
      return {
        question: "What defining optimization rule separates Greedy Choices from Dynamic Programming?",
        answer: "Greedy choice heuristics make locally optimal decisions at each step without reviewing future subproblems. Dynamic Programming solves all overlapping subproblems first and builds up globally."
      };
    }
    return {
      question: `What are the typical space and time efficiency bounds when implementing: "${topic}"?`,
      answer: "Requires checking the worst-case asymptotic upper bounds (Big-O) and managing call stack recursive overhead layers cleanly."
    };
  };

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

  const handleExportICS = () => {
    if (!scheduleData) return;

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PROID:-//MindMap AI//Syllabus Study Planner//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ];

    scheduleData.forEach((day, dayIdx) => {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + dayIdx);
      
      const yearStr = eventDate.getFullYear();
      const monthStr = String(eventDate.getMonth() + 1).padStart(2, '0');
      const dateStr = String(eventDate.getDate()).padStart(2, '0');
      const formattedBaseDate = `${yearStr}${monthStr}${dateStr}`;

      day.slots.forEach((slot, slotIdx) => {
        let startHour = "09", endHour = "11", startMin = "30", endMin = "30";
        if (slotIdx === 1) { startHour = "14"; endHour = "16"; startMin = "00"; endMin = "30"; }
        if (slotIdx === 2) { startHour = "19"; endHour = "21"; startMin = "30"; endMin = "00"; }

        const uid = `uid-mindmap-day-${day.dayNumber}-slot-${slotIdx}-${formattedBaseDate}@mindmapai.local`;
        
        icsContent.push(
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `DTSTAMP:${formattedBaseDate}T000000Z`,
          `DTSTART:${formattedBaseDate}T${startHour}${startMin}00`,
          `DTEND:${formattedBaseDate}T${endHour}${endMin}00`,
          `SUMMARY:[DAA Study Plan] ${day.topic} (${slot.subtopic})`,
          `DESCRIPTION:${slot.task.replace(/,/g, '\\,')}`,
          "STATUS:CONFIRMED",
          "SEQUENCE:0",
          "END:VEVENT"
        );
      });
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "MindMap_Algorithms_StudyPlan.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const openNotepadSidebar = (e, slot, parentTopicName) => {
    e.stopPropagation(); 
    setRevealAnswer(false); 
    setActiveNoteSlot({ ...slot, parentTopic: parentTopicName });
  };

  const handleNoteChange = (text) => {
    setSlotNotes({
      ...slotNotes,
      [activeNoteSlot.id]: text
    });
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

        {/* Right Output Container Viewport */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-xl min-h-[550px] flex flex-col shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400">Hourly Blueprint Breakdown</h2>
            </div>
            {scheduleData && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportICS}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-white transition-all font-semibold border border-indigo-500/30 hover:border-indigo-500 px-3 py-1.5 rounded-md bg-indigo-950/20 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sync Google Calendar</span>
                </button>
                <button 
                  onClick={() => { setScheduleData(null); localStorage.removeItem('mindmap_current_schedule'); }}
                  className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium border border-slate-800 px-3 py-1.5 rounded-md bg-slate-950/40"
                >
                  Clear Workspace
                </button>
              </div>
            )}
          </div>

          {/* Progress Tracker Dashboard Bar */}
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
                      const hasNotes = slotNotes[slot.id] && slotNotes[slot.id].trim().length > 0;
                      return (
                        <div 
                          key={slot.id} 
                          onClick={() => toggleSlot(slot.id)}
                          className={`border rounded-xl p-4 cursor-pointer transition-all flex items-start gap-4 select-none group relative ${
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

                          <div className="flex-1 space-y-1 pr-8">
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
                            {hasNotes && (
                              <p className="text-[11px] text-indigo-400 italic font-medium pt-1 line-clamp-1">
                                📝 Notes: {slotNotes[slot.id]}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={(e) => openNotepadSidebar(e, slot, item.topic)}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg border border-slate-800 bg-slate-950/80 transition-all ${
                              hasNotes 
                                ? 'text-indigo-400 opacity-100 border-indigo-500/30' 
                                : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-indigo-400 hover:border-slate-700'
                            }`}
                            title="Workspace Drawer"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
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

          {/* Collapsible Slide-Out Recall, Notes, and Configurable Pomodoro Sidebar Drawer */}
          {activeNoteSlot && (() => {
            const currentFlashcard = generateFlashcardPrompt(activeNoteSlot.parentTopic);
            return (
              <div className="absolute inset-y-0 right-0 w-80 md:w-[420px] bg-slate-900/98 border-l border-slate-800/90 rounded-r-2xl shadow-[-15px_0_40px_rgba(0,0,0,0.6)] z-20 backdrop-blur-2xl p-5 flex flex-col gap-5 overflow-y-auto animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Active Recall Studio</h3>
                  </div>
                  <button 
                    onClick={() => setActiveNoteSlot(null)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* --- CONFIGURABLE POMODORO TIMER PANEL --- */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 shadow-md flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-900/80 pb-2">
                    <div className="space-y-0.5">
                      <span className={`text-[10px] font-extrabold tracking-widest uppercase font-mono ${isBreak ? 'text-emerald-400' : 'text-indigo-400'}`}>
                        {isBreak ? "☕ Rest Interval" : "⏱️ Deep Focus Block"}
                      </span>
                      <div className="text-2xl font-black font-mono tracking-tight text-slate-100">
                        {formatTimerTime(timeLeft)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTimerRunning(!timerRunning)}
                        className={`p-2 rounded-lg border transition-all ${timerRunning ? 'bg-amber-950/40 border-amber-500/30 text-amber-400' : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400'}`}
                      >
                        {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={resetTimer}
                        className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-400 transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Time Duration Target Select Options Dropdown */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      Set Focus Length:
                    </span>
                    <select
                      value={selectedDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setSelectedDuration(val);
                      }}
                      disabled={timerRunning || isBreak}
                      className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 text-[11px]"
                    >
                      <option value={15}>15 Minutes (Sprint)</option>
                      <option value={25}>25 Minutes (Standard)</option>
                      <option value= {45}>45 Minutes (Deep Dive)</option>
                    </select>
                  </div>
                </div>

                {/* Section 1: Flashcard Deck Card */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Syllabus Flashcard Prompt</span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 leading-relaxed">
                    {currentFlashcard.question}
                  </p>
                  
                  {revealAnswer ? (
                    <div className="bg-slate-900/80 border border-indigo-950/50 rounded-lg p-3 text-xs text-indigo-300 leading-relaxed border-l-2 border-l-indigo-500 animate-in fade-in duration-200">
                      {currentFlashcard.answer}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRevealAnswer(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/40 text-indigo-300 hover:text-white rounded-lg text-[11px] font-bold transition-all shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Test Active Recall & Flip Card</span>
                    </button>
                  )}
                </div>

                {/* Section 2: Studio Study Notebook Area */}
                <div className="flex-1 flex flex-col gap-2 min-h-[150px]">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Personal Studio Study Notes
                  </label>
                  <textarea
                    value={slotNotes[activeNoteSlot.id] || ''}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    placeholder="Type derivation steps, computational formulas, complexity upper bounds, or reference pointers here..."
                    className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all resize-none font-mono leading-relaxed bg-opacity-60"
                  />
                </div>

                <button
                  onClick={() => setActiveNoteSlot(null)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 hover:text-indigo-400 text-slate-300 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md mt-auto shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Workspace & Close</span>
                </button>
              </div>
            );
          })()}

        </div>
      </main>
    </div>
  );
}