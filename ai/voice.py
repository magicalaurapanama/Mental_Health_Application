# voice.py
import os
import json
import time
import threading
from datetime import datetime
from typing import List, Dict
import queue
import wave
import pyaudio
import speech_recognition as sr
from gtts import gTTS
import pygame
import tempfile
import subprocess
import requests
from pathlib import Path
import platform

from rag import MentalHealthRAG
from deep_translator import GoogleTranslator

class VoiceMentalHealthAgent:
    """
    Voice Interface for Mental Health Chatbot with speech recognition and text-to-speech
    """
    
    def __init__(self, groq_api_key: str):
        self.groq_api_key = groq_api_key
        self.rag_system = MentalHealthRAG(groq_api_key)
        self.conversation_history = []
        self.current_session_id = None
        self.user_name = "Harjas Singh"
        self.target_language = "en"
        self.supported_languages = GoogleTranslator().get_supported_languages(as_dict=True)
        
        # Enhanced audio settings optimized for macOS
        self.audio_format = pyaudio.paInt16
        self.channels = 1
        self.rate = 22050  # Better quality for macOS
        self.chunk = 2048  # Larger chunk size for better performance
        self.sample_width = 2  # 16-bit audio
        
        # Initialize audio components with comprehensive error handling
        self.has_audio = False
        self.audio = None
        self.recognizer = None
        
        try:
            # Initialize PyAudio with macOS-specific settings
            self.audio = pyaudio.PyAudio()
            
            # Check available devices
            device_count = self.audio.get_device_count()
            print(f"🔍 Found {device_count} audio devices")
            
            # Try to find a working input device
            input_device_index = None
            for i in range(device_count):
                device_info = self.audio.get_device_info_by_index(i)
                if device_info['maxInputChannels'] > 0:
                    print(f"🎤 Input device {i}: {device_info['name']}")
                    if input_device_index is None:
                        input_device_index = i
            
            if input_device_index is None:
                raise Exception("No audio input devices found")
            
            # Initialize speech recognition with optimized settings
            self.recognizer = sr.Recognizer()
            
            # Optimized settings for macOS
            self.recognizer.energy_threshold = 400  # Higher threshold for better noise rejection
            self.recognizer.dynamic_energy_threshold = True
            self.recognizer.dynamic_energy_adjustment_damping = 0.15
            self.recognizer.dynamic_energy_ratio = 1.5
            self.recognizer.pause_threshold = 1.0  # Longer pause threshold
            self.recognizer.operation_timeout = 10  # Longer timeout
            self.recognizer.phrase_threshold = 0.3  # Lower phrase threshold
            
            # Test microphone access
            print("🔊 Testing microphone access...")
            with sr.Microphone() as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                print("✅ Microphone access successful")
            
            # Initialize pygame for audio playback with better settings
            pygame.mixer.init(frequency=22050, size=-16, channels=1, buffer=4096)
            
            self.has_audio = True
            print("✅ Audio system initialized successfully")
            
        except ImportError as e:
            print(f"❌ Required audio libraries not installed: {e}")
            print("💡 Run: pip install pyaudio SpeechRecognition gTTS pygame")
            
        except OSError as e:
            print(f"❌ Audio device error (macOS common): {e}")
            print("💡 Try: pip install portaudio")
            print("💡 On macOS: brew install portaudio")
            
        except sr.RequestError as e:
            print(f"❌ Speech recognition service error: {e}")
            print("💡 Check internet connection for speech recognition")
            
        except Exception as e:
            print(f"⚠️ Audio initialization failed: {e}")
            print("🎤 Falling back to text-only mode")
        
        # Additional audio quality settings
        self.audio_quality = "high"  # Can be "low", "medium", "high"
        self.noise_reduction = True
        self.echo_cancellation = True
        
        # Voice activity detection settings
        self.vad_threshold = 0.5
        self.silence_duration = 0.8
        
        # Conversation settings
        self.max_conversation_history = 20
        self.enable_voice_feedback = True
        
        self.is_listening = False
        self.is_speaking = False
        
        # Initialize knowledge base
        self._initialize_knowledge_base()
        
        # Print system status
        self._print_system_status()
        
        print("🎤 Voice Mental Health Agent Initialized for Harjas Singh!")

    def _print_system_status(self):
        """Print detailed system status"""
        print("\n" + "="*50)
        print("SYSTEM STATUS")
        print("="*50)
        print(f"Audio System: {'✅ Enabled' if self.has_audio else '❌ Disabled'}")
        print(f"Target Language: {self.target_language}")
        print(f"User: {self.user_name}")
        print(f"Audio Quality: {self.audio_quality}")
        print(f"Sample Rate: {self.rate} Hz")
        print(f"Supported Languages: {len(self.supported_languages)}")
        
        if self.has_audio:
            # Show audio device info
            try:
                default_input = self.audio.get_default_input_device_info()
                print(f"Default Input: {default_input['name']}")
            except:
                print("Default Input: Unknown")
        
        print("="*50)
    
    def _initialize_knowledge_base(self):
        """Initialize the knowledge base with comprehensive mental health data"""
        try:
            # Enhanced sample documents with more mental health knowledge
            sample_documents = [
                {
                    "text": "Depression is a common mental disorder characterized by persistent sadness, loss of interest, low energy, and poor concentration. Effective treatments include psychotherapy (CBT, IPT), antidepressant medication, and lifestyle changes. Symptoms must persist for at least two weeks for diagnosis.",
                    "source": "World Health Organization",
                    "type": "condition",
                    "metadata": {
                        "condition": "depression", 
                        "severity": "general",
                        "treatments": ["CBT", "IPT", "medication", "lifestyle"],
                        "symptoms": ["sadness", "loss of interest", "low energy", "poor concentration"]
                    }
                },
                {
                    "text": "Anxiety disorders involve excessive and persistent worry, fear, and nervousness that interfere with daily activities. Types include generalized anxiety disorder, panic disorder, social anxiety, and specific phobias. Treatment options include cognitive behavioral therapy, exposure therapy, relaxation techniques, and anti-anxiety medications.",
                    "source": "American Psychological Association",
                    "type": "condition",
                    "metadata": {
                        "condition": "anxiety", 
                        "types": ["GAD", "panic disorder", "social anxiety", "phobias"],
                        "treatments": ["CBT", "exposure therapy", "relaxation", "medication"]
                    }
                },
                {
                    "text": "Cognitive Behavioral Therapy (CBT) is a highly effective psychotherapy that helps individuals identify and change negative thought patterns and behaviors. It's evidence-based for depression, anxiety disorders, eating disorders, PTSD, and many other mental health conditions. CBT typically involves structured sessions over 12-20 weeks.",
                    "source": "National Institute of Mental Health",
                    "type": "treatment",
                    "metadata": {
                        "therapy": "CBT", 
                        "conditions": ["depression", "anxiety", "PTSD", "eating disorders"],
                        "duration": "12-20 weeks",
                        "effectiveness": "high"
                    }
                },
                {
                    "text": "For immediate mental health crisis support in the United States, call or text 988 to reach the Suicide & Crisis Lifeline. This free service provides 24/7 confidential support from trained counselors. For emergencies, always call 911 or go to the nearest emergency room.",
                    "source": "988 Suicide & Crisis Lifeline",
                    "type": "resource",
                    "metadata": {
                        "resource": "crisis", 
                        "availability": "24/7",
                        "contact": "988",
                        "emergency": "911"
                    }
                },
                {
                    "text": "Mindfulness meditation involves paying attention to the present moment without judgment. Regular practice can significantly reduce stress, improve emotional regulation, enhance focus, and increase overall wellbeing. Start with 5-10 minutes daily, focusing on breath awareness and body sensations.",
                    "source": "Mindfulness-Based Stress Reduction Program",
                    "type": "technique",
                    "metadata": {
                        "technique": "mindfulness", 
                        "benefits": ["stress reduction", "emotional regulation", "focus", "wellbeing"],
                        "practice_time": "5-10 minutes daily",
                        "difficulty": "beginner"
                    }
                },
                {
                    "text": "Self-care is essential for maintaining mental health and includes: adequate sleep (7-9 hours), regular physical activity (30 minutes daily), balanced nutrition, strong social connections, engaging in enjoyable activities, setting boundaries, practicing relaxation techniques, and seeking professional help when needed.",
                    "source": "Mental Health America",
                    "type": "prevention",
                    "metadata": {
                        "category": "self_care", 
                        "components": ["sleep", "exercise", "nutrition", "social", "enjoyment", "boundaries"],
                        "importance": "high",
                        "frequency": "daily"
                    }
                },
                {
                    "text": "Panic attacks are sudden episodes of intense fear that trigger severe physical reactions when there is no real danger. Symptoms include racing heart, sweating, trembling, shortness of breath, chest pain, and fear of losing control. Breathing exercises, grounding techniques, and cognitive restructuring can help manage panic attacks.",
                    "source": "Anxiety and Depression Association of America",
                    "type": "condition",
                    "metadata": {
                        "condition": "panic attacks", 
                        "symptoms": ["racing heart", "sweating", "trembling", "shortness of breath"],
                        "management": ["breathing exercises", "grounding techniques", "cognitive restructuring"]
                    }
                }
            ]
            
            success = self.rag_system.add_knowledge_documents(sample_documents)
            if success:
                print("✅ Knowledge base initialized with comprehensive mental health data")
                print(f"📚 Loaded {len(sample_documents)} mental health documents")
            else:
                print("⚠️ Knowledge base initialization had some issues")
                
        except Exception as e:
            print(f"❌ Could not initialize knowledge base: {e}")
            print("💡 The system will still work but with limited mental health knowledge")
    
    def _add_to_history(self, role: str, message: str):
        """Add a message to conversation history"""
        timestamp = datetime.now().isoformat()
        self.conversation_history.append({
            "role": role,
            "message": message,
            "timestamp": timestamp,
            "session_id": self.current_session_id,
            "language": self.target_language
        })
    
    def detect_language(self, text: str) -> str:
        """Detect the language of the input text"""
        try:
            if not text.strip():
                return "en"
            
            # Simple heuristic-based detection
            if any(char in text for char in ['।', '़', '्']):
                return "hi"
            elif any(char in text for char in ['ñ', 'á', 'é', 'í', 'ó', 'ú']):
                return "es"
            elif any(char in text for char in ['ä', 'ö', 'ü', 'ß']):
                return "de"
            elif any(char in text for char in ['à', 'è', 'ì', 'ò', 'ù']):
                return "fr"
            
            return "en"
        except:
            return "en"
    
    def translate_text(self, text: str, target_lang: str = "en", source_lang: str = "auto") -> str:
        """Translate text to target language"""
        try:
            if not text.strip() or source_lang == target_lang:
                return text
            
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated = translator.translate(text)
            return translated
        except Exception as e:
            print(f"⚠️ Translation error: {e}")
            return text
    
    def text_to_speech(self, text: str, lang: str = "en"):
        """Convert text to speech using multiple fallback methods"""
        if not text.strip():
            return
        
        try:
            # Method 1: gTTS (Google Text-to-Speech)
            print(f"🔊 Speaking: {text[:50]}..." if len(text) > 50 else f"🔊 Speaking: {text}")
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                tts = gTTS(text=text, lang=lang, slow=False)
                tts.save(tmp_file.name)
                
                # Play audio with pygame
                pygame.mixer.music.load(tmp_file.name)
                pygame.mixer.music.play()
                
                # Wait for playback to finish
                while pygame.mixer.music.get_busy():
                    time.sleep(0.1)
                
                # Clean up
                os.unlink(tmp_file.name)
                
        except Exception as e:
            print(f"❌ TTS failed: {e}")
            # Fallback: Print text with typing animation
            print("\n🤖 AI: ", end="", flush=True)
            for char in text:
                print(char, end="", flush=True)
                time.sleep(0.03)
            print()
    
    def speech_to_text(self) -> str:
        """Convert speech to text using multiple fallback methods"""
        if not self.has_audio:
            return input("💬 Type your message: ")
        
        print("🎤 Listening... (Speak now)")
        
        try:
            # Method 1: Google Speech Recognition
            with sr.Microphone() as source:
                # Adjust for ambient noise
                print("🔊 Adjusting for ambient noise...")
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                
                # Listen for audio
                print("🎤 Listening...")
                audio = self.recognizer.listen(source, timeout=8, phrase_time_limit=6)
                
                # Recognize speech
                text = self.recognizer.recognize_google(audio)
                print(f"👤 You said: {text}")
                return text
                
        except sr.WaitTimeoutError:
            print("⏰ Listening timeout - no speech detected")
            return ""
        except sr.UnknownValueError:
            print("❓ Could not understand audio")
            return ""
        except sr.RequestError as e:
            print(f"🌐 Speech recognition error: {e}")
            # Fallback: Manual text input
            return input("💬 Type your message: ")
        except OSError as e:
            print(f"🎤 Microphone error: {e}")
            print("🎤 Falling back to text input...")
            self.has_audio = False
            return input("💬 Type your message: ")
        except Exception as e:
            print(f"❌ Speech recognition failed: {e}")
            return input("💬 Type your message: ")
    
    def process_message(self, user_input: str) -> str:
        """Process user input and generate response"""
        if not user_input.strip():
            return "Please speak clearly or type your message."
        
        # Detect input language and translate to English for processing
        detected_lang = self.detect_language(user_input)
        english_input = user_input
        
        if detected_lang != "en":
            english_input = self.translate_text(user_input, "en", detected_lang)
            print(f"🌐 Detected: {detected_lang}, Translated to English for processing")
        
        # Add user message to history
        self._add_to_history("user", user_input)
        
        # Generate response using RAG system (in English)
        start_time = time.time()
        response_data = self.rag_system.generate_response(english_input)
        response_time = time.time() - start_time
        
        # Translate response back to target language if needed
        english_response = response_data['response']
        final_response = english_response
        
        if self.target_language != "en":
            final_response = self.translate_text(english_response, self.target_language, "en")
            print(f"🌐 Response translated to {self.target_language}")
        
        # Add assistant response to history
        self._add_to_history("assistant", final_response)
        
        print(f"⏱️ Response generated in {response_time:.2f}s")
        return final_response
    
    def play_welcome_message(self):
        """Play welcome message when starting new chat"""
        if self.has_audio:
            welcome_text = "Hello! I'm Jimmy, your mental health assistant. How can I support you today?"
            self.text_to_speech(welcome_text, self.target_language)
        else:
            print("💬 Hello! I'm Jimmy, your mental health assistant. How can I support you today?")
    
    def start_new_chat(self):
        """Start a new conversation session"""
        self.current_session_id = f"session_{int(time.time())}"
        self.conversation_history = []
        
        print("\n" + "="*60)
        print("🆕 NEW VOICE CHAT SESSION STARTED")
        print("="*60)
        if self.has_audio:
            print("💬 Voice assistant ready!")
            print("💬 Speak clearly after the beep")
        else:
            print("💬 Text mode activated")
            print("💬 Type your messages")
        print("💬 Say 'help' for available commands")
        print(f"💬 Current language: {self.target_language}")
        print("="*60)
        
        self.play_welcome_message()
        self._add_to_history("system", "Voice chat session started")
    
    def voice_command_handler(self, command: str) -> bool:
        """Handle voice commands"""
        command = command.lower().strip()
        
        if command in ['help', 'commands']:
            help_text = """
Available voice commands:
- "new chat" or "start over" - Start new conversation
- "change language" - Change language settings
- "history" - Show conversation history
- "save" - Save conversation to file
- "exit" or "quit" - Exit the program
- "about" - Information about this assistant
- "stats" - Show statistics
"""
            print(help_text)
            if self.has_audio:
                self.text_to_speech("Here are the available voice commands.", self.target_language)
            return True
            
        elif command in ['new chat', 'start over', 'restart']:
            self.start_new_chat()
            return True
            
        elif command in ['change language', 'language settings']:
            if self.has_audio:
                self.text_to_speech("Please say the language code you want to use, like 'es' for Spanish or 'fr' for French.", self.target_language)
            lang_code = self.speech_to_text().strip().lower()
            if lang_code in self.supported_languages.values():
                self.target_language = lang_code
                lang_name = [k for k, v in self.supported_languages.items() if v == lang_code][0]
                if self.has_audio:
                    self.text_to_speech(f"Language changed to {lang_name}", "en")
                else:
                    print(f"✓ Language changed to {lang_name} ({lang_code})")
            else:
                if self.has_audio:
                    self.text_to_speech("Sorry, I didn't understand that language code.", self.target_language)
                else:
                    print("❌ Invalid language code")
            return True
            
        elif command in ['exit', 'quit', 'goodbye']:
            if self.has_audio:
                self.text_to_speech("Goodbye! Take care of yourself.", self.target_language)
            print("👋 Goodbye!")
            exit()
            
        return False
    
    def run_voice_chat(self):
        """Main voice chat loop"""
        print("🚀 Starting Voice Mental Health Chatbot...")
        if self.has_audio:
            print("🎤 Speak clearly into your microphone")
            print("🔊 Adjust your volume for text-to-speech output")
        else:
            print("📝 Text mode activated")
        print("⏹️ Say 'exit' to quit")
        
        self.start_new_chat()
        
        while True:
            try:
                if self.has_audio:
                    # Play listening sound
                    print("\n🔊 (beep) ", end="", flush=True)
                    # Simple beep sound
                    print("\a", end="", flush=True)
                    time.sleep(0.2)
                
                # Listen for speech or get text input
                user_input = self.speech_to_text()
                
                if not user_input.strip():
                    continue
                
                # Check for voice commands
                if self.voice_command_handler(user_input):
                    continue
                
                # Process regular message
                print("🤖 Thinking...", end="", flush=True)
                
                response = self.process_message(user_input)
                
                # Speak the response if audio is available
                if self.has_audio:
                    self.text_to_speech(response, self.target_language)
                else:
                    print(f"\n🤖 AI: {response}")
                
            except KeyboardInterrupt:
                print("\n\n⚠️ Interrupted by user")
                if self.has_audio:
                    self.text_to_speech("Session interrupted.", self.target_language)
                break
                
            except Exception as e:
                print(f"\n❌ Error: {e}")
                if self.has_audio:
                    self.text_to_speech("Sorry, I encountered an error. Please try again.", self.target_language)
                continue
    
    def run_text_fallback(self):
        """Fallback to text interface if voice fails"""
        print("🎤 Voice mode unavailable. Falling back to text mode...")
        
        # Import and use the text agent directly
        text_agent = MentalHealthAgent(self.groq_api_key)
        text_agent.run()

    def run(self):
        """Main entry point with fallback handling"""
        try:
            if not self.has_audio:
                print("❌ Audio system not available")
                self.run_text_fallback()
                return
            
            # Test microphone availability
            print("🔍 Checking microphone...")
            try:
                with sr.Microphone() as source:
                    print("✓ Microphone detected")
            except OSError as e:
                print(f"❌ Microphone error: {e}")
                self.has_audio = False
                self.run_text_fallback()
                return
            
            # Run voice chat
            self.run_voice_chat()
            
        except Exception as e:
            print(f"❌ Voice system error: {e}")
            print("🎤 Falling back to text mode...")
            self.run_text_fallback()


