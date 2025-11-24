import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import GratitudeLogList from './GratitudeLogList';
import { PlusCircle, Notebook, Heart, X, Sparkles, Star, Trophy, Calendar, Edit3, Trash2, TrendingUp } from 'lucide-react';

const GratitudeLog = ({ onClose, onEntryAdded }) => {
  const [things, setThings] = useState(['', '', '']);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [showPastLogs, setShowPastLogs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadUserStats(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserStats = (uid) => {
    // Load streak count and total entries
    const gratitudeQuery = query(
      collection(db, 'gratitude_logs'), // Updated collection name
      where('userId', '==', uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(gratitudeQuery, (snapshot) => {
      setTotalEntries(snapshot.size);
      
      // Simple streak calculation (consecutive days with entries)
      if (snapshot.size > 0) {
        calculateStreak(snapshot.docs);
      }
    });

    return unsubscribe;
  };

  const calculateStreak = (docs) => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < docs.length; i++) {
      const entryDate = docs[i].data().timestamp.toDate();
      entryDate.setHours(0, 0, 0, 0);
      
      const diffTime = today - entryDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === i) {
        streak++;
      } else {
        break;
      }
    }
    setStreakCount(streak);
  };

  const handleInputChange = (index, value) => {
    const newThings = [...things];
    newThings[index] = value;
    setThings(newThings);
  };

  const addMoreField = () => {
    if (things.length < 10) {
      setThings([...things, '']);
    }
  };

  const removeField = (index) => {
    if (things.length > 1) {
      const newThings = things.filter((_, i) => i !== index);
      setThings(newThings);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) {
      setMessage("Please sign in to save your gratitude entries");
      return;
    }

    const filteredThings = things.filter(thing => thing.trim() !== '');
    if (filteredThings.length === 0) {
      setMessage("Please write at least one thing you're grateful for");
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'gratitude_logs'), { // Updated collection name
        userId: userId,
        things: filteredThings,
        timestamp: serverTimestamp(),
        mood: 'grateful',
        tags: filteredThings.map(thing => thing.split(' ').slice(0, 2).join(' ').toLowerCase())
      });
      
      setMessage("Gratitude entry saved successfully!");
      setThings(['', '', '']);
      setIsLoading(false);
      
      // Callback for parent component
      if (onEntryAdded) {
        onEntryAdded();
      }
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error saving gratitude log:", error);
      setMessage("Failed to save. Please try again.");
      setIsLoading(false);
    }
  };

  const inspirationPrompts = [
    "A small joy I experienced today...",
    "Someone who helped or inspired me...",
    "A personal strength I used...",
    "Something beautiful I noticed...",
    "A challenge I overcame...",
    "A moment of peace I had...",
    "Something I learned today...",
    "An act of kindness I gave/received..."
  ];

  const getRandomPrompt = () => {
    return inspirationPrompts[Math.floor(Math.random() * inspirationPrompts.length)];
  };

  const getStreakMessage = () => {
    if (streakCount >= 7) return "Amazing streak! You're building a powerful habit!";
    if (streakCount >= 3) return "Great consistency! Keep going!";
    if (streakCount > 0) return "Good start! Try to log daily for maximum benefits.";
    return "Start your gratitude journey today!";
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-black dark:bg-white rounded-full">
              <Sparkles className="h-6 w-6 text-white dark:text-black" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-black dark:text-white">
                Gratitude Journal
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cultivate positivity by acknowledging the good in your life
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-black dark:text-white" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-center space-x-2">
              <Trophy className="h-5 w-5 text-black dark:text-white" />
              <span className="font-bold text-2xl text-black dark:text-white">{streakCount}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Day Streak</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-5 w-5 text-black dark:text-white" />
              <span className="font-bold text-2xl text-black dark:text-white">{totalEntries}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Entries</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="h-5 w-5 text-black dark:text-white" />
              <span className="font-bold text-lg text-black dark:text-white">{new Date().toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Today</p>
          </div>
        </div>

        {/* Streak Message */}
        {streakCount > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-6">
            <p className="text-sm text-black dark:text-white text-center font-medium">
              {getStreakMessage()}
            </p>
          </div>
        )}

        {/* Gratitude Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-black dark:text-white flex items-center">
                <Heart className="h-5 w-5 mr-2 text-black dark:text-white" />
                Today I'm grateful for...
              </h4>
              <button
                type="button"
                onClick={addMoreField}
                disabled={things.length >= 10}
                className="text-xs bg-white dark:bg-black text-black dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                + Add More
              </button>
            </div>
            
            <div className="space-y-3">
              {things.map((thing, index) => (
                <div key={index} className="flex items-center space-x-3 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center">
                    <span className="text-white dark:text-black font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={index === 0 ? getRandomPrompt() : `Another blessing... (${10 - index} fields left)`}
                      className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      value={thing}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                    />
                    {things.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Inspiration Prompts */}
            <div className="mt-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Need inspiration?</p>
              <div className="flex flex-wrap gap-2">
                {inspirationPrompts.slice(0, 3).map((prompt, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const emptyIndex = things.findIndex(t => t.trim() === '');
                      if (emptyIndex !== -1) {
                        handleInputChange(emptyIndex, prompt);
                      }
                    }}
                    className="text-xs bg-white dark:bg-black border border-gray-300 dark:border-gray-600 text-black dark:text-white px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {prompt.split(' ').slice(0, 3).join(' ')}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading || things.every(t => t.trim() === '')}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black font-semibold py-4 px-6 rounded-lg border border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:border-gray-400 dark:disabled:border-gray-600 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-black"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <PlusCircle className="h-5 w-5" />
                  <span>Save Gratitude Entry</span>
                </div>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setShowPastLogs(true)}
              className="px-6 bg-white dark:bg-black border border-gray-300 dark:border-gray-600 text-black dark:text-white font-semibold py-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <Notebook className="h-5 w-5" />
                <span>View History</span>
              </div>
            </button>
          </div>
        </form>

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center font-semibold border ${
            message.includes('successfully') 
              ? 'bg-gray-50 dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700' 
              : 'bg-gray-50 dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700'
          }`}>
            {message}
          </div>
        )}

        {/* Benefits Section */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
          <h4 className="font-semibold text-black dark:text-white mb-2 flex items-center">
            <Star className="h-4 w-4 mr-2 text-black dark:text-white" />
            Benefits of Daily Gratitude
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <span className="bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-center text-black dark:text-white">Better Mood</span>
            <span className="bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-center text-black dark:text-white">Improved Sleep</span>
            <span className="bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-center text-black dark:text-white">Less Stress</span>
            <span className="bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-center text-black dark:text-white">More Optimism</span>
          </div>
        </div>

        {/* Past Logs Modal */}
        {showPastLogs && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
              <div className="relative">
                <button
                  onClick={() => setShowPastLogs(false)}
                  className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5 text-black dark:text-white" />
                </button>
                <GratitudeLogList userId={userId} onClose={() => setShowPastLogs(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GratitudeLog;