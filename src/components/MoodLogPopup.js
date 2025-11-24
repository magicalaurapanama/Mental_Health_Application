import React, { useState } from 'react';
import { X, Brain, Sparkles, TrendingUp, Clock, Calendar, Zap } from 'lucide-react';
import { db, auth } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const MoodLogPopup = ({ onClose, onMoodLogged }) => {
  const [mood, setMood] = useState(null);
  const [entry, setEntry] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [moodIntensity, setMoodIntensity] = useState(5);
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState('');

  const moods = [
    { emoji: '😊', label: 'Happy', color: 'bg-green-100 dark:bg-green-900', score: 8 },
    { emoji: '🙂', label: 'Good', color: 'bg-blue-100 dark:bg-blue-900', score: 6 },
    { emoji: '😐', label: 'Neutral', color: 'bg-gray-100 dark:bg-gray-900', score: 5 },
    { emoji: '😟', label: 'Anxious', color: 'bg-yellow-100 dark:bg-yellow-900', score: 4 },
    { emoji: '😞', label: 'Sad', color: 'bg-indigo-100 dark:bg-indigo-900', score: 3 },
    { emoji: '😡', label: 'Angry', color: 'bg-red-100 dark:bg-red-900', score: 2 },
    { emoji: '😴', label: 'Tired', color: 'bg-purple-100 dark:bg-purple-900', score: 4 },
    { emoji: '😰', label: 'Stressed', color: 'bg-orange-100 dark:bg-orange-900', score: 3 },
  ];

  const predefinedTags = ['Work', 'Family', 'Friends', 'Health', 'Sleep', 'Exercise', 'Weather', 'Hobbies'];

  const API_BASE_URL = 'http://localhost:8000';

  const generateAIInsight = async (moodData) => {
    setIsGeneratingInsight(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moodData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insight');
      }

      const data = await response.json();
      setAiInsight(data.insight);
    } catch (error) {
      console.error('Error generating AI insight:', error);
      setAiInsight('Unable to generate insights at the moment. Your feelings are valid and important.');
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleSave = async () => {
    if (!mood || !entry.trim()) {
      setMessage('Please select a mood and write an entry.');
      return;
    }

    setIsSaving(true);
    setMessage('Saving your mood log...');

    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage('You must be logged in to save your mood log.');
        setIsSaving(false);
        return;
      }

      const selectedMood = moods.find(m => m.label === mood);
      const moodData = {
        mood: mood,
        moodScore: selectedMood.score,
        intensity: moodIntensity,
        entry: entry,
        tags: tags,
        timestamp: new Date().toISOString()
      };

      // Generate AI insight before saving
      await generateAIInsight(moodData);

      // Save to Firebase
      const docRef = await addDoc(collection(db, 'mood_logs'), {
        userId: user.uid,
        ...moodData,
        aiInsight: aiInsight,
        timestamp: serverTimestamp(),
      });

      setMessage('Mood log saved successfully!');
      
      // Callback for parent component
      if (onMoodLogged) {
        onMoodLogged(selectedMood.score);
      }

      // Reset form after delay
      setTimeout(() => {
        setMood(null);
        setEntry('');
        setTags([]);
        setMoodIntensity(5);
        setAiInsight('');
      }, 2000);

    } catch (error) {
      console.error('Error saving mood log:', error);
      setMessage('Failed to save mood log. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTagToggle = (tag) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const getMoodScore = () => {
    const selected = moods.find(m => m.label === mood);
    return selected ? selected.score : 5;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-black dark:bg-white rounded-full">
              <Brain className="h-6 w-6 text-white dark:text-black" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-black dark:text-white">Mood Journal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track your emotions and gain insights</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-black dark:text-white" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Left Column - Input */}
          <div className="space-y-6">
            
            {/* Mood Selection */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <h4 className="font-semibold text-black dark:text-white mb-4 flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                How are you feeling today?
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {moods.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => setMood(m.label)}
                    className={`p-3 rounded-lg text-2xl transition-all border-2 ${
                      mood === m.label 
                        ? 'border-black dark:border-white scale-105 shadow-md' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    } ${m.color} focus:outline-none`}
                  >
                    {m.emoji}
                    <div className="text-xs mt-1 text-black dark:text-white">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Intensity */}
            {mood && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <h4 className="font-semibold text-black dark:text-white mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Intensity: {moodIntensity}/10
                </h4>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodIntensity}
                  onChange={(e) => setMoodIntensity(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <h4 className="font-semibold text-black dark:text-white mb-3">What influenced your mood?</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {predefinedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      tags.includes(tag)
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'bg-white dark:bg-black border-gray-300 dark:border-gray-600 text-black dark:text-white hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Add custom tag..."
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-black text-black dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                />
                <button
                  onClick={addCustomTag}
                  className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-lg text-sm border border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Journal Entry */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <h4 className="font-semibold text-black dark:text-white mb-3">Journal Entry</h4>
              <textarea
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="What's on your mind? Describe your day, thoughts, or anything that affected your mood..."
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {entry.length}/500 characters
              </div>
            </div>
          </div>

          {/* Right Column - AI Insights */}
          <div className="space-y-6">
            
            {/* Current Mood Summary */}
            {mood && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <h4 className="font-semibold text-black dark:text-white mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Mood Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Mood:</span>
                    <span className="font-semibold text-black dark:text-white">{mood} {moods.find(m => m.label === mood)?.emoji}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Intensity:</span>
                    <span className="font-semibold text-black dark:text-white">{moodIntensity}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Score:</span>
                    <span className="font-semibold text-black dark:text-white">{getMoodScore()}/10</span>
                  </div>
                  {tags.length > 0 && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map(tag => (
                          <span key={tag} className="bg-white dark:bg-black border border-gray-300 dark:border-gray-600 px-2 py-1 rounded text-xs text-black dark:text-white">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Insights */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <h4 className="font-semibold text-black dark:text-white mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                AI Insights
              </h4>
              {isGeneratingInsight ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                  <span className="ml-2 text-black dark:text-white">Analyzing your mood...</span>
                </div>
              ) : aiInsight ? (
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-sm text-black dark:text-white leading-relaxed">{aiInsight}</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your AI insights will appear here after saving your mood entry.
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || !mood || !entry.trim()}
              className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3 px-4 rounded-lg border border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:border-gray-400 dark:disabled:border-gray-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-black"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  <span>Save Mood & Get Insights</span>
                </>
              )}
            </button>

            {message && (
              <div className={`p-3 rounded-lg text-center font-semibold border ${
                message.includes('successfully') 
                  ? 'bg-gray-50 dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700' 
                  : 'bg-gray-50 dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodLogPopup;