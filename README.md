Virtual Girlfriend
This project is a “digital human” / virtual girlfriend that can see, hear and talk to you in real time. It combines an LLM-powered brain, a 3D avatar frontend, an audio pipeline with OpenAI Whisper, ElevenLabs, and a local Chatterbox TTS API for fast, expressive speech.

Demo & Media
This section collects all available demo videos and images referenced in the codebase.

Main Demo Video
Virtual avatar demo (GitHub asset):
https://github.com/asanchezyali/talking-avatar-with-ai/assets/29262782/da316db9-6dd1-4475-9fe5-39dafbeb3cc4
You can embed it in Markdown (for GitHub) like this:

https://github.com/asanchezyali/talking-avatar-with-ai/assets/29262782/da316db9-6dd1-4475-9fe5-39dafbeb3cc4
System Architecture Diagram
Full architecture SVG:
![System Architecture](resources/architecture.drawio.svg)
Open WebUI Integration Screenshot
Screenshot demonstrating Chatterbox TTS integration with Open WebUI:
![Open WebUI Chatterbox TTS Settings](https://lm17s1uz51.ufs.sh/f/EsgO8cDHBTOUjUe3QjHytHQ0xqn2CishmXgGfeJ4o983TUMO)
High-Level Architecture
The project is composed of three main layers working together.

Frontend: React-based UI rendering the 3D avatar and handling user interaction.
Backend (apps/backend): Node-based API that talks to OpenAI, ElevenLabs, Rhubarb Lip Sync and the local TTS service.
Local TTS Service (chatterbox-tts-api): A FastAPI app that exposes OpenAI‑compatible TTS endpoints and is used by the backend for low-latency speech.
The backend’s Chatterbox integration lives in:

// apps/backend/modules/chatter-box.mjs
const chatterBoxUrl = "http://127.0.0.1:4123/v1/audio/speech/upload";
const voiceSamplePath = path.join(
  process.cwd(),
  "././chatterbox-tts-api/voice-sample.mp3"
);
Features
This section summarizes the capabilities exposed by the combined system.

Conversational Brain
Uses an OpenAI chat model configured via a prompt that drives avatar personality, facial expressions, and animation cues.

Text‑to‑Speech (TTS) with Voice Cloning

Local Chatterbox TTS API with OpenAI‑compatible endpoints (/v1/audio/speech, /v1/audio/speech/upload).
Uses voice-sample.mp3 for conditioning, enabling a consistent avatar voice.
Multilingual Support (TTS Layer)

/languages to list supported languages.
/voices to upload voices with language metadata.
/v1/audio/speech and /v1/audio/speech/stream that auto‑detect language from voice metadata.
Rich Monitoring & Tools (TTS Layer)

Health check at /health.
Memory monitoring endpoints and a React dashboard for memory usage.
Requirements
You need these tools and accounts before running the full stack.

Accounts / API keys (for apps/backend/.env):

OpenAI API key (OPENAI_API_KEY and model name).
ElevenLabs API key, voice ID, and model ID.
System Tools

Node.js and Yarn for the monorepo frontend/backend.
Python 3.11 for Chatterbox TTS API.
ffmpeg installed on your OS.
Rhubarb Lip Sync binaries placed in a /bin folder for lip‑sync generation (backend uses its output).
Repository Layout
The key directories used by this project are:

chatterbox-tts-api/     # Local TTS FastAPI service (subproject)
  app/
  docs/
  docker/
  tests/
  main.py
  start.py

apps/
  backend/              # Node backend integrating LLM, TTS, lip-sync, etc.
    modules/
      chatter-box.mjs   # Uses local Chatterbox TTS API

frontend/               # React avatar UI (served via Docker in TTS subproject or monorepo tooling)
1. Setting Up the Chatterbox TTS API
The virtual girlfriend relies on the local Chatterbox TTS API running at http://127.0.0.1:4123.

You can run it either via Docker (recommended) or directly with Python.

1.1. Quick Start with Docker (Recommended)
From the chatterbox-tts-api directory:

cd chatterbox-tts-api

# Copy Docker-specific or local env template
cp .env.example.docker .env      # Docker-focused defaults
# or
cp .env.example .env             # Local paths, then edit manually
Choose a deployment variant:

# Standard (pip-based)
docker compose -f docker/docker-compose.yml up -d

# uv-optimized
docker compose -f docker/docker-compose.uv.yml up -d

# GPU variants
docker compose -f docker/docker-compose.gpu.yml up -d
docker compose -f docker/docker-compose.uv.gpu.yml up -d

# CPU-only
docker compose -f docker/docker-compose.cpu.yml up -d
Check logs and test:

# Watch service logs
docker logs chatterbox-tts-api -f

# Simple test: generate audio
curl -X POST http://localhost:4123/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello from Chatterbox TTS!"}' \
  --output test.wav
1.2. Local Python Setup (No Docker)
From chatterbox-tts-api:

cd chatterbox-tts-api

# Install dependencies with uv (preferred)
uv sync
# or with pip
pip install -r requirements.txt
Create .env from template:

cp .env.example .env
# then edit .env to adjust PORT, DEVICE, EXAGGERATION, etc.
Run the API:

# Development with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 4123 --reload

# Or use the helper script
python start.py dev       # dev mode
python start.py prod      # production mode
python start.py fullstack # API + frontend via Docker
Verify it is running:

curl http://localhost:4123/health
curl http://localhost:4123/openapi.json
2. Setting Up the Digital Human / Virtual Girlfriend App
These steps run the monorepo backend+frontend that talk to the TTS API.

2.1. Clone and Install
# From your workspace
git clone <your-fork-or-repo-url> virtual-girlfriend
cd virtual-girlfriend

# Install all monorepo dependencies
yarn
2.2. Backend Environment Configuration
Create an .env file in apps/backend/ with the necessary secrets:

cd apps/backend

cat > .env << 'EOF'
# OpenAI
OPENAI_MODEL=<YOUR_GPT_MODEL>
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>

# Eleven Labs
ELEVEN_LABS_API_KEY=<YOUR_ELEVEN_LABS_API_KEY>
ELVEN_LABS_VOICE_ID=<YOUR_ELEVEN_LABS_VOICE_ID>
ELEVEN_LABS_MODEL_ID=<YOUR_ELEVEN_LABS_MODEL_ID>
EOF
Ensure the Chatterbox TTS API base URL and voice sample path used in apps/backend/modules/chatter-box.mjs are valid for your environment.

2.3. Run the Development Stack
From the project root:

# Make sure Chatterbox TTS API is already running on port 4123
# Then start the monorepo dev processes
yarn dev
Open the frontend in your browser:

Default route: http://localhost:5173/
Optional demo route (if implemented in your frontend): http://localhost:5173/demo
3. Using the Local TTS API Directly
You can hit the Chatterbox TTS endpoints yourself for testing or debugging.

3.1. Basic JSON TTS Request
curl -X POST http://localhost:4123/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello! This is using the default configured voice sample.", "exaggeration": 0.7}' \
  --output test.wav
3.2. Upload Endpoint with Optional Voice File
curl -X POST http://localhost:4123/v1/audio/speech/upload \
  -F "input=Hello! This is using the upload endpoint without a file." \
  -F "exaggeration=0.6" \
  -F "temperature=0.9" \
  --output test_upload_default_voice.wav
To upload a custom voice sample, point voice_file at voice-sample.mp3 or any WAV/MP3 file you prefer.

4. Running Tests
There are automated tests for the TTS subproject.

4.1. From chatterbox-tts-api
cd chatterbox-tts-api

# Run API tests
python tests/test_api.py
# or
uv run tests/test_api.py

# Run memory tests
python tests/test_memory.py
You can also use the helper:

python start.py test
5. Troubleshooting
Common issues are mostly related to the TTS service stack.

Python / NumPy / PyTorch compatibility
Pin Python to 3.11 for best compatibility.
CUDA / GPU issues
Use the GPU‑ or CPU‑specific Docker Compose files to ensure the correct PyTorch wheel is installed.
Port conflicts
Change the port used by the TTS API by editing PORT in .env and apps/backend/modules/chatter-box.mjs.
If you still run into problems, check:

chatterbox-tts-api/docs/README.md and API_README.md for more detailed TTS docs.
Logs from docker logs chatterbox-tts-api or the local FastAPI process.
6. Extending the Project
You can extend the virtual girlfriend with new capabilities in multiple layers.

Change Personality / Behavior
Edit the OpenAI prompt and template that define the avatar’s persona and output JSON schema.

Add New TTS or Languages
Use the multilingual endpoints (/languages, /voices, /v1/audio/speech) and update frontend/backend to expose new language options.

Enhance UI
Modify React components in the frontend to add controls, visualizations, or additional avatar states.

7. License and Credits
The Chatterbox TTS API subproject is licensed under AGPLv3 and originates from travisvn/chatterbox-tts-api.
The digital human design and tutorial are inspired by the original “Digital Human” article and repo referenced in the legacy README.
Please review each upstream project’s license before reusing or redistributing components.
