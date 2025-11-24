import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader, 
  Brain, 
  Heart, 
  Clock, 
  Trash2,
  Mic,
  MicOff,
  Download,
  Settings,
  AlertTriangle,
  Shield,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  MessageSquare,
  Zap,
  Eye,
  Volume2,
  VolumeX,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Star,
  MoreHorizontal,
  BookOpen,
  Phone
} from 'lucide-react';

const Chatbot = ({ onClose, userProfile }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1,
      text: 'Hello! I\'m your AI wellness companion. I\'m here to provide personalized support based on your mental health journey. How can I help you today?', 
      sender: 'bot',
      timestamp: new Date().toISOString(),
      isMentalHealth: true,
      emotion: 'supportive'
    },
  ]);

  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMode, setChatMode] = useState('support'); // support, crisis, wellness-check
  const [userMood, setUserMood] = useState(null);
  const [conversationInsights, setConversationInsights] = useState({
    totalMessages: 0,
    sentimentTrend: 'neutral',
    topicsFocused: [],
    crisisIndicators: 0
  });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const chatBodyRef = useRef(null);
  const recognition = useRef(null);
  const synthesis = useRef(window.speechSynthesis);

  const API_BASE_URL = 'http://localhost:8000';

  // Enhanced quick actions based on user profile and current context
  const getQuickActions = () => {
    const baseActions = [
      { text: 'I\'m feeling anxious right now', emoji: '😰', category: 'crisis', color: 'bg-red-100 text-red-700' },
      { text: 'I need coping strategies', emoji: '🧘', category: 'support', color: 'bg-blue-100 text-blue-700' },
      { text: 'Help me understand my emotions', emoji: '🤔', category: 'wellness', color: 'bg-green-100 text-green-700' },
      { text: 'I\'m having trouble sleeping', emoji: '😴', category: 'support', color: 'bg-purple-100 text-purple-700' },
      { text: 'Can you check in on my progress?', emoji: '📈', category: 'wellness', color: 'bg-yellow-100 text-yellow-700' },
      { text: 'I need crisis support', emoji: '🆘', category: 'crisis', color: 'bg-red-200 text-red-800' }
    ];

    // Filter based on chat mode
    if (chatMode === 'crisis') {
      return baseActions.filter(action => action.category === 'crisis');
    }
    
    return baseActions.slice(0, 4);
  };

  // Crisis keywords for intelligent detection
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm', 
    'don\'t want to live', 'hopeless', 'can\'t go on', 'want to die'
  ];

  useEffect(() => {
    initializeSpeechRecognition();
    checkServerHealth();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
    updateConversationInsights();
  }, [messages]);

  useEffect(() => {
    // Auto-detect crisis mode
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'user') {
      const hasCrisisKeywords = crisisKeywords.some(keyword => 
        lastMessage.text.toLowerCase().includes(keyword)
      );
      if (hasCrisisKeywords && chatMode !== 'crisis') {
        setChatMode('crisis');
        addSystemMessage('I notice you might be in distress. I\'m here to help, and I want you to know that you\'re not alone. Would you like to talk about what you\'re experiencing?');
      }
    }
  }, [messages, chatMode]);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onend = () => setIsListening(false);
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
      };
    }
  };

  const addSystemMessage = (text) => {
    const systemMessage = {
      id: Date.now(),
      text,
      sender: 'system',
      timestamp: new Date().toISOString(),
      isSystem: true
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const updateConversationInsights = () => {
    const userMessages = messages.filter(m => m.sender === 'user');
    const crisisCount = userMessages.reduce((count, msg) => {
      const hasCrisis = crisisKeywords.some(keyword => 
        msg.text.toLowerCase().includes(keyword)
      );
      return count + (hasCrisis ? 1 : 0);
    }, 0);

    setConversationInsights({
      totalMessages: userMessages.length,
      sentimentTrend: crisisCount > 0 ? 'negative' : userMessages.length > 3 ? 'improving' : 'neutral',
      topicsFocused: ['anxiety', 'sleep', 'stress'], // This would be AI-analyzed
      crisisIndicators: crisisCount
    });
  };

  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setConnectionStatus('error');
    }
  };

  const detectEmotionFromText = (text) => {
    const emotions = {
      anxiety: ['anxious', 'worried', 'nervous', 'panic', 'fear'],
      sadness: ['sad', 'depressed', 'down', 'lonely', 'empty'],
      anger: ['angry', 'frustrated', 'mad', 'irritated', 'furious'],
      joy: ['happy', 'good', 'great', 'wonderful', 'excited'],
      neutral: []
    };

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        return emotion;
      }
    }
    return 'neutral';
  };

  const sendMessageToAPI = async (message) => {
    // Simulate typing indicator
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    setIsTyping(false);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          session_id: sessionId,
          user_mood: userMood,
          chat_mode: chatMode,
          user_profile: userProfile
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      return {
        text: data.response,
        isMentalHealth: data.is_mental_health,
        responseTime: data.response_time,
        timestamp: data.timestamp,
        emotion: data.detected_emotion || 'supportive',
        confidence: data.confidence || 85
      };
    } catch (error) {
      console.error('Error sending message to API:', error);
      
      // Provide contextual offline responses
      let offlineResponse = 'I apologize, but I\'m having trouble connecting right now. ';
      
      if (chatMode === 'crisis') {
        offlineResponse += 'Since this might be urgent, please consider contacting a crisis helpline: National Suicide Prevention Lifeline at 988 or text HOME to 741741.';
      } else {
        offlineResponse += 'Please try again in a moment. In the meantime, try some deep breathing exercises or reach out to a trusted friend.';
      }

      return {
        text: offlineResponse,
        isMentalHealth: true,
        isError: true,
        timestamp: new Date().toISOString(),
        emotion: 'supportive'
      };
    }
  };

  const handleSend = async () => {
    if (userInput.trim() === '') return;

    const userEmotion = detectEmotionFromText(userInput);
    
    const userMessage = {
      id: Date.now(),
      text: userInput,
      sender: 'user',
      timestamp: new Date().toISOString(),
      emotion: userEmotion
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const botResponse = await sendMessageToAPI(userInput);
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse.text,
        sender: 'bot',
        timestamp: botResponse.timestamp,
        isMentalHealth: botResponse.isMentalHealth,
        responseTime: botResponse.responseTime,
        isError: botResponse.isError,
        emotion: botResponse.emotion,
        confidence: botResponse.confidence
      };

      setMessages(prev => [...prev, botMessage]);
      setConnectionStatus('connected');

      // Auto-speak response if enabled
      if (isSpeaking && !botResponse.isError) {
        speakText(botResponse.text);
      }
    } catch (error) {
      console.error('Error in handleSend:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'I encountered an error. Please try again or contact support if this persists.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true,
        emotion: 'supportive'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (recognition.current && !isListening) {
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
    }
  };

  const speakText = (text) => {
    if (synthesis.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      synthesis.current.speak(utterance);
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      synthesis.current.cancel();
    }
    setIsSpeaking(!isSpeaking);
  };

  const handleQuickAction = (actionText) => {
    setUserInput(actionText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearConversation = () => {
    setMessages([
      { 
        id: 1,
        text: 'New conversation started. How can I help you today?', 
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isMentalHealth: true,
        emotion: 'supportive'
      }
    ]);
    setSessionId(null);
    setChatMode('support');
    setUserMood(null);
  };

  const exportChatHistory = () => {
    const chatData = {
      session_id: sessionId,
      messages: messages,
      insights: conversationInsights,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindoasis-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const rateMessage = (messageId, rating) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ));
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected': return { text: 'AI ONLINE', color: 'text-green-500', icon: Shield };
      case 'connecting': return { text: 'CONNECTING', color: 'text-yellow-500', icon: Loader };
      case 'error': return { text: 'OFFLINE', color: 'text-red-500', icon: AlertTriangle };
      default: return { text: 'CONNECTING', color: 'text-yellow-500', icon: Loader };
    }
  };

  const getEmotionIcon = (emotion) => {
    switch (emotion) {
      case 'anxiety': return '😰';
      case 'sadness': return '😢';
      case 'anger': return '😠';
      case 'joy': return '😊';
      case 'supportive': return '🤝';
      default: return '💬';
    }
  };

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[700px] bg-white border-4 border-black shadow-2xl flex flex-col z-50">
      
      {/* Enhanced Header */}
      <div className="bg-black text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white text-black flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                status.color === 'text-green-500' ? 'bg-green-500' : 
                status.color === 'text-yellow-500' ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                <StatusIcon className="h-2 w-2 text-white m-0.5" />
              </div>
            </div>
            <div>
              <h3 className="font-black text-sm">AI WELLNESS COMPANION</h3>
              <p className="text-xs opacity-80">{status.text}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleSpeaking}
              className="p-1 hover:bg-white hover:bg-opacity-20 transition-colors"
              title={isSpeaking ? "Disable speech" : "Enable speech"}
            >
              {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 hover:bg-white hover:bg-opacity-20 transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={exportChatHistory}
              className="p-1 hover:bg-white hover:bg-opacity-20 transition-colors"
              title="Export chat"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={clearConversation}
              className="p-1 hover:bg-white hover:bg-opacity-20 transition-colors"
              title="New conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Chat Mode Indicator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              chatMode === 'crisis' ? 'bg-red-600 text-white' :
              chatMode === 'wellness-check' ? 'bg-green-600 text-white' :
              'bg-gray-600 text-white'
            }`}>
              {chatMode.toUpperCase().replace('-', ' ')}
            </div>
            {conversationInsights.crisisIndicators > 0 && (
              <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>SUPPORT NEEDED</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-3 w-3" />
            <span>{conversationInsights.totalMessages}</span>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-100 border-b-2 border-gray-300 p-4">
          <h4 className="font-black text-sm mb-3">CONVERSATION SETTINGS</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold">Chat Mode:</label>
              <select 
                value={chatMode} 
                onChange={(e) => setChatMode(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 text-xs"
              >
                <option value="support">General Support</option>
                <option value="wellness-check">Wellness Check-in</option>
                <option value="crisis">Crisis Support</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold">Current Mood:</label>
              <div className="flex space-x-2 mt-1">
                {['positive', 'neutral', 'negative'].map(mood => (
                  <button
                    key={mood}
                    onClick={() => setUserMood(mood)}
                    className={`px-3 py-1 text-xs font-bold transition-colors ${
                      userMood === mood 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {mood === 'positive' ? '😊' : mood === 'negative' ? '😔' : '😐'} {mood.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crisis Support Banner */}
      {chatMode === 'crisis' && (
        <div className="bg-red-600 text-white p-3 text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Phone className="h-4 w-4" />
            <span className="font-black text-sm">CRISIS SUPPORT ACTIVE</span>
          </div>
          <p className="text-xs">
            Emergency: 988 • Crisis Text: 741741 • Emergency: 911
          </p>
        </div>
      )}

      {/* Enhanced Chat Body */}
      <div 
        ref={chatBodyRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.map((message, index) => (
          <div key={message.id} className={`flex ${
            message.sender === 'user' ? 'justify-end' : 
            message.sender === 'system' ? 'justify-center' :
            'justify-start'
          }`}>
            {message.sender === 'system' ? (
              <div className="bg-gray-200 text-gray-700 px-4 py-2 text-xs font-medium border border-gray-300">
                {message.text}
              </div>
            ) : (
              <div className={`max-w-[85%] group ${message.sender === 'user' ? 'ml-8' : 'mr-8'}`}>
                <div className={`rounded-2xl p-4 ${
                  message.sender === 'user' 
                    ? 'bg-black text-white rounded-br-none' 
                    : message.isError
                    ? 'bg-red-100 text-red-800 border-2 border-red-300 rounded-bl-none'
                    : 'bg-white text-black border-2 border-gray-200 rounded-bl-none'
                }`}>
                  
                  {/* Message Header */}
                  <div className="flex items-start space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3 text-black" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {/* Emotion indicator */}
                      {message.emotion && (
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-xs">{getEmotionIcon(message.emotion)}</span>
                          <span className="text-xs opacity-70 capitalize">{message.emotion}</span>
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      
                      {/* Message Footer */}
                      <div className={`flex items-center justify-between mt-3 text-xs ${
                        message.sender === 'user' 
                          ? 'text-white text-opacity-70' 
                          : 'text-gray-500'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <span>{formatTime(message.timestamp)}</span>
                          {message.responseTime && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{message.responseTime.toFixed(1)}s</span>
                            </span>
                          )}
                          {message.confidence && (
                            <span className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{message.confidence}%</span>
                            </span>
                          )}
                        </div>
                        
                        {/* Message Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyMessage(message.text)}
                            className="p-1 hover:bg-black hover:bg-opacity-10 rounded"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          {message.sender === 'bot' && !message.isError && (
                            <>
                              <button
                                onClick={() => rateMessage(message.id, 'up')}
                                className={`p-1 rounded ${
                                  message.rating === 'up' 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'hover:bg-black hover:bg-opacity-10'
                                }`}
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => rateMessage(message.id, 'down')}
                                className={`p-1 rounded ${
                                  message.rating === 'down' 
                                    ? 'bg-red-100 text-red-600' 
                                    : 'hover:bg-black hover:bg-opacity-10'
                                }`}
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Enhanced Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start mr-8">
            <div className="bg-white border-2 border-gray-200 rounded-2xl rounded-bl-none p-4 max-w-[85%]">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Bot className="h-3 w-3 text-black" />
                </div>
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isLoading && !isTyping && (
          <div className="flex justify-start mr-8">
            <div className="bg-white border-2 border-gray-200 rounded-2xl rounded-bl-none p-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Loader className="h-3 w-3 text-black animate-spin" />
                </div>
                <span className="text-xs text-gray-500">Processing your message...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 pt-3 border-t-2 border-gray-200">
          <p className="text-xs font-bold text-gray-700 mb-2">QUICK START:</p>
          <div className="grid grid-cols-2 gap-2">
            {getQuickActions().map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.text)}
                className={`text-xs px-3 py-2 rounded font-medium transition-all duration-200 ${action.color} hover:scale-105`}
              >
                <div className="flex items-center space-x-1">
                  <span>{action.emoji}</span>
                  <span className="truncate">{action.text.split(' ').slice(0, 3).join(' ')}...</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Input Area */}
      <div className="p-4 border-t-2 border-gray-200">
        <div className="flex space-x-2 mb-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Share your thoughts..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="w-full border-2 border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:border-black font-medium text-sm disabled:opacity-50 disabled:bg-gray-100"
            />
            {userInput && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-gray-500">{userInput.length}/500</span>
              </div>
            )}
          </div>
          
          {/* Voice Input */}
          {recognition.current && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={`px-3 py-3 font-bold transition-colors disabled:opacity-50 ${
                isListening 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          
          <button
            onClick={handleSend}
            disabled={isLoading || !userInput.trim()}
            className="bg-black text-white px-4 py-3 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Enhanced Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>HIPAA Compliant</span>
            </span>
            <span className="flex items-center space-x-1">
              <Heart className="h-3 w-3" />
              <span>24/7 Support</span>
            </span>
          </div>
          
          {conversationInsights.totalMessages > 0 && (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                conversationInsights.sentimentTrend === 'improving' ? 'bg-green-500' :
                conversationInsights.sentimentTrend === 'negative' ? 'bg-red-500' :
                'bg-gray-400'
              }`}></div>
              <span className="capitalize">{conversationInsights.sentimentTrend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
