import os
import json
import time
from datetime import datetime
from typing import List, Dict
import readline

from rag import MentalHealthRAG
from deep_translator import GoogleTranslator

class MentalHealthAgent:
    """
    CLI Interface for Mental Health Chatbot with conversation memory and multilingual support
    """
    
    def __init__(self, groq_api_key: str):
        self.groq_api_key = groq_api_key
        self.rag_system = MentalHealthRAG(groq_api_key)
        self.conversation_history = []
        self.current_session_id = None
        self.user_name = "User"
        self.target_language = "en"  # Default language (English)
        self.supported_languages = GoogleTranslator().get_supported_languages(as_dict=True)
        
        self._initialize_knowledge_base()
    
    def _initialize_knowledge_base(self):
        """Initialize the knowledge base with sample data"""
        try:
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
            
        except Exception as e:
            print(f"Could not initialize knowledge base: {e}")
    
    def detect_language(self, text: str) -> str:
        """Detect the language of the input text"""
        try:
            # Simple detection based on common patterns
            if any(char in text for char in ['।', '़', '्']):  # Hindi characters
                return "hi"
            elif any(char in text for char in ['ñ', 'á', 'é', 'í', 'ó', 'ú']):  # Spanish characters
                return "es"
            elif any(char in text for char in ['ä', 'ö', 'ü', 'ß']):  # German characters
                return "de"
            elif any(char in text for char in ['à', 'è', 'ì', 'ò', 'ù']):  # French/Italian characters
                return "fr"
            # Add more language detection patterns as needed
            
            # Default to English if no specific patterns detected
            return "en"
        except:
            return "en"  # Fallback to English
    
    def translate_text(self, text: str, target_lang: str = "en", source_lang: str = "auto") -> str:
        """Translate text to target language"""
        try:
            if not text.strip():
                return text
            
            # Don't translate if already in target language
            if source_lang == target_lang:
                return text
            
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated = translator.translate(text)
            return translated
        except Exception as e:
            print(f"⚠️  Translation error: {e}")
            return text  # Return original text if translation fails
    
    def set_language(self, lang_code: str):
        """Set the target language for conversation"""
        if lang_code in self.supported_languages.values():
            self.target_language = lang_code
            lang_name = [k for k, v in self.supported_languages.items() if v == lang_code][0]
            print(f"✓ Language set to: {lang_name} ({lang_code})")
        else:
            print("❌ Unsupported language code. Use /langs to see supported languages.")
    
    def show_supported_languages(self):
        """Display supported languages"""
        print("\n🌍 SUPPORTED LANGUAGES (133 languages)")
        print("="*50)
        
        # Display languages in a formatted way
        languages = list(self.supported_languages.items())
        for i in range(0, len(languages), 4):  # 4 columns
            row = languages[i:i+4]
            print("  ".join(f"{lang[1]}={lang[0]}" for lang in row))
        
        print("\n💡 Use /lang [code] to set language (e.g., /lang es for Spanish)")
        print("💡 Current language:", self.target_language)
    
    def start_new_chat(self):
        """Start a new conversation session"""
        self.current_session_id = f"session_{int(time.time())}"
        self.conversation_history = []
        
        print("\n" + "="*60)
        print("🆕 NEW CHAT SESSION STARTED")
        print("="*60)
        print("💬 Hi there! I'm your mental health assistant.")
        print("💬 How can I support you today?")
        print("💬 Type '/help' for available commands")
        print(f"💬 Current language: {self.target_language}")
        print("="*60)
        
        self._add_to_history("system", "Hi there! I'm your mental health assistant. How can I support you today?")
    
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
    
    def _get_conversation_context(self, max_messages: int = 10) -> str:
        """Get recent conversation context for better continuity"""
        if not self.conversation_history:
            return ""
        
        # Get last few messages (excluding system messages)
        recent_messages = [msg for msg in self.conversation_history[-max_messages:] 
                          if msg['role'] in ['user', 'assistant']]
        
        context = "Recent conversation context:\n"
        for msg in recent_messages:
            speaker = "USER" if msg['role'] == 'user' else "ASSISTANT"
            context += f"{speaker}: {msg['message']}\n"
        
        return context
    
    def process_message(self, user_input: str) -> str:
        """Process user input and generate response with translation"""
        if not user_input.strip():
            return "Please type something to chat with me."
        
        # Detect input language and translate to English for processing
        detected_lang = self.detect_language(user_input)
        english_input = user_input
        
        if detected_lang != "en":
            english_input = self.translate_text(user_input, "en", detected_lang)
            print(f"🌐 Detected: {detected_lang}, Translated to English for processing")
        
        # Add original user message to history
        self._add_to_history("user", user_input)
        
        # Get conversation context
        conversation_context = self._get_conversation_context()
        
        # Prepare the query with context
        contextual_query = f"{conversation_context}\nCurrent query: {english_input}" if conversation_context else english_input
        
        # Generate response using RAG system (in English)
        start_time = time.time()
        response_data = self.rag_system.generate_response(contextual_query)
        response_time = time.time() - start_time
        
        # Translate response back to target language if needed
        english_response = response_data['response']
        final_response = english_response
        
        if self.target_language != "en":
            final_response = self.translate_text(english_response, self.target_language, "en")
            print(f"🌐 Response translated to {self.target_language}")
        
        # Add assistant response to history
        self._add_to_history("assistant", final_response)
        
        return final_response
    
    def show_help(self):
        """Show available commands"""
        help_text = f"""
📋 AVAILABLE COMMANDS:
/help       - Show this help message
/new        - Start a new chat session
/history    - Show conversation history
/clear      - Clear current conversation
/save       - Save conversation to file
/exit       - Exit the program
/about      - Show information about this agent
/stats      - Show knowledge base statistics
/langs      - Show supported languages
/lang [code]- Set language (e.g., /lang es, /lang fr, /lang hi)
/currentlang- Show current language

🌍 CURRENT LANGUAGE: {self.target_language}
        """
        print(help_text)
    
    def show_history(self):
        """Show conversation history"""
        if not self.conversation_history:
            print("No conversation history yet.")
            return
        
        print("\n" + "="*60)
        print("💾 CONVERSATION HISTORY")
        print("="*60)
        
        for i, msg in enumerate(self.conversation_history, 1):
            timestamp = datetime.fromisoformat(msg['timestamp']).strftime("%H:%M:%S")
            prefix = "👤 YOU: " if msg['role'] == 'user' else "🤖 AI: "
            lang_info = f" [{msg.get('language', 'en')}]" if msg['role'] == 'user' else ""
            print(f"{i:2d}. [{timestamp}]{lang_info} {prefix}{msg['message']}")
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        print("✓ Conversation history cleared")
    
    def save_conversation(self, filename: str = None):
        """Save conversation to file"""
        if not self.conversation_history:
            print("No conversation to save.")
            return
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"conversation_{timestamp}.json"
        
        try:
            data = {
                "session_id": self.current_session_id,
                "created_at": datetime.now().isoformat(),
                "language": self.target_language,
                "messages": self.conversation_history
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"✓ Conversation saved to {filename}")
            
        except Exception as e:
            print(f"❌ Error saving conversation: {e}")
    
    def show_about(self):
        """Show information about the agent"""
        about_text = f"""
🤖 MENTAL HEALTH CHATBOT AGENT
──────────────────────────────
Developed by: Group-33, B.Tech CSE Cloud Computing & Automation
Capstone Project: AI Mental Health Assistant
Team: Harjas, Divyam, Sonia, Manini, Jiyaa

Features:
• RAG-powered mental health support
• Multilingual support (133 languages)
• Conversation memory and context awareness
• Evidence-based information from trusted sources
• Crisis resource information
• General knowledge capabilities

Technology Stack:
• Groq API with Llama 3.3 70B Versatile
• ChromaDB vector database
• DeepTranslator for multilingual support
• Sentence Transformers for embeddings
• Custom RAG layer for mental health

🌍 Current Language: {self.target_language}
        """
        print(about_text)
    
    def show_stats(self):
        """Show knowledge base statistics"""
        stats = self.rag_system.get_collection_stats()
        print("\n📊 KNOWLEDGE BASE STATISTICS")
        print("="*30)
        print(f"Documents: {stats.get('document_count', 'N/A')}")
        print(f"Database: {stats.get('database_path', 'N/A')}")
        print(f"Session ID: {self.current_session_id}")
        print(f"Messages in memory: {len(self.conversation_history)}")
        print(f"Current language: {self.target_language}")
    
    def run(self):
        """Main CLI interface loop"""
        print("🚀 Initializing Mental Health Chatbot Agent...")
        print("🌍 Multilingual support enabled (133 languages)")
        
        # Start first chat session
        self.start_new_chat()
        
        while True:
            try:
                # Get user input
                user_input = input("\n👤 YOU: ").strip()
                
                # Check for commands
                if user_input.startswith('/'):
                    command_parts = user_input[1:].split()
                    command = command_parts[0].lower()
                    
                    if command in ['exit', 'quit']:
                        print("👋 Goodbye! Take care of yourself.")
                        break
                    
                    elif command in ['new', 'reset']:
                        self.start_new_chat()
                        continue
                    
                    elif command in ['help', '?']:
                        self.show_help()
                        continue
                    
                    elif command in ['history', 'hist']:
                        self.show_history()
                        continue
                    
                    elif command in ['clear', 'cls']:
                        self.clear_history()
                        continue
                    
                    elif command in ['save', 'export']:
                        self.save_conversation()
                        continue
                    
                    elif command in ['about', 'info']:
                        self.show_about()
                        continue
                    
                    elif command in ['stats', 'status']:
                        self.show_stats()
                        continue
                    
                    elif command in ['langs', 'languages']:
                        self.show_supported_languages()
                        continue
                    
                    elif command in ['lang', 'language']:
                        if len(command_parts) > 1:
                            self.set_language(command_parts[1])
                        else:
                            print("❌ Please specify language code. Usage: /lang es")
                        continue
                    
                    elif command in ['currentlang', 'current']:
                        lang_name = [k for k, v in self.supported_languages.items() if v == self.target_language][0]
                        print(f"🌍 Current language: {lang_name} ({self.target_language})")
                        continue
                    
                    else:
                        print("❌ Unknown command. Type /help for available commands.")
                        continue
                
                # Process regular message
                print("\n🤖 AI: ", end="", flush=True)
                
                response = self.process_message(user_input)
                
                # Type out response with slight delay for natural feel
                for char in response:
                    print(char, end="", flush=True)
                    time.sleep(0.001)
                print()
                
            except KeyboardInterrupt:
                print("\n\n⚠️  Interrupted. Type /exit to quit or continue chatting.")
                continue
            
            except Exception as e:
                print(f"\n❌ Error: {e}")
                print("Please try again or type /new to start a fresh conversation.")


def main():
    """Main function"""
    # Get Groq API key from environment variable
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        print("❌ Please set GROQ_API_KEY environment variable")
        print("💡 Run: export GROQ_API_KEY=your_api_key_here")
        return
    
    # Create and run the agent
    agent = MentalHealthAgent(groq_api_key)
    agent.run()


if __name__ == "__main__":
    main()