from fastapi import FastAPI, HTTPException, Request, status, UploadFile, File, Form
from fastapi.responses import JSONResponse, HTMLResponse, StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union
import logging
import sys
import time
import json
import uuid
from datetime import datetime
import uvicorn
import os
import io
import base64
import tempfile
import aiofiles
import asyncio
import re
from datetime import datetime
from rag import MentalHealthRAG
from deep_translator import GoogleTranslator
import redis.asyncio as redis  # Add Redis import
import pickle  # For serialization

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mental_health_server.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("mental_health_server")

# Redis configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
CACHE_TTL = int(os.getenv("CACHE_TTL", 3600))  # 1 hour default

# Pydantic models (existing models remain the same)
class ChatMessage(BaseModel):
    message: str = Field(..., description="User message")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    language: Optional[str] = Field("en", description="Language code for translation (default: en)")

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response")
    session_id: str = Field(..., description="Session ID")
    is_mental_health: bool = Field(..., description="Whether query was mental health related")
    response_time: float = Field(..., description="Response time in seconds")
    timestamp: str = Field(..., description="Response timestamp")
    detected_language: Optional[str] = Field(None, description="Detected language of input")
    target_language: Optional[str] = Field(None, description="Target language of response")

class VoiceChatResponse(ChatResponse):
    audio_url: Optional[str] = Field(None, description="URL to generated audio file")
    audio_duration: Optional[float] = Field(None, description="Duration of audio in seconds")

class SessionInfo(BaseModel):
    session_id: str = Field(..., description="Session ID")
    created_at: str = Field(..., description="Session creation timestamp")
    message_count: int = Field(..., description="Number of messages in session")
    language: str = Field(..., description="Session language")

class HealthCheck(BaseModel):
    status: str = Field(..., description="Server status")
    timestamp: str = Field(..., description="Current timestamp")
    version: str = Field(..., description="API version")
    groq_connected: bool = Field(..., description="Groq API connection status")
    chroma_connected: bool = Field(..., description="ChromaDB connection status")
    multilingual_support: bool = Field(..., description="Multilingual support status")
    supported_languages: int = Field(..., description="Number of supported languages")
    tts_available: bool = Field(..., description="Text-to-speech availability")
    stt_available: bool = Field(..., description="Speech-to-text availability")
    redis_connected: bool = Field(..., description="Redis connection status")  # Added Redis status

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Error details")
    timestamp: str = Field(..., description="Error timestamp")

class LanguageInfo(BaseModel):
    code: str = Field(..., description="Language code")
    name: str = Field(..., description="Language name")

class TranslationRequest(BaseModel):
    text: str = Field(..., description="Text to translate")
    target_lang: str = Field(..., description="Target language code")
    source_lang: Optional[str] = Field("auto", description="Source language code (default: auto)")

class TranslationResponse(BaseModel):
    translated_text: str = Field(..., description="Translated text")
    source_lang: str = Field(..., description="Detected source language")
    target_lang: str = Field(..., description="Target language")
    timestamp: str = Field(..., description="Translation timestamp")

class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to convert to speech")
    language: Optional[str] = Field("en", description="Language code for TTS")
    voice_id: Optional[str] = Field(None, description="ElevenLabs voice ID (optional)")

class TTSResponse(BaseModel):
    audio_url: str = Field(..., description="URL to generated audio file")
    duration: float = Field(..., description="Audio duration in seconds")
    text_length: int = Field(..., description="Length of input text")
    timestamp: str = Field(..., description="TTS generation timestamp")

class VoiceSettings(BaseModel):
    stability: float = Field(0.5, ge=0.0, le=1.0, description="Voice stability")
    similarity_boost: float = Field(0.75, ge=0.0, le=1.0, description="Voice similarity boost")
    style: float = Field(0.0, ge=0.0, le=1.0, description="Voice style")
    use_speaker_boost: bool = Field(True, description="Use speaker boost")

class MoodAnalysisRequest(BaseModel):
    mood: str = Field(..., description="User's mood")
    moodScore: int = Field(..., description="Mood score from 1-10")
    intensity: int = Field(..., description="Intensity from 1-10")
    entry: str = Field(..., description="Journal entry text")
    tags: List[str] = Field(default=[], description="Mood tags")
    timestamp: str = Field(..., description="Analysis timestamp")

class MoodAnalysisResponse(BaseModel):
    insight: str = Field(..., description="AI-generated insight")
    sentiment: str = Field(..., description="Detected sentiment")
    patterns: List[str] = Field(..., description="Identified patterns")
    suggestions: List[str] = Field(..., description="Personalized suggestions")
    analysis_date: str = Field(..., description="Analysis timestamp")

class RedisCacheManager:
    """Redis cache manager for handling caching operations"""
    
    def __init__(self):
        self.redis_client = None
        self.is_connected = False
        
    async def initialize(self):
        """Initialize Redis connection"""
        try:
            # Get credentials from environment
            redis_host = os.getenv("REDIS_HOST")
            redis_port = int(os.getenv("REDIS_PORT", 6379))
            redis_db = int(os.getenv("REDIS_DB", 0))
            redis_username = os.getenv("REDIS_USERNAME")
            redis_password = os.getenv("REDIS_PASSWORD")
            
            connection_args = {
                'host': redis_host,
                'port': redis_port,
                'db': redis_db,
                'decode_responses': False,
                'socket_connect_timeout': 5,
                'socket_timeout': 5,
                'retry_on_timeout': True
            }
            
            # Add username/password if provided
            if redis_username:
                connection_args['username'] = redis_username
            if redis_password:
                connection_args['password'] = redis_password
            
            self.redis_client = redis.Redis(**connection_args)
            
            # Test connection
            await self.redis_client.ping()
            self.is_connected = True
            logger.info("✅ Redis Cloud cache connected successfully")
            
        except Exception as e:
            logger.warning(f"❌ Redis Cloud connection failed: {e}. Caching will be disabled.")
            self.is_connected = False
            
    async def get(self, key: str):
        """Get value from cache"""
        if not self.is_connected or not self.redis_client:
            return None
            
        try:
            cached_data = await self.redis_client.get(key)
            if cached_data:
                return pickle.loads(cached_data)
            return None
        except Exception as e:
            logger.warning(f"Redis get error for key {key}: {e}")
            return None
            
    async def set(self, key: str, value, ttl: int = CACHE_TTL):
        """Set value in cache with TTL"""
        if not self.is_connected or not self.redis_client:
            return False
            
        try:
            serialized_value = pickle.dumps(value)
            await self.redis_client.setex(key, ttl, serialized_value)
            return True
        except Exception as e:
            logger.warning(f"Redis set error for key {key}: {e}")
            return False
            
    async def delete(self, key: str):
        """Delete key from cache"""
        if not self.is_connected or not self.redis_client:
            return False
            
        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Redis delete error for key {key}: {e}")
            return False
            
    async def clear_pattern(self, pattern: str):
        """Clear keys matching pattern"""
        if not self.is_connected or not self.redis_client:
            return False
            
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                await self.redis_client.delete(*keys)
            return True
        except Exception as e:
            logger.warning(f"Redis clear pattern error for {pattern}: {e}")
            return False

