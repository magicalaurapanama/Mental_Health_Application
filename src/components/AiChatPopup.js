import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader, 
  Heart, 
  Shield, 
  Clock,
  Globe,
  Languages,
  ChevronDown,
  Settings,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';

const AIChatPopup = ({ onClose, onChatStarted }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Voice features state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  // API base URL
  const API_BASE_URL = 'http://localhost:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkServerHealth();
    fetchLanguages();
    initializeSpeechFeatures();
    
    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          role: 'assistant',
          content: 'Hello! I\'m your AI wellness companion. I\'m here to provide support and guidance. How are you feeling today?',
          timestamp: new Date().toISOString(),
          isMentalHealth: true
        }
      ]);
    }

    return () => {
      // Cleanup speech recognition and synthesis
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const initializeSpeechFeatures = () => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = selectedLanguage;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        setInputMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        addSystemMessage(`Voice input error: ${event.error}. Please try again.`);
      };
    }

    // Load available voices for speech synthesis
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Prefer female voices for mental health context
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || voice.name.includes('woman') || voice.name.includes('Samantha')
      ) || voices[0];
      
      setSelectedVoice(preferredVoice);
    };

    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
  };

  const startListening = () => {
    if (!speechSupported) {
      addSystemMessage('Speech recognition is not supported in your browser.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
    addSystemMessage(`Voice responses ${!voiceEnabled ? 'enabled' : 'disabled'}.`);
  };

  const addSystemMessage = (content) => {
    const systemMessage = {
      id: Date.now(),
      role: 'system',
      content: content,
      timestamp: new Date().toISOString(),
      isSystem: true
    };
    setMessages(prev => [...prev, systemMessage]);
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

  const fetchLanguages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/languages`);
      if (response.ok) {
        const languageData = await response.json();
        setLanguages(languageData);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const translateMessage = async (text, targetLang) => {
    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          target_lang: targetLang,
          source_lang: 'auto'
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.translated_text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  };

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      isVoice: isListening
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    if (onChatStarted && messages.length === 1) {
      onChatStarted();
    }

    try {
      let messageForAPI = messageToSend;
      if (selectedLanguage !== 'en') {
        setIsTranslating(true);
        messageForAPI = await translateMessage(messageToSend, 'en');
        setIsTranslating(false);
      }

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageForAPI,
          session_id: sessionId,
          language: selectedLanguage
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!sessionId) {
        setSessionId(data.session_id);
      }

      let finalResponse = data.response;
      if (selectedLanguage !== 'en') {
        setIsTranslating(true);
        finalResponse = await translateMessage(data.response, selectedLanguage);
        setIsTranslating(false);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: finalResponse,
        timestamp: data.timestamp,
        isMentalHealth: data.is_mental_health,
        responseTime: data.response_time,
        originalLang: selectedLanguage !== 'en' ? 'en' : null,
        translatedLang: selectedLanguage !== 'en' ? selectedLanguage : null
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConnectionStatus('connected');

      // Speak the response if voice is enabled
      if (voiceEnabled && !isTranslating) {
        setTimeout(() => speakText(finalResponse), 300);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment. If this continues, you might want to reach out to a mental health professional directly.',
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
      setIsTranslating(false);
      if (isListening) {
        stopListening();
      }
    }
  };

  const quickReplies = [
    "I'm feeling anxious today",
    "How can I manage stress?",
    "I'm having trouble sleeping",
    "What are some coping strategies?",
    "I'm feeling overwhelmed",
    "Can you help me relax?"
  ];

  const handleQuickReply = (reply) => {
    setInputMessage(reply);
    // Auto-send quick replies after a short delay
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      sendMessage(fakeEvent);
    }, 100);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Shield className="h-3 w-3 text-green-500" />;
      case 'connecting':
        return <Loader className="h-3 w-3 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Loader className="h-3 w-3 text-yellow-500 animate-spin" />;
    }
  };

  const getLanguageName = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : 'English';
  };

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    setShowLanguageDropdown(false);
    
    // Update speech recognition language
    if (recognitionRef.current) {
      recognitionRef.current.lang = langCode;
    }
    
    addSystemMessage(`Language changed to ${getLanguageName(langCode)}. I'll now respond in this language.`);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-white text-black flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-1 -right-1">
                {getConnectionStatusIcon()}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-black" style={{ 
                fontFamily: '"Helvetica Neue", "Arial Black", sans-serif' 
              }}>
                AI WELLNESS COMPANION
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <span className="opacity-80">
                  {connectionStatus === 'connected' ? 'ONLINE & READY' : 
                   connectionStatus === 'connecting' ? 'CONNECTING...' : 
                   'CONNECTION ERROR'}
                </span>
                
                {isTranslating && (
                  <div className="flex items-center space-x-1">
                    <Languages className="h-3 w-3 animate-pulse" />
                    <span>TRANSLATING...</span>
                  </div>
                )}

                {/* Voice Status Indicators */}
                {speechSupported && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleVoice}
                      className={`p-1 rounded transition-colors ${
                        voiceEnabled ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                      title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                    >
                      {voiceEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                    </button>
                    
                    {isSpeaking && (
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <div className="flex space-x-1">
                          <div className="h-1 w-1 bg-yellow-400 rounded-full animate-pulse"></div>
                          <div className="h-1 w-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="h-1 w-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="text-xs">SPEAKING</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center space-x-2 bg-white text-black px-4 py-2 font-bold text-sm hover:bg-gray-100 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{getLanguageName(selectedLanguage)}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white border-2 border-black max-h-48 overflow-y-auto w-48 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        selectedLanguage === lang.code ? 'bg-black text-white font-bold' : 'text-black'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 
                              message.role === 'system' ? 'justify-center' : 'justify-start'}`}
            >
              {message.role === 'system' ? (
                <div className="bg-gray-200 text-gray-700 px-4 py-2 text-sm font-medium border border-gray-300">
                  {message.content}
                </div>
              ) : (
                <div
                  className={`flex max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3`}
                >
                  <div
                    className={`flex items-center justify-center h-10 w-10 flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-black text-white ml-3'
                        : 'bg-gray-200 text-black mr-3'
                    }`}
                  >
                    {message.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  
                  <div
                    className={`p-4 ${
                      message.role === 'user'
                        ? 'bg-black text-white'
                        : message.isError
                        ? 'bg-red-100 text-red-800 border-2 border-red-300'
                        : 'bg-white text-black border-2 border-gray-200 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap font-medium">{message.content}</p>
                    
                    <div className={`flex items-center justify-between mt-3 text-xs ${
                      message.role === 'user' ? 'text-gray-300' : 
                      message.isError ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      <span className="font-bold">{formatTime(message.timestamp)}</span>
                      
                      <div className="flex items-center space-x-3">
                        {message.responseTime && (
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{message.responseTime.toFixed(1)}s</span>
                          </span>
                        )}
                        {message.isMentalHealth && (
                          <span className="flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>WELLNESS</span>
                          </span>
                        )}
                        {message.translatedLang && (
                          <span className="flex items-center space-x-1">
                            <Languages className="h-3 w-3" />
                            <span>TRANSLATED</span>
                          </span>
                        )}
                        {message.isVoice && (
                          <span className="flex items-center space-x-1">
                            <Mic className="h-3 w-3" />
                            <span>VOICE</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {(isLoading || isTranslating) && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-3">
                <div className="flex items-center justify-center h-10 w-10 bg-gray-200 text-black">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="bg-white border-2 border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-black rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="h-2 w-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-600">
                      {isTranslating ? 'TRANSLATING...' : 'THINKING...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.filter(m => m.role !== 'system').length <= 1 && (
          <div className="px-6 py-4 border-t-2 border-gray-200">
            <p className="text-sm font-bold text-gray-700 mb-3">QUICK STARTERS:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="text-xs bg-gray-100 hover:bg-black hover:text-white text-gray-800 px-3 py-2 border border-gray-300 transition-all duration-200 font-medium"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={sendMessage} className="p-6 border-t-2 border-gray-200">
          <div className="flex space-x-3 mb-4">
            {/* Voice Input Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={handleMicClick}
                className={`flex items-center justify-center w-12 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-gray-200 hover:bg-gray-300 text-black'
                } transition-colors font-bold`}
                disabled={isLoading || isTranslating}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            )}

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isListening 
                  ? "Listening... Speak now..." 
                  : `Type your message in ${getLanguageName(selectedLanguage)}...`
              }
              className="flex-1 border-2 border-gray-300 px-4 py-3 focus:outline-none focus:border-black font-medium"
              disabled={isLoading || isTranslating || isListening}
            />
            
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading || isTranslating || isListening}
              className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white px-6 py-3 transition-colors font-bold"
            >
              {(isLoading || isTranslating) ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {/* Voice Controls and Disclaimer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {speechSupported && (
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <span className="font-bold">VOICE CONTROLS:</span>
                  <button
                    onClick={handleMicClick}
                    className={`px-2 py-1 border rounded ${
                      isListening ? 'bg-red-100 border-red-300' : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    {isListening ? 'STOP LISTENING' : 'START LISTENING'}
                  </button>
                  <button
                    onClick={toggleVoice}
                    className={`px-2 py-1 border rounded ${
                      voiceEnabled ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    {voiceEnabled ? 'VOICE ON' : 'VOICE OFF'}
                  </button>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="px-2 py-1 bg-yellow-100 border border-yellow-300 rounded"
                    >
                      STOP SPEAKING
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-100 p-3 border-l-4 border-black max-w-md">
              <p className="text-xs text-gray-700 font-medium">
                <strong>DISCLAIMER:</strong> This AI provides wellness support but is not a substitute for professional medical care. 
                {speechSupported && " Voice features require browser permission."}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIChatPopup;