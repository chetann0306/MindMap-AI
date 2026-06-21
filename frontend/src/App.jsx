import { useState } from 'react';
import './App.css';

function App() {
  // State variables to hold inputs and results
  const [topicsInput, setTopicsInput] = useState('');
  const [days, setDays] = useState(5);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topicsInput.trim()) return alert('Please enter some topics first!');
    
    setLoading(true);
    // Split text by commas or newlines into a clean list of strings
    const topicsArray = topicsInput
      .split(/[,\n]/)
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);

    try {
      // Connect to your running FastAPI backend
      const response = await fetch('http://127.0.0.1:8000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: topicsArray, days: parseInt(days) }),
      });
      
      const data = await response.json();
      if (data.status === 'Success') {
        setSchedule(data.schedule);
      } else {
        alert('Something went wrong generating the schedule.');
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      alert('Could not connect to the MindMap AI backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>MindMap AI 🧠</h1>
        <p>Your personalized, AI-driven study planning dashboard</p>
      </header>

      <main style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        {/* Form Controls */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Enter Study Topics (separated by commas or new lines):</label>
          <textarea
            rows="4"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            placeholder="e.g. Linked Lists, Dynamic Programming, Computer Networks, System Design"
            value={topicsInput}
            onChange={(e) => setTopicsInput(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Total Study Days Available:</label>
          <input
            type="number"
            min="1"
            style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ background: '#0070f3', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
        >
          {loading ? 'Generating...' : 'Generate Study Plan 🚀'}
        </button>

        {/* Schedule Output Display */}
        {schedule.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2>📅 Your Custom MindMap AI Schedule</h2>
            <hr />
            {schedule.map((item, index) => (
              <div key={index} style={{ background: 'white', padding: '15px', borderRadius: '6px', margin: '15px 0', borderLeft: '5px solid #0070f3', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{item.day}</h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {item.tasks.map((task, idx) => (
                    <li key={idx} style={{ color: '#555', margin: '5px 0' }}>{task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;