class MoodAnalysis:
    def __init__(self, rag_system):
        self.rag_system = rag_system
        self.mood_patterns = {
            'positive': ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'joy', 'excited'],
            'negative': ['sad', 'bad', 'angry', 'anxious', 'stressed', 'tired', 'depressed', 'overwhelmed'],
            'neutral': ['okay', 'fine', 'neutral', 'normal', 'average', 'alright']
        }
    
    def analyze_mood_entry(self, mood_data):
        """Analyze mood entry and provide AI insights"""
        try:
            mood = mood_data.get('mood', '').lower()
            entry = mood_data.get('entry', '').lower()
            intensity = mood_data.get('intensity', 5)
            tags = mood_data.get('tags', [])
            
            # Basic sentiment analysis
            sentiment = self._analyze_sentiment(mood, entry)
            patterns = self._identify_patterns(entry)
            suggestions = self._generate_suggestions(mood, intensity, patterns, tags)
            
            insight = self._format_insight(sentiment, patterns, suggestions, intensity)
            
            return {
                "insight": insight,
                "sentiment": sentiment,
                "patterns": patterns,
                "suggestions": suggestions,
                "analysis_date": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in mood analysis: {str(e)}")
            return {
                "insight": "I've reviewed your mood entry. Remember that all feelings are valid and temporary. Consider talking to someone you trust about how you're feeling.",
                "sentiment": "neutral",
                "patterns": [],
                "suggestions": ["Practice deep breathing", "Take a short walk", "Write down your thoughts"],
                "analysis_date": datetime.now().isoformat()
            }
    
    def _analyze_sentiment(self, mood, entry):
        """Analyze sentiment based on mood and entry text"""
        positive_words = sum(1 for word in self.mood_patterns['positive'] if word in entry)
        negative_words = sum(1 for word in self.mood_patterns['negative'] if word in entry)
        
        if 'happy' in mood or 'good' in mood:
            return 'positive'
        elif 'sad' in mood or 'angry' in mood or 'anxious' in mood:
            return 'negative'
        elif positive_words > negative_words:
            return 'positive'
        elif negative_words > positive_words:
            return 'negative'
        else:
            return 'neutral'
    
    def _identify_patterns(self, entry):
        """Identify patterns in the mood entry"""
        patterns = []
        
        # Common mental health patterns
        if any(word in entry for word in ['sleep', 'tired', 'exhausted']):
            patterns.append('sleep_issues')
        if any(word in entry for word in ['work', 'job', 'deadline']):
            patterns.append('work_stress')
        if any(word in entry for word in ['family', 'friend', 'relationship']):
            patterns.append('social_relationships')
        if any(word in entry for word in ['exercise', 'walk', 'sport']):
            patterns.append('physical_activity')
        if any(word in entry for word in ['eat', 'food', 'meal']):
            patterns.append('nutrition')
        
        return patterns
    
    def _generate_suggestions(self, mood, intensity, patterns, tags):
        """Generate personalized suggestions based on mood analysis"""
        suggestions = []
        
        # Mood-specific suggestions
        if 'anxious' in mood or 'stressed' in mood:
            if intensity >= 7:
                suggestions.extend([
                    "Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s",
                    "Practice progressive muscle relaxation",
                    "Take a 5-minute break and focus on your senses"
                ])
            else:
                suggestions.extend([
                    "Go for a 10-minute walk in nature",
                    "Write down three things you can control right now",
                    "Listen to calming music"
                ])
        
        elif 'sad' in mood or 'depressed' in mood:
            suggestions.extend([
                "Reach out to a friend or loved one",
                "Engage in a favorite hobby for 15 minutes",
                "Practice self-compassion - be kind to yourself"
            ])
        
        elif 'angry' in mood:
            suggestions.extend([
                "Step away from the situation for a few minutes",
                "Write a letter expressing your feelings (you don't have to send it)",
                "Use physical activity to release tension"
            ])
        
        else:  # Positive or neutral moods
            suggestions.extend([
                "Acknowledge and savor this positive moment",
                "Share your good mood with someone else",
                "Use this energy for a productive task"
            ])
        
        # Pattern-based suggestions
        if 'sleep_issues' in patterns:
            suggestions.append("Consider establishing a consistent bedtime routine")
        if 'work_stress' in patterns:
            suggestions.append("Break tasks into smaller, manageable steps")
        if 'social_relationships' in patterns:
            suggestions.append("Schedule quality time with loved ones")
        if 'physical_activity' in patterns:
            suggestions.append("Maintain your physical activity routine")
        elif 'nutrition' not in patterns:
            suggestions.append("Consider how nutrition might be affecting your mood")
        
        # General wellness suggestions
        suggestions.extend([
            "Stay hydrated throughout the day",
            "Practice gratitude by noting three good things",
            "Ensure you're getting enough sunlight exposure"
        ])
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def _format_insight(self, sentiment, patterns, suggestions, intensity):
        """Format the final insight message"""
        
        base_insights = {
            'positive': "It's wonderful to see you're experiencing positive emotions! ",
            'negative': "Thank you for sharing how you're feeling. It's completely normal to experience challenging emotions. ",
            'neutral': "Thanks for checking in with your emotions. "
        }
        
        insight = base_insights.get(sentiment, "Thanks for sharing your mood. ")
        
        # Add intensity note
        if intensity >= 8:
            insight += "The intensity you're describing suggests these feelings are particularly strong. "
        elif intensity <= 3:
            insight += "The lower intensity suggests these feelings are manageable. "
        
        # Add pattern insights
        if patterns:
            pattern_desc = {
                'sleep_issues': "sleep patterns",
                'work_stress': "work-related factors",
                'social_relationships': "social connections",
                'physical_activity': "physical activity",
                'nutrition': "nutrition habits"
            }
            pattern_text = ", ".join(pattern_desc.get(p, p) for p in patterns[:2])
            insight += f"I notice themes related to {pattern_text}. "
        
        # Add suggestions
        insight += "Here are some suggestions that might help: " + ". ".join(suggestions) + "."
        
        # Add closing
        insight += " Remember, this is just guidance - always prioritize what feels right for you."
        
        return insight

class MentalHealthServer:
    def __init__(self):
        self.app = FastAPI(
            title="Mental Health Chatbot API",
            description="RAG-powered mental health assistant with Groq API, ChromaDB, multilingual support, and voice capabilities",
            version="2.0.0",
            docs_url="/docs",
            redoc_url="/redoc"
        )
        
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        
        if not self.groq_api_key:
            logger.error("GROQ_API_KEY environment variable not set")
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.rag_system = None
        self.sessions = {}  # Store conversation sessions
        self.supported_languages = GoogleTranslator().get_supported_languages(as_dict=True)
        self.audio_files = {}  # Store generated audio files
        self.mood_analyzer = MoodAnalysis(self.rag_system)
        
        # Initialize Redis cache
        self.cache_manager = RedisCacheManager()
        
        # Voice capabilities flags
        self.tts_available = False
        self.stt_available = False
        self.elevenlabs_available = False
        
        self.setup_middleware()
        self.setup_routes()
        self.initialize_voice_services()
        
        logger.info("MentalHealthServer initialized with voice capabilities and Redis caching")

    async def initialize_redis(self):
        """Initialize Redis connection"""
        await self.cache_manager.initialize()

    def initialize_voice_services(self):
        """Initialize voice services with fallback mechanisms"""
        try:
            # Check ElevenLabs availability
            if self.elevenlabs_api_key:
                try:
                    import elevenlabs
                    self.elevenlabs_available = True
                    self.tts_available = True
                    logger.info("✅ ElevenLabs TTS available")
                except ImportError:
                    logger.warning("ElevenLabs library not installed")
            
            # Check PyAudio fallback
            try:
                import pyaudio
                import speech_recognition as sr
                self.stt_available = True
                if not self.tts_available:
                    try:
                        from gtts import gTTS
                        import pygame
                        self.tts_available = True
                        logger.info("✅ PyAudio TTS fallback available")
                    except ImportError:
                        logger.warning("gTTS/PyGame not available for TTS fallback")
                logger.info("✅ Speech-to-text available")
            except ImportError:
                logger.warning("PyAudio/SpeechRecognition not available")
                
        except Exception as e:
            logger.error(f"Voice services initialization failed: {e}")

    def setup_middleware(self):
        """Setup CORS and other middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Add request logging middleware
        @self.app.middleware("http")
        async def log_requests(request: Request, call_next):
            start_time = time.time()
            request_id = str(uuid.uuid4())
            
            logger.info(f"Request {request_id} started: {request.method} {request.url}")
            
            response = await call_next(request)
            
            process_time = time.time() - start_time
            logger.info(f"Request {request_id} completed: {process_time:.3f}s - Status: {response.status_code}")
            
            response.headers["X-Process-Time"] = str(process_time)
            response.headers["X-Request-ID"] = request_id
            
            return response

    def detect_language(self, text: str) -> str:
        """Detect the language of the input text"""
        try:
            if not text.strip():
                return "en"
            
            if any(char in text for char in ['।', '़', '्']):
                return "hi"
            elif any(char in text for char in ['ñ', 'á', 'é', 'í', 'ó', 'ú', '¿', '¡']):
                return "es"
            elif any(char in text for char in ['ä', 'ö', 'ü', 'ß']):
                return "de"
            elif any(char in text for char in ['à', 'è', 'ì', 'ò', 'ù', 'â', 'ê', 'î', 'ô', 'û']):
                return "fr"
            elif any(char in text for char in ['à', 'è', 'é', 'ì', 'ò', 'ù']):
                return "it"
            
            return "en"
        except Exception:
            return "en"

    async def translate_text(self, text: str, target_lang: str = "en", source_lang: str = "auto") -> str:
        """Translate text to target language with caching"""
        try:
            if not text.strip() or source_lang == target_lang:
                return text
            
            # Create cache key
            cache_key = f"translation:{source_lang}:{target_lang}:{hash(text)}"
            
            # Check cache first
            cached_translation = await self.cache_manager.get(cache_key)
            if cached_translation:
                logger.info(f"Translation cache hit for {source_lang}->{target_lang}")
                return cached_translation
            
            # Perform translation
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated = translator.translate(text)
            
            # Cache the result
            await self.cache_manager.set(cache_key, translated, ttl=86400)  # 24 hours for translations
            
            return translated
        except Exception as e:
            logger.warning(f"Translation failed: {e}, returning original text")
            return text

    async def text_to_speech_elevenlabs(self, text: str, language: str = "en", voice_id: str = None) -> Optional[str]:
        """Convert text to speech using ElevenLabs with caching"""
        if not self.elevenlabs_available or not text.strip():
            return None
        
        try:
            import elevenlabs
            from elevenlabs import generate, play, save
            
            # Create cache key
            cache_key = f"tts:elevenlabs:{language}:{voice_id or 'default'}:{hash(text)}"
            
            # Check cache first
            cached_audio_id = await self.cache_manager.get(cache_key)
            if cached_audio_id:
                logger.info(f"TTS cache hit for text length {len(text)}")
                return f"/audio/{cached_audio_id}"
            
            # Set voice based on language
            if voice_id is None:
                if language.startswith("en"):
                    voice_id = "Rachel"  # English female voice
                elif language.startswith("es"):
                    voice_id = "Arnold"  # Spanish voice
                elif language.startswith("fr"):
                    voice_id = "Charlotte"  # French voice
                else:
                    voice_id = "Rachel"  # Default
            
            # Generate audio
            audio = generate(
                text=text,
                voice=voice_id,
                model="eleven_multilingual_v2",
                api_key=self.elevenlabs_api_key
            )
            
            # Save to temporary file
            audio_id = str(uuid.uuid4())
            filename = f"audio_{audio_id}.mp3"
            filepath = os.path.join("audio_cache", filename)
            
            os.makedirs("audio_cache", exist_ok=True)
            save(audio, filepath)
            
            # Store file info
            self.audio_files[audio_id] = {
                "path": filepath,
                "created": datetime.now().isoformat(),
                "text": text,
                "language": language
            }
            
            # Cache the audio ID
            await self.cache_manager.set(cache_key, audio_id, ttl=3600)  # 1 hour for TTS
            
            return f"/audio/{audio_id}"
            
        except Exception as e:
            logger.error(f"ElevenLabs TTS failed: {e}")
            return None

    async def text_to_speech_fallback(self, text: str, language: str = "en") -> Optional[str]:
        """Fallback TTS using gTTS with caching"""
        try:
            from gtts import gTTS
            import pygame
            
            # Create cache key
            cache_key = f"tts:gtts:{language}:{hash(text)}"
            
            # Check cache first
            cached_audio_id = await self.cache_manager.get(cache_key)
            if cached_audio_id:
                logger.info(f"TTS fallback cache hit for text length {len(text)}")
                return f"/audio/{cached_audio_id}"
            
            # Create temporary file
            audio_id = str(uuid.uuid4())
            filename = f"audio_{audio_id}.mp3"
            filepath = os.path.join("audio_cache", filename)
            
            os.makedirs("audio_cache", exist_ok=True)
            
            # Generate speech
            tts = gTTS(text=text, lang=language, slow=False)
            tts.save(filepath)
            
            # Store file info
            self.audio_files[audio_id] = {
                "path": filepath,
                "created": datetime.now().isoformat(),
                "text": text,
                "language": language
            }
            
            # Cache the audio ID
            await self.cache_manager.set(cache_key, audio_id, ttl=3600)  # 1 hour for TTS
            
            return f"/audio/{audio_id}"
            
        except Exception as e:
            logger.error(f"Fallback TTS failed: {e}")
            return None

    async def speech_to_text(self, audio_file: UploadFile) -> str:
        """Convert speech to text"""
        if not self.stt_available:
            raise HTTPException(status_code=501, detail="Speech-to-text not available")
        
        try:
            import speech_recognition as sr
            
            # Save uploaded file temporarily
            temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            content = await audio_file.read()
            temp_audio.write(content)
            temp_audio.close()
            
            # Recognize speech
            recognizer = sr.Recognizer()
            with sr.AudioFile(temp_audio.name) as source:
                audio_data = recognizer.record(source)
                text = recognizer.recognize_google(audio_data)
            
            # Clean up
            os.unlink(temp_audio.name)
            
            return text
            
        except Exception as e:
            logger.error(f"Speech-to-text failed: {e}")
            raise HTTPException(status_code=500, detail=f"Speech recognition error: {e}")

    def setup_routes(self):
        """Setup API routes including voice endpoints"""
        
        @self.app.on_event("startup")
        async def startup_event():
            """Initialize services on startup"""
            try:
                logger.info("Starting server initialization...")
                
                # Initialize Redis first
                await self.initialize_redis()
                
                # Initialize RAG system
                self.rag_system = MentalHealthRAG(groq_api_key=self.groq_api_key)
                
                # Enhanced sample data
                sample_documents = [
                    {
                        "text": "Depression is treatable with therapy and medication. Symptoms include persistent sadness, loss of interest, and low energy.",
                        "source": "WHO",
                        "type": "condition",
                        "metadata": {"condition": "depression"}
                    },
                    {
                        "text": "Anxiety disorders involve excessive fear/worry. Treatment includes CBT, exposure therapy, and relaxation techniques.",
                        "source": "APA",
                        "type": "condition",
                        "metadata": {"condition": "anxiety"}
                    },
                    {
                        "text": "For mental health crisis, call/text 988 for free, confidential support 24/7.",
                        "source": "988 Lifeline",
                        "type": "resource",
                        "metadata": {"resource": "crisis"}
                    }
                ]
                
                self.rag_system.add_knowledge_documents(sample_documents)
                logger.info("Knowledge base initialized with sample data")
                
            except Exception as e:
                logger.error(f"Failed to initialize RAG system: {str(e)}")
                raise

        @self.app.get("/", response_class=HTMLResponse)
        async def root(request: Request):
            """Root endpoint with basic information"""
            logger.info("Root endpoint accessed")
            redis_status = "✅ Available" if self.cache_manager.is_connected else "❌ Unavailable"
            
            return f"""
            <html>
                <head>
                    <title>Mental Health Chatbot API</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: #f0f8ff; padding: 20px; border-radius: 10px; margin-bottom: 20px; }}
                        .endpoints {{ background: #f9f9f9; padding: 15px; border-radius: 5px; }}
                        .feature {{ background: #e8f5e8; padding: 10px; margin: 5px 0; border-radius: 5px; }}
                        .voice {{ background: #fff0f0; padding: 10px; margin: 5px 0; border-radius: 5px; }}
                        .cache {{ background: #fff8e8; padding: 10px; margin: 5px 0; border-radius: 5px; }}
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🤖 Mental Health Chatbot API</h1>
                        <p>RAG-powered mental health assistant with Groq API and ChromaDB</p>
                        <p>🌍 Multilingual Support (133 languages)</p>
                        <p>🎤 Voice Support: {'✅ Available' if self.tts_available or self.stt_available else '❌ Unavailable'}</p>
                        <p class="cache">🔴 Redis Caching: {redis_status}</p>
                        <p>Developed by Group-33, B.Tech CSE Cloud Computing & Automation</p>
                    </div>
                    
                    <div class="endpoints">
                        <h2>Available Endpoints:</h2>
                        <div class="feature">
                            <strong>GET /health</strong> - Health check and server status
                        </div>
                        <div class="feature">
                            <strong>POST /chat</strong> - Send a message to the chatbot (supports 133 languages)
                        </div>
                        <div class="voice">
                            <strong>POST /voice/chat</strong> - Voice chat with audio response
                        </div>
                        <div class="voice">
                            <strong>POST /voice/speech-to-text</strong> - Convert speech to text
                        </div>
                        <div class="voice">
                            <strong>POST /voice/text-to-speech</strong> - Convert text to speech
                        </div>
                        <div class="feature">
                            <strong>GET /languages</strong> - List all supported languages
                        </div>
                        <div class="feature">
                            <strong>POST /translate</strong> - Translate text between languages
                        </div>
                        <div class="feature">
                            <strong>GET /sessions</strong> - List active sessions
                        </div>
                        <div class="feature">
                            <strong>DELETE /sessions/{{session_id}}</strong> - Delete a session
                        </div>
                        <div class="feature">
                            <strong>GET /stats</strong> - Server statistics
                        </div>
                        <div class="cache">
                            <strong>POST /cache/clear</strong> - Clear Redis cache (admin)
                        </div>
                    </div>
                    
                    <p>Visit <a href="/docs">/docs</a> for detailed API documentation with examples.</p>
                    <p>Visit <a href="/redoc">/redoc</a> for alternative documentation format.</p>
                </body>
            </html>
            """

        @self.app.get("/health", response_model=HealthCheck, tags=["Monitoring"])
        async def health_check():
            """Health check endpoint with voice capabilities status"""
            try:
                health_status = HealthCheck(
                    status="healthy",
                    timestamp=datetime.now().isoformat(),
                    version="2.0.0",
                    groq_connected=self.groq_api_key is not None,
                    chroma_connected=self.rag_system is not None,
                    multilingual_support=True,
                    supported_languages=len(self.supported_languages),
                    tts_available=self.tts_available,
                    stt_available=self.stt_available,
                    redis_connected=self.cache_manager.is_connected  # Add Redis status
                )
                logger.info("Health check passed")
                return health_status
            except Exception as e:
                logger.error(f"Health check failed: {str(e)}")
                raise HTTPException(status_code=500, detail="Health check failed")

        @self.app.post("/chat", response_model=ChatResponse, tags=["Chat"])
        async def chat_endpoint(chat_message: ChatMessage):
            """Main chat endpoint with multilingual support and caching"""
            try:
                start_time = time.time()
                
                session_id = chat_message.session_id or str(uuid.uuid4())
                target_language = chat_message.language or "en"
                
                if session_id not in self.sessions:
                    self.sessions[session_id] = {
                        "created_at": datetime.now().isoformat(),
                        "messages": [],
                        "language": target_language
                    }
                    logger.info(f"Created new session: {session_id} with language: {target_language}")
                
                detected_language = self.detect_language(chat_message.message)
                english_input = chat_message.message
                
                if detected_language != "en":
                    english_input = await self.translate_text(chat_message.message, "en", detected_language)
                    logger.info(f"Translated from {detected_language} to English for processing")
                
                self.sessions[session_id]["messages"].append({
                    "role": "user",
                    "message": chat_message.message,
                    "timestamp": datetime.now().isoformat(),
                    "language": detected_language
                })
                
                logger.info(f"Processing message in session {session_id}: {chat_message.message[:50]}...")
                
                # Check cache for similar queries
                cache_key = f"chat:{hash(english_input)}:{target_language}"
                cached_response = await self.cache_manager.get(cache_key)
                
                if cached_response:
                    logger.info(f"Chat cache hit for session {session_id}")
                    response_data = cached_response
                else:
                    response_data = self.rag_system.generate_response(english_input)
                    # Cache the response
                    await self.cache_manager.set(cache_key, response_data, ttl=1800)  # 30 minutes for chat responses
                
                english_response = response_data["response"]
                final_response = english_response
                
                if target_language != "en":
                    final_response = await self.translate_text(english_response, target_language, "en")
                    logger.info(f"Translated response to {target_language}")
                
                self.sessions[session_id]["messages"].append({
                    "role": "assistant",
                    "message": final_response,
                    "timestamp": datetime.now().isoformat(),
                    "language": target_language
                })
                
                response_time = time.time() - start_time
                
                logger.info(f"Response generated in {response_time:.3f}s for session {session_id}")
                
                return ChatResponse(
                    response=final_response,
                    session_id=session_id,
                    is_mental_health=response_data["is_mental_health"],
                    response_time=response_time,
                    timestamp=datetime.now().isoformat(),
                    detected_language=detected_language,
                    target_language=target_language
                )
                
            except Exception as e:
                logger.error(f"Chat endpoint error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error processing message: {str(e)}"
                )

        @self.app.post("/voice/chat", response_model=VoiceChatResponse, tags=["Voice"])
        async def voice_chat_endpoint(
            chat_message: ChatMessage,
            generate_audio: bool = Form(True)
        ):
            """Voice chat endpoint with audio response generation and caching"""
            try:
                start_time = time.time()
                
                # First process the chat message
                chat_response = await chat_endpoint(chat_message)
                
                audio_url = None
                audio_duration = None
                
                # Generate audio if requested and available
                if generate_audio and self.tts_available:
                    audio_gen_start = time.time()
                    
                    # Try ElevenLabs first
                    audio_url = await self.text_to_speech_elevenlabs(
                        chat_response.response,
                        chat_response.target_language or "en"
                    )
                    
                    # Fallback to gTTS if ElevenLabs fails
                    if audio_url is None:
                        audio_url = await self.text_to_speech_fallback(
                            chat_response.response,
                            chat_response.target_language or "en"
                        )
                    
                    if audio_url:
                        audio_duration = time.time() - audio_gen_start
                        logger.info(f"Audio generated in {audio_duration:.2f}s")
                
                response_time = time.time() - start_time
                
                return VoiceChatResponse(
                    **chat_response.dict(),
                    audio_url=audio_url,
                    audio_duration=audio_duration,
                    response_time=response_time
                )
                
            except Exception as e:
                logger.error(f"Voice chat endpoint error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error processing voice chat: {str(e)}"
                )

        @self.app.post("/voice/speech-to-text", tags=["Voice"])
        async def speech_to_text_endpoint(audio_file: UploadFile = File(...)):
            """Convert speech to text from uploaded audio file"""
            try:
                text = await self.speech_to_text(audio_file)
                return {
                    "text": text,
                    "detected_language": self.detect_language(text),
                    "timestamp": datetime.now().isoformat()
                }
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Speech-to-text endpoint error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error converting speech to text: {str(e)}"
                )

        @self.app.post("/voice/text-to-speech", response_model=TTSResponse, tags=["Voice"])
        async def text_to_speech_endpoint(tts_request: TTSRequest):
            """Convert text to speech with caching"""
            try:
                if not self.tts_available:
                    raise HTTPException(status_code=501, detail="Text-to-speech not available")
                
                start_time = time.time()
                
                # Try ElevenLabs first
                audio_url = await self.text_to_speech_elevenlabs(
                    tts_request.text,
                    tts_request.language,
                    tts_request.voice_id
                )
                
                # Fallback to gTTS
                if audio_url is None:
                    audio_url = await self.text_to_speech_fallback(
                        tts_request.text,
                        tts_request.language
                    )
                
                if audio_url is None:
                    raise HTTPException(status_code=500, detail="Failed to generate audio")
                
                duration = time.time() - start_time
                
                return TTSResponse(
                    audio_url=audio_url,
                    duration=duration,
                    text_length=len(tts_request.text),
                    timestamp=datetime.now().isoformat()
                )
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Text-to-speech endpoint error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error converting text to speech: {str(e)}"
                )

        @self.app.get("/audio/{audio_id}")
        async def get_audio_file(audio_id: str):
            """Serve generated audio files"""
            if audio_id not in self.audio_files:
                raise HTTPException(status_code=404, detail="Audio file not found")
            
            file_info = self.audio_files[audio_id]
            return FileResponse(
                file_info["path"],
                media_type="audio/mpeg",
                filename=f"speech_{audio_id}.mp3"
            )

        @self.app.post("/cache/clear", tags=["Cache Management"])
        async def clear_cache(pattern: str = "*", admin_key: str = Form(None)):
            """Clear Redis cache patterns (admin function)"""
            try:
                # Simple admin authentication
                expected_admin_key = os.getenv("ADMIN_KEY", "mentalhealth2024")
                if admin_key != expected_admin_key:
                    raise HTTPException(
                        status_code=401, 
                        detail="Invalid admin key"
                    )
                
                if not self.cache_manager.is_connected:
                    return {"message": "Redis not connected", "cleared": False}
                
                cleared = await self.cache_manager.clear_pattern(pattern)
                if cleared:
                    logger.info(f"Cache cleared for pattern: {pattern}")
                    return {
                        "message": f"Cache cleared for pattern: {pattern}",
                        "cleared": True,
                        "pattern": pattern
                    }
                else:
                    return {
                        "message": "Failed to clear cache",
                        "cleared": False,
                        "pattern": pattern
                    }
                    
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Cache clear error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error clearing cache: {str(e)}"
                )

        @self.app.get("/cache/stats", tags=["Cache Management"])
        async def get_cache_stats(admin_key: str = None):
            """Get Redis cache statistics"""
            try:
                # Admin authentication
                expected_admin_key = os.getenv("ADMIN_KEY", "mentalhealth2024")
                if admin_key != expected_admin_key:
                    raise HTTPException(
                        status_code=401, 
                        detail="Invalid admin key"
                    )
                
                if not self.cache_manager.is_connected or not self.cache_manager.redis_client:
                    return {
                        "redis_connected": False,
                        "message": "Redis not connected"
                    }
                
                # Get Redis info
                info = await self.cache_manager.redis_client.info()
                
                # Count keys by pattern
                patterns = ["chat:*", "translation:*", "tts:*", "mood:*"]
                key_counts = {}
                
                for pattern in patterns:
                    keys = await self.cache_manager.redis_client.keys(pattern)
                    key_counts[pattern] = len(keys)
                
                total_keys = sum(key_counts.values())
                
                return {
                    "redis_connected": True,
                    "total_keys": total_keys,
                    "key_counts": key_counts,
                    "memory_used": info.get('used_memory_human', 'N/A'),
                    "connected_clients": info.get('connected_clients', 0),
                    "keyspace_hits": info.get('keyspace_hits', 0),
                    "keyspace_misses": info.get('keyspace_misses', 0),
                    "hit_rate": round(info.get('keyspace_hits', 0) / max(1, info.get('keyspace_hits', 0) + info.get('keyspace_misses', 0)) * 100, 2)
                }
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Cache stats error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error getting cache stats: {str(e)}"
                )

        @self.app.get("/languages", response_model=List[LanguageInfo], tags=["Translation"])
        async def get_supported_languages():
            """
            Get list of all supported languages for translation.
            
            Returns 133 languages with their codes and names for use in the chat and translate endpoints.
            """
            try:
                # Cache languages list since it doesn't change frequently
                cache_key = "supported_languages"
                cached_languages = await self.cache_manager.get(cache_key)
                
                if cached_languages:
                    logger.info("Languages cache hit")
                    return cached_languages
                
                languages = []
                for name, code in self.supported_languages.items():
                    languages.append(LanguageInfo(code=code, name=name))
                
                # Cache for 24 hours
                await self.cache_manager.set(cache_key, languages, ttl=86400)
                logger.info("Returned list of supported languages")
                return languages
                
            except Exception as e:
                logger.error(f"Error getting languages: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error getting supported languages: {str(e)}"
                )

        @self.app.post("/translate", response_model=TranslationResponse, tags=["Translation"])
        async def translate_text_endpoint(translation_request: TranslationRequest):
            """
            Translate text between supported languages.
            
            Supports translation between any of the 133 supported languages with automatic
            language detection or specified source language.
            """
            try:
                start_time = time.time()
                
                # Validate target language
                if translation_request.target_lang not in self.supported_languages.values():
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unsupported target language: {translation_request.target_lang}"
                    )
                
                # Detect source language if auto
                source_lang = translation_request.source_lang
                if source_lang == "auto":
                    source_lang = self.detect_language(translation_request.text)
                
                # Validate source language if specified
                if source_lang != "auto" and source_lang not in self.supported_languages.values():
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unsupported source language: {source_lang}"
                    )
                
                # Create cache key
                cache_key = f"translation:{source_lang}:{translation_request.target_lang}:{hashlib.md5(translation_request.text.encode()).hexdigest()}"
                
                # Check cache first
                cached_translation = await self.cache_manager.get(cache_key)
                if cached_translation:
                    logger.info(f"Translation cache hit for {source_lang}->{translation_request.target_lang}")
                    translation_time = time.time() - start_time
                    return TranslationResponse(
                        translated_text=cached_translation,
                        source_lang=source_lang,
                        target_lang=translation_request.target_lang,
                        timestamp=datetime.now().isoformat()
                    )
                
                # Perform translation
                translated_text = await self.translate_text(
                    translation_request.text,
                    translation_request.target_lang,
                    source_lang
                )
                
                # Cache the result
                await self.cache_manager.set(cache_key, translated_text, ttl=86400)
                
                translation_time = time.time() - start_time
                
                logger.info(f"Translated text from {source_lang} to {translation_request.target_lang} in {translation_time:.3f}s")
                
                return TranslationResponse(
                    translated_text=translated_text,
                    source_lang=source_lang,
                    target_lang=translation_request.target_lang,
                    timestamp=datetime.now().isoformat()
                )
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Translation error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error translating text: {str(e)}"
                )

        @self.app.get("/sessions", response_model=List[SessionInfo], tags=["Sessions"])
        async def list_sessions():
            """List all active conversation sessions"""
            try:
                sessions_info = []
                for session_id, session_data in self.sessions.items():
                    sessions_info.append(SessionInfo(
                        session_id=session_id,
                        created_at=session_data["created_at"],
                        message_count=len(session_data["messages"]),
                        language=session_data.get("language", "en")
                    ))
                
                logger.info(f"Listed {len(sessions_info)} active sessions")
                return sessions_info
                
            except Exception as e:
                logger.error(f"Error listing sessions: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error listing sessions: {str(e)}"
                )

        @self.app.post("/analyze-mood", response_model=MoodAnalysisResponse)
        async def analyze_mood(mood_request: MoodAnalysisRequest):
            """Analyze mood entry with caching for common patterns"""
            try:
                logger.info(f"Analyzing mood entry: {mood_request.mood} (score: {mood_request.moodScore})")
                
                # Create cache key for similar mood patterns
                mood_key = f"{mood_request.mood.lower()}:{mood_request.moodScore}:{hashlib.md5(mood_request.entry.encode()).hexdigest()[:10]}"
                cache_key = f"mood_analysis:{mood_key}"
                
                # Check cache for similar mood analysis
                cached_analysis = await self.cache_manager.get(cache_key)
                if cached_analysis:
                    logger.info("Mood analysis cache hit")
                    return MoodAnalysisResponse(**cached_analysis)
                
                analysis_result = self.mood_analyzer.analyze_mood_entry(mood_request.dict())
                
                # Cache the result for 1 hour (mood patterns are relatively stable)
                await self.cache_manager.set(cache_key, analysis_result, ttl=3600)
                
                logger.info("Mood analysis completed successfully")
                return MoodAnalysisResponse(**analysis_result)
                
            except Exception as e:
                logger.error(f"Mood analysis error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error analyzing mood: {str(e)}"
                )

        @self.app.get("/sessions/{session_id}", response_model=Dict, tags=["Sessions"])
        async def get_session(session_id: str):
            """Get detailed information about a specific session"""
            try:
                if session_id not in self.sessions:
                    logger.warning(f"Session not found: {session_id}")
                    raise HTTPException(
                        status_code=404,
                        detail=f"Session {session_id} not found"
                    )
                
                logger.info(f"Retrieved session: {session_id}")
                return {
                    "session_id": session_id,
                    **self.sessions[session_id]
                }
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error getting session: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error getting session: {str(e)}"
                )

        @self.app.delete("/sessions/{session_id}", tags=["Sessions"])
        async def delete_session(session_id: str):
            """Delete a specific conversation session"""
            try:
                if session_id not in self.sessions:
                    logger.warning(f"Session not found for deletion: {session_id}")
                    raise HTTPException(
                        status_code=404,
                        detail=f"Session {session_id} not found"
                    )
                
                del self.sessions[session_id]
                logger.info(f"Deleted session: {session_id}")
                
                return {"message": f"Session {session_id} deleted successfully"}
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error deleting session: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error deleting session: {str(e)}"
                )

        @self.app.get("/stats", tags=["Monitoring"])
        async def get_stats():
            """Get server statistics and usage metrics"""
            try:
                stats = {
                    "total_sessions": len(self.sessions),
                    "total_messages": sum(len(session["messages"]) for session in self.sessions.values()),
                    "active_since": datetime.now().isoformat(),
                    "rag_system_status": "connected" if self.rag_system else "disconnected",
                    "supported_languages": len(self.supported_languages),
                    "multilingual_enabled": True,
                    "redis_connected": self.cache_manager.is_connected,
                    "cache_enabled": self.cache_manager.is_connected
                }
                
                # Add cache statistics if Redis is connected
                if self.cache_manager.is_connected:
                    try:
                        cache_stats = await self.get_cache_internal_stats()
                        stats["cache_stats"] = cache_stats
                    except Exception as e:
                        stats["cache_stats"] = {"error": str(e)}
                
                if self.rag_system:
                    kb_stats = self.rag_system.get_collection_stats()
                    stats["knowledge_base"] = kb_stats
                
                logger.info("Retrieved server statistics")
                return stats
                
            except Exception as e:
                logger.error(f"Error getting stats: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error getting statistics: {str(e)}"
                )

        async def get_cache_internal_stats(self):
            """Internal method to get cache statistics"""
            if not self.cache_manager.is_connected:
                return {"redis_connected": False}
            
            try:
                patterns = ["chat:*", "translation:*", "tts:*", "mood:*"]
                key_counts = {}
                total_size = 0
                
                for pattern in patterns:
                    keys = await self.cache_manager.redis_client.keys(pattern)
                    key_counts[pattern] = len(keys)
                    
                    # Estimate size (rough calculation)
                    for key in keys[:10]:  # Sample first 10 keys
                        value = await self.cache_manager.redis_client.get(key)
                        if value:
                            total_size += len(value)
                
                return {
                    "redis_connected": True,
                    "key_counts": key_counts,
                    "total_keys": sum(key_counts.values()),
                    "estimated_size_mb": round(total_size / (1024 * 1024), 2)
                }
            except Exception as e:
                return {"error": str(e)}

        # Exception handlers
        @self.app.exception_handler(HTTPException)
        async def http_exception_handler(request: Request, exc: HTTPException):
            error_response = ErrorResponse(
                error=exc.detail,
                timestamp=datetime.now().isoformat()
            )
            logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail}")
            return JSONResponse(
                status_code=exc.status_code,
                content=error_response.dict()
            )

        @self.app.exception_handler(Exception)
        async def general_exception_handler(request: Request, exc: Exception):
            error_response = ErrorResponse(
                error="Internal server error",
                details=str(exc),
                timestamp=datetime.now().isoformat()
            )
            logger.error(f"Unhandled exception: {str(exc)}")
            return JSONResponse(
                status_code=500,
                content=error_response.dict()
            )

    def run(self, host: str = "0.0.0.0", port: int = 8000):
        """Run the FastAPI server"""
        logger.info(f"Starting server on {host}:{port}")
        uvicorn.run(
            self.app,
            host=host,
            port=port,
            log_level="info",
            access_log=True
        )

def main():
    """Main function to run the server"""
    try:
        if not os.getenv("GROQ_API_KEY"):
            print("❌ ERROR: GROQ_API_KEY environment variable is required")
            print("💡 Set it with: export GROQ_API_KEY=your_api_key_here")
            sys.exit(1)
        
        print("🚀 Starting Mental Health Chatbot Server with Voice Support and Redis Caching...")
        print("📝 Logs will be saved to mental_health_server.log")
        print("🌍 Multilingual support enabled (133 languages)")
        print("🎤 Voice support: ElevenLabs + PyAudio fallback")
        print("🔴 Redis caching: Enabled")
        print("🌐 Server will be available at http://localhost:8000")
        print("📚 API documentation at http://localhost:8000/docs")
        print("🛠️  Cache management at /cache/clear and /cache/stats")
        print("⏹️  Press Ctrl+C to stop the server")
        
        server = MentalHealthServer()
        server.run()
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        logger.info("Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()