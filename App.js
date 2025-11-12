import React, { useState, useEffect } from 'react';
import { Calendar, Heart, Droplet, Coffee, Dumbbell, Pill, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const SaheliApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('calendar'); // calendar, daily-log, insights
  const [userData, setUserData] = useState({});
  const [showAIInsights, setShowAIInsights] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const result = await window.storage.get('saheli-user-data');
      if (result) {
        setUserData(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No existing data found, starting fresh');
      setUserData({});
    }
  };

  const saveUserData = async (data) => {
    try {
      await window.storage.set('saheli-user-data', JSON.stringify(data));
      setUserData(data);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Calendar generation
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDayData = (date) => {
    const key = formatDateKey(date);
    return userData[key] || {};
  };

  const updateDayData = (date, newData) => {
    const key = formatDateKey(date);
    const updatedData = {
      ...userData,
      [key]: { ...userData[key], ...newData }
    };
    saveUserData(updatedData);
  };

  const getPeriodStatus = (date) => {
    const dayData = getDayData(date);
    return dayData.periodFlow || null;
  };

  // AI Insights Generator
  const generateAIInsights = () => {
    const insights = [];
    const dataPoints = Object.keys(userData).length;

    if (dataPoints < 7) {
      return [{
        type: 'info',
        message: 'Keep tracking for at least a week to get personalized health insights!'
      }];
    }

    // Analyze patterns
    const recentDays = Object.entries(userData)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .slice(0, 30);

    // Water intake analysis
    const waterDays = recentDays.filter(([_, data]) => data.waterIntake);
    if (waterDays.length > 0) {
      const avgWater = waterDays.reduce((sum, [_, data]) => sum + (data.waterIntake || 0), 0) / waterDays.length;
      if (avgWater < 6) {
        insights.push({
          type: 'warning',
          message: `Your average water intake is ${avgWater.toFixed(1)} glasses/day. Try to increase to 8 glasses for better health.`
        });
      }
    }

    // Mood pattern analysis
    const moodDays = recentDays.filter(([_, data]) => data.mood);
    const lowMoodDays = moodDays.filter(([_, data]) => ['sad', 'anxious', 'irritable'].includes(data.mood));
    if (lowMoodDays.length > moodDays.length * 0.5) {
      insights.push({
        type: 'alert',
        message: 'You\'ve been experiencing low moods frequently. Consider talking to a healthcare provider about your mental wellbeing.'
      });
    }

    // Exercise tracking
    const exerciseDays = recentDays.filter(([_, data]) => data.exercise).length;
    if (exerciseDays < 3) {
      insights.push({
        type: 'info',
        message: 'Regular exercise can help with period symptoms. Try to exercise at least 3 times a week.'
      });
    }

    // Calorie analysis
    const calorieDays = recentDays.filter(([_, data]) => data.totalCalories);
    if (calorieDays.length > 7) {
      const avgCalories = calorieDays.reduce((sum, [_, data]) => sum + (data.totalCalories || 0), 0) / calorieDays.length;
      if (avgCalories < 1200) {
        insights.push({
          type: 'warning',
          message: `Your average calorie intake (${avgCalories.toFixed(0)} cal/day) seems low. Ensure you're eating enough for your energy needs.`
        });
      }
    }

    // Period irregularity check
    const periodDays = recentDays.filter(([_, data]) => data.periodFlow);
    if (periodDays.length > 0) {
      insights.push({
        type: 'info',
        message: `You've tracked ${periodDays.length} period days in the last month. A typical cycle is 28 days with 3-7 days of bleeding.`
      });
    }

    return insights.length > 0 ? insights : [{
      type: 'success',
      message: 'Great job tracking! Your health patterns look good. Keep it up!'
    }];
  };

  // Calendar View Component
  const CalendarView = () => {
    const days = getDaysInMonth(currentDate);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    const changeMonth = (delta) => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-pink-600">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="aspect-square" />;
              
              const periodStatus = getPeriodStatus(day);
              const dayData = getDayData(day);
              const isToday = formatDateKey(day) === formatDateKey(new Date());
              const hasData = Object.keys(dayData).length > 0;

              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedDate(day);
                    setView('daily-log');
                  }}
                  className={`aspect-square p-2 rounded-lg border-2 transition-all hover:shadow-md relative
                    ${isToday ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}
                    ${periodStatus ? 'bg-red-100' : hasData ? 'bg-blue-50' : 'bg-white'}
                  `}
                >
                  <div className="text-sm font-semibold">{day.getDate()}</div>
                  {periodStatus && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <Droplet className="w-4 h-4 text-red-500 fill-current" />
                    </div>
                  )}
                  {hasData && !periodStatus && (
                    <div className="absolute bottom-1 right-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex gap-4 justify-center">
            <button
              onClick={() => setShowAIInsights(!showAIInsights)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <TrendingUp className="w-5 h-5" />
              AI Health Insights
            </button>
          </div>

          {showAIInsights && (
            <div className="mt-6 space-y-3">
              {generateAIInsights().map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'alert' ? 'bg-red-50 border-red-500' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                    insight.type === 'success' ? 'bg-green-50 border-green-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                      insight.type === 'alert' ? 'text-red-500' :
                      insight.type === 'warning' ? 'text-yellow-500' :
                      insight.type === 'success' ? 'text-green-500' :
                      'text-blue-500'
                    }`} />
                    <p className="text-sm">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Daily Log Component
  const DailyLogView = () => {
    const dayData = getDayData(selectedDate);
    const [meals, setMeals] = useState(dayData.meals || []);
    const [currentMeal, setCurrentMeal] = useState('');

    const estimateCalories = (mealDescription) => {
      const lowCalWords = ['salad', 'fruit', 'vegetables', 'soup'];
      const medCalWords = ['rice', 'bread', 'pasta', 'chicken', 'fish'];
      const highCalWords = ['pizza', 'burger', 'fries', 'cake', 'ice cream', 'fried'];

      const lower = mealDescription.toLowerCase();
      if (highCalWords.some(word => lower.includes(word))) return 600;
      if (medCalWords.some(word => lower.includes(word))) return 400;
      if (lowCalWords.some(word => lower.includes(word))) return 200;
      return 350;
    };

    const addMeal = () => {
      if (!currentMeal.trim()) return;
      const calories = estimateCalories(currentMeal);
      const newMeals = [...meals, { description: currentMeal, calories }];
      setMeals(newMeals);
      const totalCalories = newMeals.reduce((sum, m) => sum + m.calories, 0);
      updateDayData(selectedDate, { meals: newMeals, totalCalories });
      setCurrentMeal('');
    };

    const updateField = (field, value) => {
      updateDayData(selectedDate, { [field]: value });
    };

    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setView('calendar')}
              className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Calendar
            </button>
            <h2 className="text-xl font-bold text-pink-600">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Period Tracking */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-red-500" />
                Period Flow
              </h3>
              <div className="flex gap-2">
                {['none', 'spotting', 'light', 'medium', 'heavy'].map(flow => (
                  <button
                    key={flow}
                    onClick={() => updateField('periodFlow', flow)}
                    className={`px-4 py-2 rounded-lg capitalize ${
                      dayData.periodFlow === flow
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {flow}
                  </button>
                ))}
              </div>
              
              {dayData.periodFlow && dayData.periodFlow !== 'none' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-2">Product Used</label>
                  <select
                    value={dayData.periodProduct || ''}
                    onChange={(e) => updateField('periodProduct', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select...</option>
                    <option value="pad">Pad</option>
                    <option value="tampon">Tampon</option>
                    <option value="cup">Menstrual Cup</option>
                    <option value="disc">Menstrual Disc</option>
                    <option value="period-underwear">Period Underwear</option>
                  </select>
                </div>
              )}
            </div>

            {/* Mood Tracking */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Mood
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {['happy', 'sad', 'anxious', 'irritable', 'energetic', 'tired', 'calm', 'stressed'].map(mood => (
                  <button
                    key={mood}
                    onClick={() => updateField('mood', mood)}
                    className={`px-3 py-2 rounded-lg capitalize text-sm ${
                      dayData.mood === mood
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Meals & Calories */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-orange-500" />
                Meals & Nutrition
              </h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentMeal}
                  onChange={(e) => setCurrentMeal(e.target.value)}
                  placeholder="Describe your meal..."
                  className="flex-1 p-2 border rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && addMeal()}
                />
                <button
                  onClick={addMeal}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {meals.length > 0 && (
                <div className="space-y-2">
                  {meals.map((meal, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{meal.description}</span>
                      <span className="text-sm font-semibold text-orange-600">~{meal.calories} cal</span>
                    </div>
                  ))}
                  <div className="text-right font-bold text-lg text-orange-600 mt-2">
                    Total: {dayData.totalCalories || 0} calories
                  </div>
                </div>
              )}
            </div>

            {/* Exercise */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-green-500" />
                Exercise
              </h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dayData.exercise || false}
                    onChange={(e) => updateField('exercise', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span>Exercised today</span>
                </label>
                {dayData.exercise && (
                  <input
                    type="text"
                    value={dayData.exerciseType || ''}
                    onChange={(e) => updateField('exerciseType', e.target.value)}
                    placeholder="What type?"
                    className="flex-1 p-2 border rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* Water & Supplements */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-blue-500" />
                Water Intake
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={dayData.waterIntake || 0}
                  onChange={(e) => updateField('waterIntake', parseInt(e.target.value) || 0)}
                  className="w-24 p-2 border rounded-lg"
                  min="0"
                  max="20"
                />
                <span>glasses</span>
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-500" />
                Supplements
              </h3>
              <input
                type="text"
                value={dayData.supplements || ''}
                onChange={(e) => updateField('supplements', e.target.value)}
                placeholder="List supplements taken..."
                className="w-full p-2 border rounded-lg"
              />
            </div>

            {/* Symptoms & Notes */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Symptoms & Notes</h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {['cramps', 'headache', 'bloating', 'acne', 'fatigue', 'nausea'].map(symptom => (
                  <button
                    key={symptom}
                    onClick={() => {
                      const symptoms = dayData.symptoms || [];
                      const newSymptoms = symptoms.includes(symptom)
                        ? symptoms.filter(s => s !== symptom)
                        : [...symptoms, symptom];
                      updateField('symptoms', newSymptoms);
                    }}
                    className={`px-3 py-2 rounded-lg capitalize text-sm ${
                      (dayData.symptoms || []).includes(symptom)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
              <textarea
                value={dayData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Additional notes about your day..."
                className="w-full p-3 border rounded-lg h-24"
              />
            </div>

            {/* Absent from work/school */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dayData.absent || false}
                  onChange={(e) => updateField('absent', e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-medium">Absent from work/school due to period symptoms</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500 fill-current" />
            <h1 className="text-2xl font-bold text-pink-600">Saheli</h1>
          </div>
          <p className="text-sm text-gray-600">Your personal health companion</p>
        </div>
      </header>

      <main className="py-6">
        {view === 'calendar' && <CalendarView />}
        {view === 'daily-log' && <DailyLogView />}
      </main>
    </div>
  );
};

export default SaheliApp;