# Define MentalHealthAgent class here to avoid import issues
class MentalHealthAgent:
    """Text-based mental health agent for fallback"""
    
    def __init__(self, groq_api_key: str):
        self.groq_api_key = groq_api_key
        self.rag_system = MentalHealthRAG(groq_api_key)
        self.conversation_history = []
        self.current_session_id = None
        
        # Initialize with sample data
        sample_documents = [
            {
                "text": "Depression is treatable with therapy (CBT, IPT) and medication. Symptoms include persistent sadness, loss of interest, sleep/appetite changes, low energy, and poor concentration.",
                "source": "WHO",
                "type": "condition",
                "metadata": {"condition": "depression", "severity": "general"}
            },
            {
                "text": "Anxiety disorders involve excessive fear/worry. Treatment includes CBT, exposure therapy, relaxation techniques, and sometimes medication.",
                "source": "APA",
                "type": "condition",
                "metadata": {"condition": "anxiety", "severity": "general"}
            },
            {
                "text": "CBT helps identify and change negative thought patterns. Effective for depression, anxiety, eating disorders, and other mental health conditions.",
                "source": "NIMH",
                "type": "treatment",
                "metadata": {"therapy": "CBT", "conditions": "depression, anxiety"}
            },
            {
                "text": "For mental health crisis, call/text 988 (Suicide & Crisis Lifeline) for free, confidential support 24/7.",
                "source": "988 Lifeline",
                "type": "resource",
                "metadata": {"resource": "crisis", "availability": "24/7"}
            },
            {
                "text": "Mindfulness meditation reduces stress and improves emotional regulation. Practice 5-10 minutes daily focusing on breath.",
                "source": "MBSR",
                "type": "technique",
                "metadata": {"technique": "mindfulness", "duration": "5-10min"}
            },
            {
                "text": "Self-care includes adequate sleep, exercise, nutrition, social connections, and enjoyable activities for mental wellbeing.",
                "source": "MHA",
                "type": "prevention",
                "metadata": {"category": "self_care", "components": "sleep, exercise, nutrition"}
            }
        ]
        
        self.rag_system.add_knowledge_documents(sample_documents)
        print("✓ Knowledge base initialized")
    
    def _add_to_history(self, role: str, message: str):
        timestamp = datetime.now().isoformat()
        self.conversation_history.append({
            "role": role,
            "message": message,
            "timestamp": timestamp,
            "session_id": self.current_session_id
        })
    
    def start_new_chat(self):
        self.current_session_id = f"session_{int(time.time())}"
        self.conversation_history = []
        
        print("\n" + "="*60)
        print("NEW CHAT SESSION STARTED")
        print("="*60)
        print("Hi there! I'm your mental health assistant.")
        print("How can I support you today?")
        print("Type '/help' for available commands")
        print("="*60)
        
        self._add_to_history("system", "Hi there! I'm your mental health assistant. How can I support you today?")
    
    def process_message(self, user_input: str) -> str:
        if not user_input.strip():
            return "Please type something to chat with me."
        
        self._add_to_history("user", user_input)
        response_data = self.rag_system.generate_response(user_input)
        response = response_data['response']
        self._add_to_history("assistant", response)
        return response
    
    def show_help(self):
        help_text = """
AVAILABLE COMMANDS:
/help       - Show this help message
/new        - Start a new chat session
/history    - Show conversation history
/clear      - Clear current conversation
/save       - Save conversation to file
/exit       - Exit the program
/about      - Show information about this agent
/stats      - Show knowledge base statistics
"""
        print(help_text)
    
    def run(self):
        print("🚀 Initializing Mental Health Chatbot Agent...")
        self.start_new_chat()
        
        while True:
            try:
                user_input = input("\n👤 YOU: ").strip()
                
                if user_input.startswith('/'):
                    command = user_input[1:].lower()
                    
                    if command in ['exit', 'quit']:
                        print("👋 Goodbye! Take care of yourself.")
                        break
                    elif command in ['new', 'reset']:
                        self.start_new_chat()
                        continue
                    elif command in ['help', '?']:
                        self.show_help()
                        continue
                    else:
                        print("Unknown command. Type /help for available commands.")
                        continue
                
                print("\n🤖 AI: ", end="", flush=True)
                response = self.process_message(user_input)
                for char in response:
                    print(char, end="", flush=True)
                    time.sleep(0.001)
                print()
                
            except KeyboardInterrupt:
                print("\n\nInterrupted. Type /exit to quit or continue chatting.")
                continue
            except Exception as e:
                print(f"\nError: {e}")
                print("Please try again or type /new to start a fresh conversation.")


def main():
    """Main function"""
    # Get Groq API key from environment variable
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        print("❌ Please set GROQ_API_KEY environment variable")
        print("💡 Run: export GROQ_API_KEY=your_api_key_here")
        return
    
    # Create and run the voice agent
    voice_agent = VoiceMentalHealthAgent(groq_api_key)
    voice_agent.run()


if __name__ == "__main__":
    main()