import React, { useState, useEffect } from 'react';
import { Calendar, Heart, Droplet, Activity, Utensils, Pill, Users, AlertCircle, TrendingUp, Moon } from 'lucide-react';

export default function SaheliApp() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cycleData, setCycleData] = useState({
    lastPeriodStart: null,
    cycleLength: 28,
    periodLength: 5
  });
  const [dailyLogs, setDailyLogs] = useState({});
  const [healthInsights, setHealthInsights] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const savedCycle = localStorage.getItem('saheli-cycle-data');
      const savedLogs = localStorage.getItem('saheli-daily-logs');
      const savedInsights = localStorage.getItem('saheli-health-insights');
      
      if (savedCycle) setCycleData(JSON.parse(savedCycle));
      if (savedLogs) setDailyLogs(JSON.parse(savedLogs));
      if (savedInsights) setHealthInsights(JSON.parse(savedInsights));
    } catch (error) {
      console.log('No existing data, starting fresh');
    }
  };

  const saveData = (type, data) => {
    try {
      localStorage.setItem(type, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const getDayLog = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return dailyLogs[dateKey] || {};
  };

  const saveDayLog = (date, logData) => {
    const dateKey = date.toISOString().split('T')[0];
    const newLogs = { ...dailyLogs, [dateKey]: logData };
    setDailyLogs(newLogs);
    saveData('saheli-daily-logs', newLogs);
    analyzeHealthPattern(newLogs);
  };

  const analyzeHealthPattern = (logs) => {
    const recentLogs = Object.entries(logs).slice(-30);
    const insights = [];

    // Water intake analysis
    const waterIntakes = recentLogs.map(([_, log]) => log.water || 0);
    const avgWater = waterIntakes.reduce((a, b) => a + b, 0) / waterIntakes.length;
    if (avgWater < 6) {
      insights.push({
        type: 'warning',
        message: 'Your water intake is below recommended levels. Consider drinking more water.',
        severity: 'medium'
      });
    }

    // Mood pattern analysis
    const lowMoodDays = recentLogs.filter(([_, log]) => 
      ['sad', 'anxious', 'irritable'].includes(log.mood)
    ).length;
    if (lowMoodDays > 10) {
      insights.push({
        type: 'alert',
        message: 'Persistent low mood detected. Consider consulting a healthcare provider.',
        severity: 'high'
      });
    }

    // Exercise tracking
    const exerciseDays = recentLogs.filter(([_, log]) => log.exercise).length;
    if (exerciseDays < 8) {
      insights.push({
        type: 'info',
        message: 'Low physical activity. Regular exercise can help manage PMS symptoms.',
        severity: 'low'
      });
    }

    setHealthInsights(insights);
    saveData('saheli-health-insights', insights);
  };

  const calculateCycleDay = () => {
    if (!cycleData.lastPeriodStart) return null;
    const lastPeriod = new Date(cycleData.lastPeriodStart);
    const today = new Date();
    const diff = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
    return (diff % cycleData.cycleLength) + 1;
  };

  const getCyclePhase = (day) => {
    if (day <= cycleData.periodLength) return 'Menstruation';
    if (day <= 14) return 'Follicular Phase';
    if (day <= 16) return 'Ovulation';
    return 'Luteal Phase';
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      const hasLog = dailyLogs[dateKey];
      const isPeriod = hasLog?.isPeriod;
      
      days.push(
        <button
          key={day}
          onClick={() => {
            setSelectedDate(date);
            setCurrentView('log');
          }}
          className={`p-2 rounded-lg border-2 hover:border-purple-400 transition-all ${
            isPeriod ? 'bg-red-100 border-red-300' : hasLog ? 'bg-purple-50 border-purple-200' : 'border-gray-200'
          }`}
        >
          <div className="text-sm font-medium">{day}</div>
          {hasLog && (
            <div className="flex gap-1 mt-1 justify-center">
              {hasLog.mood && <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>}
              {hasLog.water && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>}
              {hasLog.exercise && <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const renderDashboard = () => {
    const cycleDay = calculateCycleDay();
    const phase = cycleDay ? getCyclePhase(cycleDay) : 'Not tracked';

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="text-pink-500" size={24} />
              <h3 className="font-semibold text-gray-800">Cycle Status</h3>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {cycleDay ? `Day ${cycleDay}` : 'Ready'}
            </div>
            <p className="text-sm text-gray-600">{phase}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="text-blue-500" size={24} />
              <h3 className="font-semibold text-gray-800">Today's Summary</h3>
            </div>
            <div className="text-sm text-gray-700">
              {getDayLog(new Date()).mood ? (
                <div>Logged for today ✓</div>
              ) : (
                <div>No entry today yet</div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-purple-500" size={24} />
              <h3 className="font-semibold text-gray-800">Stats</h3>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(dailyLogs).length}
            </div>
            <p className="text-sm text-gray-600">Total entries</p>
          </div>
        </div>

        {healthInsights.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-orange-500" size={24} />
              <h3 className="font-semibold text-gray-800">Health Insights</h3>
            </div>
            <div className="space-y-3">
              {healthInsights.map((insight, idx) => (
                <div key={idx} className={`p-4 rounded-lg ${
                  insight.severity === 'high' ? 'bg-red-50 border-l-4 border-red-400' :
                  insight.severity === 'medium' ? 'bg-orange-50 border-l-4 border-orange-400' :
                  'bg-blue-50 border-l-4 border-blue-400'
                }`}>
                  <p className="text-sm text-gray-700">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLogEntry = () => {
    const currentLog = getDayLog(selectedDate);
    const [logData, setLogData] = useState(currentLog);

    const handleSave = () => {
      saveDayLog(selectedDate, logData);
      setCurrentView('calendar');
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Log Your Day - {selectedDate.toLocaleDateString()}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-purple-600 mb-2">
              <Heart size={18} />
              Mood & Health
            </label>
            <select 
              value={logData.mood || ''}
              onChange={(e) => setLogData({...logData, mood: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 outline-none"
            >
              <option value="">Select mood...</option>
              <option value="happy">😊 Happy</option>
              <option value="calm">😌 Calm</option>
              <option value="energetic">⚡ Energetic</option>
              <option value="tired">😴 Tired</option>
              <option value="sad">😢 Sad</option>
              <option value="anxious">😰 Anxious</option>
              <option value="irritable">😠 Irritable</option>
              <option value="stressed">😫 Stressed</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-pink-600 mb-2">
              <Moon size={18} />
              Period Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={logData.isPeriod || false}
                  onChange={(e) => setLogData({...logData, isPeriod: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm">On period</span>
              </label>
              {logData.isPeriod && (
                <select 
                  value={logData.flow || ''}
                  onChange={(e) => setLogData({...logData, flow: e.target.value})}
                  className="p-2 border-2 border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Flow...</option>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              )}
            </div>
            {logData.isPeriod && (
              <select 
                value={logData.product || ''}
                onChange={(e) => setLogData({...logData, product: e.target.value})}
                className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2"
              >
                <option value="">Product used...</option>
                <option value="pad">Pad</option>
                <option value="tampon">Tampon</option>
                <option value="cup">Menstrual Cup</option>
                <option value="disc">Menstrual Disc</option>
                <option value="period-underwear">Period Underwear</option>
              </select>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
              <Droplet size={18} />
              Water Intake (cups)
            </label>
            <input 
              type="number"
              value={logData.water || ''}
              onChange={(e) => setLogData({...logData, water: parseInt(e.target.value)})}
              className="w-full p-3 border-2 border-gray-200 rounded-lg"
              placeholder="8"
              min="0"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
              <Activity size={18} />
              Exercise
            </label>
            <input 
              type="text"
              value={logData.exercise || ''}
              onChange={(e) => setLogData({...logData, exercise: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-lg"
              placeholder="e.g., 30 min walk, yoga"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-orange-600 mb-2">
              <Utensils size={18} />
              Meals & Calories
            </label>
            <textarea 
              value={logData.meals || ''}
              onChange={(e) => setLogData({...logData, meals: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-lg"
              placeholder="Describe your meals (AI will estimate calories)"
              rows="3"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-purple-600 mb-2">
              <Pill size={18} />
              Supplements & Medications
            </label>
            <input 
              type="text"
              value={logData.supplements || ''}
              onChange={(e) => setLogData({...logData, supplements: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-lg"
              placeholder="e.g., Vitamin D, Iron"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">
              Symptoms (select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['cramps', 'headache', 'bloating', 'acne', 'fatigue', 'backache', 'breast-tenderness', 'nausea'].map(symptom => (
                <label key={symptom} className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox"
                    checked={logData.symptoms?.includes(symptom) || false}
                    onChange={(e) => {
                      const symptoms = logData.symptoms || [];
                      setLogData({
                        ...logData,
                        symptoms: e.target.checked 
                          ? [...symptoms, symptom]
                          : symptoms.filter(s => s !== symptom)
                      });
                    }}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{symptom.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">
              Notes
            </label>
            <textarea 
              value={logData.notes || ''}
              onChange={(e) => setLogData({...logData, notes: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-lg"
              placeholder="Any additional notes..."
              rows="2"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox"
              checked={logData.absent || false}
              onChange={(e) => setLogData({...logData, absent: e.target.checked})}
              className="w-4 h-4"
            />
            <span>Absent from work/school today</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Save Entry
            </button>
            <button 
              onClick={() => setCurrentView('calendar')}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ←
            </button>
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
            >
              Today
            </button>
            <button 
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>

        <div className="mt-6 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
            <span>Period days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-50 border-2 border-purple-200 rounded"></div>
            <span>Logged days</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="fill-current" size={32} />
            <h1 className="text-3xl font-bold">Saheli</h1>
          </div>
          <p className="text-purple-100">Your personal health companion</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-4 mb-6 border-b-2 border-gray-200">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`px-6 py-3 font-semibold transition-all ${
              currentView === 'dashboard' 
                ? 'text-purple-600 border-b-4 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('calendar')}
            className={`px-6 py-3 font-semibold transition-all ${
              currentView === 'calendar' 
                ? 'text-purple-600 border-b-4 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📅 Calendar
          </button>
          <button 
            onClick={() => {
              setSelectedDate(new Date());
              setCurrentView('log');
            }}
            className={`px-6 py-3 font-semibold transition-all ${
              currentView === 'log' 
                ? 'text-purple-600 border-b-4 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Log Entry
          </button>
        </div>

        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'calendar' && renderCalendarView()}
        {currentView === 'log' && renderLogEntry()}
      </div>
    </div>
  );
}
