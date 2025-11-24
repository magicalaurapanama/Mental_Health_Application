# Mind Oasis: A Mental Health Application

**Project Overview**

Mind Oasis is a capstone project built as a comprehensive mental health application. It is designed to cater to two distinct user groups: adults seeking general mental wellness support and children with dyslexia and ADHD who require engaging games for focus and memory improvement. The application integrates AI-powered features to provide a more personalized and effective user experience.

# Mental Health Application (Mind Oasis)

This repository contains a full-stack mental health application (React frontend + Express backend) and a separate Python-based AI assistant (RAG-powered chatbot) located in the `ai/` folder. The project provides general mental wellness tools, interactive games (for children with attention/dyslexia-friendly features), and an experimental AI assistant for supportive, non-clinical conversation.

--

## Project components

- `public/` - static assets for the React frontend
- `src/` - React app source (UI components, routes, Firebase integration)
- `server/` - Express backend (authentication routes, MongoDB connection)
- `ai/` - Python RAG chatbot (ChromaDB + Groq/Llama integration)
- `data/` - bundled local data and DB files used by the project (do not commit secrets)

## Quick overview

- Frontend: React (create-react-app / `react-scripts`). Run with `npm start` from project root.
- Backend: Node/Express connecting to MongoDB. Runs from `server/server.js` and exposes `/api` routes.
- AI assistant: Python-based Retrieval-Augmented Generation (RAG) system in `ai/` (requires Python, virtualenv, and GROQ API key).

## Requirements

- Node.js (v16+ recommended)
- npm
- Python 3.10+ (for `ai/` components)
- pip
- MongoDB (local or hosted; required for `server/`)

## Setup and run (Windows - PowerShell)

1) Clone repository

```powershell
git clone <repo-url>
cd "C:\Users\amana\OneDrive\Desktop\Java Script\Mental_Health_Application"
```

2) Frontend (React)

```powershell
# Install dependencies (run from repository root)
npm install

# Start the frontend
npm start
```

This runs the React app via `react-scripts` (default: http://localhost:3000).

3) Backend (Express)

```powershell
cd server
npm install

# Create a .env file (example below) then start the server
node server.js
```

Required environment variables for the backend (create `server/.env`):

```
MONGO_URI=mongodb://localhost:27017/mental_health_db
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

The backend exposes authentication endpoints under `/api/auth` (register/login). The login route returns a JWT signed with `JWT_SECRET`.

4) AI Assistant (optional)

The `ai/` folder contains a Retrieval-Augmented Generation (RAG) assistant implemented with ChromaDB and the Groq/Llama stack. To run it:

```powershell
cd ai
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create an `.env` file in `ai/` (or set environment variables) with at least:

```
GROQ_API_KEY=your_groq_api_key_here
CHROMA_DB_PATH=./chroma_mentalhealth_db
LOG_LEVEL=INFO
```

Run the CLI agent:

```powershell
python agent.py
```

Or start the FastAPI server:

```powershell
python server.py
```

Notes:
- The AI assistant is experimental and requires a paid/authorized API key for the model provider used in the `ai/` code.
- The assistant is not a replacement for trained mental health professionals. See the Disclaimer below.

## Firebase

`src/firebase.js` contains a Firebase configuration used by the frontend for authentication and Firestore. The project currently includes a Firebase configuration object in the file; for production use, move these values into environment variables or a safer secrets store.

## Project structure (high level)

```
.
├─ ai/                      # Python RAG assistant (Chroma, Groq integration)
├─ public/                  # Frontend static files
├─ server/                  # Express backend (auth, MongoDB)
├─ src/                     # React frontend source
├─ data/                    # Local data / DB files
├─ package.json             # Frontend scripts + deps
└─ README.md
```

## Useful scripts

- `npm start` - run React frontend (development)
- `npm run build` - build React app for production
- Backend: `node server/server.js` - runs Express server (or `npm start` from `server/` if you configure scripts)

## Troubleshooting

- If the frontend fails to start, check for port conflicts or missing dependencies. Run `npm install` again.
- If the backend reports MongoDB connection errors, confirm `MONGO_URI` and that MongoDB is running.
- For AI issues, verify `GROQ_API_KEY`, Python environment, and ChromaDB path.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "Add my feature"`
4. Push and open a PR

## License & Disclaimer

This project is provided under the MIT License (see `LICENSE` if present). It is a student/capstone project and is intended for educational/demo use only. The AI assistant and app do not provide clinical or emergency mental health services. If you or someone is in crisis, contact local emergency services or a licensed professional.

## Credits

- Project contributors: group members (see `ai/readme.md` for author attribution)

---

If you'd like, I can also:
- add a short `server/.env.example` and `ai/.env.example` to the repo,
- add `README` sections with example API calls and screenshots, or
- run the frontend and backend locally and report any runtime errors.



