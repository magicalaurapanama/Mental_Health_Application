import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  PlayCircle, 
  PauseCircle, 
  Square,
  Clock,
  Brain,
  Moon,
  Zap,
  Waves,
  Wind,
  Mountain,
  Timer,
  Volume2,
  VolumeX,
  Settings,
  Award,
  Activity
} from 'lucide-react';

const MeditationPopup = ({ onClose, onMeditationComplete }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sessionTime, setSessionTime] = useState(300);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionPhase, setSessionPhase] = useState('setup'); // setup, active, paused, complete
  const [breathingPhase, setBreathingPhase] = useState('inhale');
  const [breathingCycle, setBreathingCycle] = useState(0);
  const timerRef = useRef(null);
  const breathingRef = useRef(null);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Meditation session types with programmatically generated audio
  const meditationSessions = [
    {
      id: 'stress-relief',
      title: 'STRESS RELIEF',
      description: 'Calm your mind with soothing 432Hz healing frequency',
      duration: 300,
      frequency: 432,
      category: 'HEALING',
      icon: Brain,
      breathingPattern: [4, 4, 4], // inhale, hold, exhale seconds
      waveType: 'sine',
      backgroundNoise: 'pink'
    },
    {
      id: 'deep-focus',
      title: 'DEEP FOCUS',
      description: 'Enhance concentration with 40Hz gamma brain waves',
      duration: 600,
      frequency: 40,
      category: 'FOCUS',
      icon: Zap,
      breathingPattern: [6, 2, 6],
      waveType: 'sawtooth',
      backgroundNoise: 'white'
    },
    {
      id: 'sleep-prep',
      title: 'SLEEP PREPARATION',
      description: 'Deep relaxation with 8Hz theta waves for sleep',
      duration: 900,
      frequency: 8,
      category: 'SLEEP',
      icon: Moon,
      breathingPattern: [4, 7, 8],
      waveType: 'sine',
      backgroundNoise: 'brown'
    },
    {
      id: 'anxiety-calm',
      title: 'ANXIETY RELIEF',
      description: 'Reduce anxiety with 528Hz love frequency',
      duration: 480,
      frequency: 528,
      category: 'HEALING',
      icon: Waves,
      breathingPattern: [4, 4, 6],
      waveType: 'sine',
      backgroundNoise: 'pink'
    },
    {
      id: 'energy-boost',
      title: 'ENERGY BOOST',
      description: 'Revitalize with 18Hz beta waves for alertness',
      duration: 360,
      frequency: 18,
      category: 'ENERGY',
      icon: Mountain,
      breathingPattern: [3, 3, 3],
      waveType: 'triangle',
      backgroundNoise: 'white'
    },
    {
      id: 'mindfulness',
      title: 'MINDFULNESS',
      description: 'Present awareness with 10Hz alpha brain waves',
      duration: 720,
      frequency: 10,
      category: 'AWARENESS',
      icon: Wind,
      breathingPattern: [5, 5, 5],
      waveType: 'sine',
      backgroundNoise: 'pink'
    }
  ];

  // Initialize Web Audio API
  const initializeAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume, audioContextRef.current.currentTime);
    }
  };

  // Generate tone with specified frequency
  const startTone = (frequency, waveType = 'sine') => {
    if (oscillatorRef.current) {
      stopTone();
    }
    
    initializeAudio();
    
    oscillatorRef.current = audioContextRef.current.createOscillator();
    oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    oscillatorRef.current.type = waveType;
    oscillatorRef.current.connect(gainNodeRef.current);
    oscillatorRef.current.start();
  };

  const stopTone = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
  };

  useEffect(() => {
    if (sessionPhase === 'active' && isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= sessionTime) {
            completeSession();
            return sessionTime;
          }
          return prev + 1;
        });
      }, 1000);

      // Breathing animation cycle
      if (selectedSession) {
        const [inhale, hold, exhale] = selectedSession.breathingPattern;
        const totalCycle = (inhale + hold + exhale) * 1000;
        
        breathingRef.current = setInterval(() => {
          setBreathingCycle(prev => (prev + 1) % 3);
        }, totalCycle / 3);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathingRef.current) clearInterval(breathingRef.current);
    };
  }, [sessionPhase, isPlaying, sessionTime, selectedSession]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume, 
        audioContextRef.current?.currentTime || 0
      );
    }
  }, [volume, isMuted]);

  useEffect(() => {
    // Update breathing phase based on cycle
    const phases = ['inhale', 'hold', 'exhale'];
    setBreathingPhase(phases[breathingCycle]);
  }, [breathingCycle]);

  const startSession = (session) => {
    setSelectedSession(session);
    setSessionTime(session.duration);
    setCurrentTime(0);
    setSessionPhase('active');
    setIsPlaying(true);
    startTone(session.frequency, session.waveType);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopTone();
      setSessionPhase('paused');
    } else {
      if (selectedSession) {
        startTone(selectedSession.frequency, selectedSession.waveType);
      }
      setSessionPhase('active');
    }
    setIsPlaying(!isPlaying);
  };

  const stopSession = () => {
    stopTone();
    setIsPlaying(false);
    setSessionPhase('setup');
    setSelectedSession(null);
    setCurrentTime(0);
    setBreathingCycle(0);
  };

  const completeSession = () => {
    stopTone();
    setIsPlaying(false);
    setSessionPhase('complete');
    if (onMeditationComplete) {
      onMeditationComplete(Math.floor(sessionTime / 60));
    }
  };

  const handleClose = () => {
    stopTone();
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingInstruction = () => {
    if (!selectedSession) return 'PREPARE TO BEGIN';
    const pattern = selectedSession.breathingPattern;
    switch (breathingPhase) {
      case 'inhale':
        return `BREATHE IN (${pattern[0]}s)`;
      case 'hold':
        return `HOLD (${pattern[1]}s)`;
      case 'exhale':
        return `BREATHE OUT (${pattern[2]}s)`;
      default:
        return 'FOLLOW THE RHYTHM';
    }
  };

  const getBreathingCircleScale = () => {
    switch (breathingPhase) {
      case 'inhale':
        return 'scale-150';
      case 'hold':
        return 'scale-150';
      case 'exhale':
        return 'scale-100';
      default:
        return 'scale-100';
    }
  };

  const progress = sessionTime > 0 ? (currentTime / sessionTime) * 100 : 0;

  if (sessionPhase === 'setup') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
        <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          
          {/* Header */}
          <div className="bg-black text-white p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white text-black flex items-center justify-center">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black" style={{ 
                  fontFamily: '"Helvetica Neue", "Arial Black", sans-serif' 
                }}>
                  MEDITATION CENTER
                </h3>
                <p className="text-sm opacity-80">Choose your wellness journey</p>
              </div>
            </div>
            
            <button onClick={handleClose} className="p-2 hover:bg-white hover:bg-opacity-20 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Session Selection */}
          <div className="p-6">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-black mb-4">SELECT MEDITATION TYPE</h4>
              <div className="w-16 h-1 bg-black mx-auto mb-4"></div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Each session uses specific frequencies scientifically proven to enhance different states of consciousness
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meditationSessions.map((session) => {
                const IconComponent = session.icon;
                return (
                  <div
                    key={session.id}
                    onClick={() => startSession(session)}
                    className="border-4 border-gray-300 p-6 cursor-pointer transition-all duration-300 hover:border-black hover:bg-gray-50 group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <IconComponent className="w-10 h-10 group-hover:scale-110 transition-transform" />
                      <div className="text-right">
                        <div className="text-xs font-black bg-gray-100 px-2 py-1 group-hover:bg-black group-hover:text-white">
                          {session.category}
                        </div>
                        <div className="text-xs mt-1 font-mono">{session.frequency}Hz</div>
                      </div>
                    </div>
                    
                    <h5 className="text-lg font-black mb-2">{session.title}</h5>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {session.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <Timer className="w-3 h-3" />
                        <span>{Math.floor(session.duration / 60)} MIN</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3" />
                        <span>{session.breathingPattern.join('-')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Benefits Section */}
            <div className="mt-12 p-6 border-4 border-gray-300">
              <h5 className="text-lg font-black mb-4 text-center">MEDITATION BENEFITS</h5>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <Brain className="w-8 h-8 mx-auto mb-2" />
                  <h6 className="font-black text-sm mb-1">NEURAL PLASTICITY</h6>
                  <p className="text-xs text-gray-600">Enhances brain structure & function</p>
                </div>
                <div>
                  <Waves className="w-8 h-8 mx-auto mb-2" />
                  <h6 className="font-black text-sm mb-1">STRESS REDUCTION</h6>
                  <p className="text-xs text-gray-600">Lowers cortisol & anxiety levels</p>
                </div>
                <div>
                  <Zap className="w-8 h-8 mx-auto mb-2" />
                  <h6 className="font-black text-sm mb-1">FOCUS BOOST</h6>
                  <p className="text-xs text-gray-600">Improves attention & clarity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-2xl shadow-2xl">
        
        {/* Header */}
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white text-black flex items-center justify-center">
              {selectedSession && <selectedSession.icon className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black">
                {selectedSession ? selectedSession.title : 'MEDITATION'}
              </h3>
              <p className="text-sm opacity-80">
                {selectedSession ? `${selectedSession.frequency}Hz ${selectedSession.category}` : ''}
              </p>
            </div>
          </div>
          
          <button onClick={handleClose} className="p-2 hover:bg-white hover:bg-opacity-20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Session Complete */}
        {sessionPhase === 'complete' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-black text-white flex items-center justify-center mx-auto mb-6">
              <Award className="h-10 w-10" />
            </div>
            <h4 className="text-2xl font-black mb-4">SESSION COMPLETE!</h4>
            <p className="text-lg mb-6">
              You meditated for <strong>{Math.floor(sessionTime / 60)} minutes</strong>
            </p>
            <div className="space-y-3">
              <button
                onClick={stopSession}
                className="w-full bg-black text-white py-3 font-black hover:bg-gray-800"
              >
                NEW SESSION
              </button>
              <button
                onClick={handleClose}
                className="w-full border-2 border-black text-black py-3 font-black hover:bg-black hover:text-white"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}

        {/* Active Session */}
        {(sessionPhase === 'active' || sessionPhase === 'paused') && (
          <div className="p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(sessionTime)}</span>
              </div>
              <div className="w-full bg-gray-200 h-2">
                <div 
                  className="bg-black h-2 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Breathing Guide */}
            <div className="text-center mb-8">
              <div className="relative mb-6">
                <div 
                  className={`w-32 h-32 mx-auto border-4 border-black rounded-full transition-transform duration-1000 ${getBreathingCircleScale()}`}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-black mb-1">
                        {breathingPhase.toUpperCase()}
                      </div>
                      <div className="text-xs font-mono">
                        {selectedSession?.frequency}Hz
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <h4 className="text-xl font-black mb-2">
                {getBreathingInstruction()}
              </h4>
              <p className="text-sm text-gray-600">
                Follow the circle rhythm and focus on the frequency tone
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button
                onClick={togglePlayPause}
                className="bg-black text-white p-4 hover:bg-gray-800 transition-colors"
              >
                {isPlaying ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
              </button>
              
              <button
                onClick={stopSession}
                className="bg-gray-200 text-black p-4 hover:bg-gray-300 transition-colors"
              >
                <Square className="w-6 h-6" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-gray-100"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24"
                disabled={isMuted}
              />
              
              <span className="text-sm font-mono w-8">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeditationPopup;
