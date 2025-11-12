import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import './App.css';

// Your Firebase Config (paste your config from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBbMofd7wy8R_9YZsVM80bJr5iwELe9miM",
  authDomain: "saheli-period-tracker.firebaseapp.com",
  projectId: "saheli-period-tracker",
  storageBucket: "saheli-period-tracker.firebasestorage.app",
  messagingSenderId: "826367497127",
  appId: "1:826367497127:web:b3bba5fcf4d12c696f1c82",
  measurementId: "G-RQV4GGLMX3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadEntries(currentUser.uid);
        loadUserData(currentUser.uid);
      }
      setLoading(false);
    });
  }, []);

  // Load user's entries from Firestore
  const loadEntries = async (userId) => {
    try {
      const q = query(
        collection(db, 'entries'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  // Load user cycle data
  const loadUserData = async (userId) => {
    try {
      const q = query(
        collection(db, 'users'),
        where('userId', '==', userId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length > 0) {
        setUserData(querySnapshot.docs[0].data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  if (loading) return <div className="loading">💜 Loading Saheli...</div>;

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>💜 Saheli</h1>
          <p className="tagline">Your Personal Health Sister</p>
        </div>
        <div className="header-right">
          <span className="user-email">{user.email}</span>
          <button className="logout-btn" onClick={() => signOut(auth)}>Logout</button>
        </div>
      </header>

      <nav className="nav">
        <button onClick={() => setCurrentPage('dashboard')} className={currentPage === 'dashboard' ? 'active' : ''}>📊 Dashboard</button>
        <button onClick={() => setCurrentPage('log')} className={currentPage === 'log' ? 'active' : ''}>📝 Log Entry</button>
        <button onClick={() => setCurrentPage('calendar')} className={currentPage === 'calendar' ? 'active' : ''}>📅 Calendar</button>
        <button onClick={() => setCurrentPage('cycle')} className={currentPage === 'cycle' ? 'active' : ''}>🔴 Cycle</button>
        <button onClick={() => setCurrentPage('insights')} className={currentPage === 'insights' ? 'active' : ''}>🔍 Insights</button>
      </nav>

      <main className="main">
        {currentPage === 'dashboard' && <Dashboard entries={entries} user={user} />}
        {currentPage === 'log' && <LogEntry userId={user.uid} onSave={() => loadEntries(user.uid)} />}
        {currentPage === 'calendar' && <Calendar entries={entries} />}
        {currentPage === 'cycle' && <CycleTracker userId={user.uid} />}
        {currentPage === 'insights' && <Insights entries={entries} userData={userData} />}
      </main>
    </div>
  );
}

// ============ AUTH PAGE ============
function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignup) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Create user document in Firestore
        await addDoc(collection(db, 'users'), {
          userId: result.user.uid,
          email: email,
          cycleLength: 28,
          periodLength: 5,
          lastPeriodDate: null,
          supplements: [],
          createdAt: new Date()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>💜 Saheli</h1>
        <h2>Your Personal Health Sister</h2>
        <p>Track your period, moods, health & wellness</p>
        
        <input 
          type="email" 
          placeholder="Email address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input 
          type="password" 
          placeholder="Password (min 6 characters)" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        
        {error && <p className="error">⚠️ {error}</p>}
        
        <button onClick={handleAuth} disabled={loading} className="auth-btn">
          {loading ? 'Loading...' : (isSignup ? 'Create Account' : 'Log In')}
        </button>
        
        <button className="toggle-btn" onClick={() => { setIsSignup(!isSignup); setError(''); }} disabled={loading}>
          {isSignup ? '✨ Already have account? Log In' : "✨ Don't have account? Sign Up"}
        </button>
      </div>
    </div>
  );
}

// ============ DASHBOARD PAGE ============
function Dashboard({ entries, user }) {
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today);
  const lastSevenDays = entries.slice(0, 7);
  const avgMood = lastSevenDays.length > 0 
    ? Math.round((lastSevenDays.filter(e => e.mood).length / lastSevenDays.length) * 100)
    : 0;

  // Calculate cycle day
  const getCycleDay = () => {
    if (!entries.length) return '—';
    const lastMenstrualEntry = entries.find(e => e.menstrualFlow && e.menstrualFlow !== 'None');
    if (!lastMenstrualEntry) return '?';
    const lastDate = new Date(lastMenstrualEntry.date);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        {/* Cycle Status Card */}
        <div className="card cycle-card">
          <div className="card-header">
            <h3>🔴 Cycle Status</h3>
          </div>
          <div className="cycle-info">
            <p className="cycle-day">Day <span>{getCycleDay()}</span></p>
            <p className="cycle-sub">{todayEntry?.menstrualFlow || 'No flow recorded'}</p>
          </div>
        </div>

        {/* Today's Overview */}
        <div className="card today-card">
          <div className="card-header">
            <h3>📊 Today's Overview</h3>
            <span className="date-badge">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          {todayEntry ? (
            <div className="today-items">
              <div className="today-item">
                <span>😊 Mood:</span>
                <strong>{todayEntry.mood || '—'}</strong>
              </div>
              <div className="today-item">
                <span>💧 Water:</span>
                <strong>{todayEntry.water || 0} cups</strong>
              </div>
              <div className="today-item">
                <span>🏃 Exercise:</span>
                <strong>{todayEntry.exercise || '—'}</strong>
              </div>
              <div className="today-item">
                <span>🍽️ Food:</span>
                <strong>{todayEntry.meal ? todayEntry.meal.substring(0, 20) + '...' : '—'}</strong>
              </div>
              {todayEntry.pms && (
                <div className="today-item pms-badge">
                  <span>⚠️ PMS Symptoms:</span>
                  <strong>{todayEntry.pms}</strong>
                </div>
              )}
            </div>
          ) : (
            <p className="no-entry">📝 No entry today yet</p>
          )}
        </div>

        {/* This Week Stats */}
        <div className="card stats-card">
          <div className="card-header">
            <h3>📈 This Week</h3>
          </div>
          <div className="stats-grid">
            <div className="stat">
              <p className="stat-number">{lastSevenDays.length}</p>
              <p className="stat-label">Days tracked</p>
            </div>
            <div className="stat">
              <p className="stat-number">{avgMood}%</p>
              <p className="stat-label">Mood tracked</p>
            </div>
            <div className="stat">
              <p className="stat-number">{Math.round(lastSevenDays.reduce((sum, e) => sum + (e.water || 0), 0) / (lastSevenDays.length || 1))}</p>
              <p className="stat-label">Avg water/day</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ LOG ENTRY PAGE ============
function LogEntry({ userId, onSave }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mood: '',
    meal: '',
    calories: '',
    water: 8,
    exercise: '',
    menstrualFlow: 'None',
    menstrualProduct: 'None',
    pms: '',
    absent: false,
    supplements: false,
    deficiencyCheck: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'entries'), {
        userId,
        ...formData,
        timestamp: new Date()
      });
      alert('✅ Entry saved successfully!');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mood: '',
        meal: '',
        calories: '',
        water: 8,
        exercise: '',
        menstrualFlow: 'None',
        menstrualProduct: 'None',
        pms: '',
        absent: false,
        supplements: false,
        deficiencyCheck: '',
        notes: ''
      });
      onSave();
    } catch (error) {
      alert('❌ Error saving entry: ' + error.message);
    }
    setLoading(false);
  };

  const moodOptions = ['😊 Happy', '😌 Calm', '😴 Tired', '😤 Stressed', '😢 Sad', '😡 Angry', '🤔 Confused'];
  const menstrualFlowOptions = ['None', 'Light', 'Moderate', 'Heavy'];
  const pmsOptions = ['None', 'Cramps', 'Bloating', 'Headache', 'Fatigue', 'Mood swings', 'Breast tenderness', 'Multiple'];

  return (
    <div className="log-entry">
      <div className="log-header">
        <h2>📝 Log Your Day</h2>
        <p className="log-date">{new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="form-section">
        <h3>😊 Mood & Mental Health</h3>
        
        <label>How's your mood today?
          <select value={formData.mood} onChange={(e) => setFormData({ ...formData, mood: e.target.value })}>
            <option value="">Select mood...</option>
            {moodOptions.map(mood => <option key={mood} value={mood}>{mood}</option>)}
          </select>
        </label>

        <label>Any PMS symptoms?
          <select value={formData.pms} onChange={(e) => setFormData({ ...formData, pms: e.target.value })}>
            {pmsOptions.map(symptom => <option key={symptom} value={symptom}>{symptom}</option>)}
          </select>
        </label>

        <label>How are you feeling overall?
          <textarea 
            placeholder="Describe your mental state..." 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </label>
      </div>

      <div className="form-section">
        <h3>🔴 Menstrual Health</h3>
        
        <label>Menstrual flow
          <select value={formData.menstrualFlow} onChange={(e) => setFormData({ ...formData, menstrualFlow: e.target.value })}>
            {menstrualFlowOptions.map(flow => <option key={flow} value={flow}>{flow}</option>)}
          </select>
        </label>

        <label>Product used
          <select value={formData.menstrualProduct} onChange={(e) => setFormData({ ...formData, menstrualProduct: e.target.value })}>
            <option value="None">None</option>
            <option value="Pad">Pad</option>
            <option value="Tampon">Tampon</option>
            <option value="Cup">Menstrual Cup</option>
            <option value="Disc">Disc</option>
          </select>
        </label>
      </div>

      <div className="form-section">
        <h3>🍽️ Nutrition</h3>
        
        <label>What did you eat? (describe meals)
          <input 
            type="text" 
            placeholder="e.g., Salad with grilled chicken, rice, juice" 
            value={formData.meal} 
            onChange={(e) => setFormData({ ...formData, meal: e.target.value })}
          />
        </label>

        <label>Estimated calories
          <input 
            type="number" 
            placeholder="Approximate calories" 
            value={formData.calories} 
            onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
          />
        </label>
      </div>

      <div className="form-section">
        <h3>💪 Activity</h3>
        
        <label>Water intake (cups)
          <input 
            type="number" 
            min="0" 
            value={formData.water} 
            onChange={(e) => setFormData({ ...formData, water: parseInt(e.target.value) || 0 })}
          />
        </label>

        <label>Exercise
          <input 
            type="text" 
            placeholder="e.g., 30 min yoga, 5km run" 
            value={formData.exercise} 
            onChange={(e) => setFormData({ ...formData, exercise: e.target.value })}
          />
        </label>

        <label>
          <input 
            type="checkbox" 
            checked={formData.absent} 
            onChange={(e) => setFormData({ ...formData, absent: e.target.checked })}
          />
          Absent from school/work
        </label>
      </div>

      <div className="form-section">
        <h3>💊 Health Check</h3>
        
        <label>
          <input 
            type="checkbox" 
            checked={formData.supplements} 
            onChange={(e) => setFormData({ ...formData, supplements: e.target.checked })}
          />
          Took supplements/vitamins
        </label>

        <label>Deficiency warning signs?
          <select value={formData.deficiencyCheck} onChange={(e) => setFormData({ ...formData, deficiencyCheck: e.target.value })}>
            <option value="">None</option>
            <option value="dizziness">Dizziness/Lightheadedness</option>
            <option value="extreme_fatigue">Extreme Fatigue</option>
            <option value="hair_loss">Hair Loss</option>
            <option value="pale_skin">Pale Skin</option>
            <option value="shortness_breath">Shortness of Breath</option>
            <option value="brittle_nails">Brittle Nails</option>
          </select>
        </label>
      </div>

      <button onClick={handleSubmit} disabled={loading} className="save-btn">
        {loading ? '⏳ Saving...' : '✅ Save Entry'}
      </button>
    </div>
  );
}

// ============ CALENDAR PAGE ============
function Calendar({ entries }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="calendar">
      <h2>{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
      
      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="calendar-day empty"></div>;
          
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const entry = entries.find(e => e.date === dateStr);
          const hasMenstrualFlow = entry?.menstrualFlow && entry.menstrualFlow !== 'None';
          const hasEntry = !!entry;

          return (
            <div 
              key={day} 
              className={`calendar-day ${hasEntry ? 'has-entry' : ''} ${hasMenstrualFlow ? 'menstrual' : ''}`}
              title={entry ? `Mood: ${entry.mood || '—'}, Flow: ${entry.menstrualFlow}` : 'No entry'}
            >
              <div className="day-number">{day}</div>
              {hasMenstrualFlow && <div className="flow-dot">●</div>}
              {hasEntry && !hasMenstrualFlow && <div className="entry-dot">○</div>}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item"><span className="flow-indicator">●</span> Menstrual Flow</div>
        <div className="legend-item"><span className="entry-indicator">○</span> Entry Logged</div>
      </div>
    </div>
  );
}

// ============ CYCLE TRACKER PAGE ============
function CycleTracker({ userId }) {
  const [cycleData, setCycleData] = useState({
    cycleLength: 28,
    periodLength: 5,
    lastPeriodDate: ''
  });
  const [saved, setSaved] = useState(false);

  const handleSaveCycle = async () => {
    try {
      await addDoc(collection(db, 'users'), {
        userId,
        ...cycleData,
        updatedAt: new Date()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const predictNextPeriod = () => {
    if (!cycleData.lastPeriodDate) return 'Set your last period date';
    const last = new Date(cycleData.lastPeriodDate);
    const next = new Date(last.getTime() + cycleData.cycleLength * 24 * 60 * 60 * 1000);
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="cycle-tracker">
      <h2>🔴 Cycle Information</h2>
      
      <div className="cycle-info-card">
        <label>Average cycle length (days)
          <input 
            type="number" 
            min="20" 
            max="40" 
            value={cycleData.cycleLength}
            onChange={(e) => setCycleData({ ...cycleData, cycleLength: parseInt(e.target.value) })}
          />
          <small>Usually 21-35 days</small>
        </label>

        <label>Average period length (days)
          <input 
            type="number" 
            min="2" 
            max="10" 
            value={cycleData.periodLength}
            onChange={(e) => setCycleData({ ...cycleData, periodLength: parseInt(e.target.value) })}
          />
          <small>Usually 3-7 days</small>
        </label>

        <label>Last period start date
          <input 
            type="date" 
            value={cycleData.lastPeriodDate}
            onChange={(e) => setCycleData({ ...cycleData, lastPeriodDate: e.target.value })}
          />
        </label>

        <div className="prediction-box">
          <h4>📅 Next Period Prediction</h4>
          <p className="prediction">{predictNextPeriod()}</p>
        </div>

        <button onClick={handleSaveCycle} className="save-btn">
          {saved ? '✅ Saved!' : '💾 Save Cycle Info'}
        </button>
      </div>

      <div className="cycle-info-box">
        <h3>📚 Cycle Phases</h3>
        <div className="phase">
          <h4>🔴 Menstruation (Days 1-5)</h4>
          <p>Focus on iron-rich foods, rest, and hydration</p>
        </div>
        <div className="phase">
          <h4>🟡 Follicular (Days 1-13)</h4>
          <p>Energy increases, good time for exercise</p>
        </div>
        <div className="phase">
          <h4>🟢 Ovulation (Days 13-15)</h4>
          <p>Peak energy and confidence</p>
        </div>
        <div className="phase">
          <h4>🟠 Luteal (Days 15-28)</h4>
          <p>May experience PMS, need extra self-care</p>
        </div>
      </div>
    </div>
  );
}

// ============ INSIGHTS PAGE ============
function Insights({ entries, userData }) {
  const lastThirtyDays = entries.slice(0, 30);
  const avgWater = lastThirtyDays.length ? Math.round(lastThirtyDays.reduce((sum, e) => sum + (e.water || 0), 0) / lastThirtyDays.length) : 0;
  const exerciseDays = lastThirtyDays.filter(e => e.exercise && e.exercise.length > 0).length;
  const hasMenstrualIssues = lastThirtyDays.filter(e => e.menstrualFlow === 'Heavy').length;
  const deficiencyWarnings = lastThirtyDays.filter(e => e.deficiencyCheck && e.deficiencyCheck.length > 0);

  const getHealthAlert = () => {
    const alerts = [];
    
    if (avgWater < 6) alerts.push('💧 Low water intake - aim for 8+ cups daily');
    if (exerciseDays < 3 && lastThirtyDays.length >= 7) alerts.push('🏃 Exercise less than 3 times/week - increase activity');
    if (hasMenstrualIssues > 2) alerts.push('⚠️ Heavy flow consistently - consult a doctor');
    if (deficiencyWarnings.length > 2) alerts.push('🩸 Possible iron deficiency symptoms - see a doctor');
    
    return alerts;
  };

  return (
    <div className="insights">
      <h2>🔍 Your Health Insights</h2>

      {/* Health Alerts */}
      {getHealthAlert().length > 0 && (
        <div className="alert-box">
          <h3>⚠️ Health Alerts</h3>
          {getHealthAlert().map((alert, idx) => (
            <p key={idx} className="alert-message">{alert}</p>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="insights-grid">
        <div className="insight-card">
          <h3>💧 Water Intake</h3>
          <p className="insight-number">{avgWater}</p>
          <p className="insight-label">cups/day (last 30 days)</p>
          {avgWater >= 8 ? <p className="good">✅ Great hydration!</p> : <p className="warning">💡 Try for 8+ cups</p>}
        </div>

        <div className="insight-card">
          <h3>🏃 Exercise</h3>
          <p className="insight-number">{exerciseDays}</p>
          <p className="insight-label">days (last 30 days)</p>
          {exerciseDays >= 3 ? <p className="good">✅ Good activity!</p> : <p className="warning">💡 Aim for 3-5 days/week</p>}
        </div>

        <div className="insight-card">
          <h3>😊 Mood Tracking</h3>
          <p className="insight-number">{lastThirtyDays.filter(e => e.mood).length}</p>
          <p className="insight-label">moods tracked</p>
          <p className="good">✅ Keep tracking daily</p>
        </div>

        <div className="insight-card">
          <h3>🔴 Menstrual</h3>
          <p className="insight-number">{lastThirtyDays.filter(e => e.menstrualFlow !== 'None').length}</p>
          <p className="insight-label">days tracked</p>
          <p className="good">✅ Stay aware of patterns</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations">
        <h3>💡 Personalized Recommendations</h3>
        <div className="recommendation-list">
          <div className="recommendation-item">
            <span>🥬</span>
            <p><strong>Iron intake:</strong> Include leafy greens, red meat, or fortified cereals daily</p>
          </div>
          <div className="recommendation-item">
            <span>🥛</span>
            <p><strong>Calcium & Vitamin D:</strong> Dairy, fortified plant milk, or supplements</p>
          </div>
          <div className="recommendation-item">
            <span>💊</span>
            <p><strong>Vitamins:</strong> Consider B-complex and magnesium during luteal phase</p>
          </div>
          <div className="recommendation-item">
            <span>🧘</span>
            <p><strong>Self-care:</strong> Adjust intensity of exercise based on cycle phase</p>
          </div>
          <div className="recommendation-item">
            <span>🏥</span>
            <p><strong>Doctor visit:</strong> Schedule annual check-up and discuss any concerns</p>
          </div>
        </div>
      </div>

      <div className="data-summary">
        <p>📊 Total entries: {entries.length} | Last 30 days: {lastThirtyDays.length}</p>
      </div>
    </div>
  );
}