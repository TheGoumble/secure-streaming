# Secure Streaming Platform — CIS 4634 Final Project

This project is a secure video streaming platform built for **CIS 4634**. It demonstrates:
- **React Frontend** with real-time video streaming
- **Java Spring Boot Backend** with WebSocket support
- **Per-session AES-256 encryption** using Web Crypto API
- **Real-time chat** functionality

The core architecture:
**The frontend generates unique AES-256 keys per session. Video frames are encrypted client-side before transmission. The backend decrypts frames using session-specific keys and streams to viewers via MJPEG.**

---

## Features

### Frontend (React)
- Role selection: **Streamer** or **Viewer**
- **Streamer Mode:**
  - Generate unique AES-256 session key using Web Crypto API
  - Register key with backend
  - Capture webcam video
  - Encrypt frames using AES/ECB/PKCS7Padding (CryptoJS)
  - Stream encrypted frames via WebSocket
  - Real-time chat with viewers
- **Viewer Mode:**
  - View live MJPEG stream from any active streamer
  - Join chat room by streamer username
  - Real-time message synchronization

### Backend (Spring Boot)
- Runs on **http://localhost:8080**
- Session key management (per-streamer AES-256 keys)
- WebSocket endpoints:
  - `/stream` — Encrypted video frame receiver
  - `/chat` — Real-time chat messaging
- REST endpoints:
  - `POST /api/session` — Register streamer's AES key
  - `GET /api/session/{sessionId}/key` — Retrieve key (demo only)
  - `GET /view/{username}` — MJPEG stream for viewers
- Frame decryption using AES/ECB/PKCS5Padding
- Multi-viewer support with frame broadcasting
- Backend configuration (`application.properties`):
```properties
server.port=8080
spring.application.name=Secure_Stream
spring.websocket.messages.max-size=2097152
spring.websocket.buffer-size=2097152
```

---

## Project Structure

```
secure-streaming/
│
├── backend/                     # Spring Boot Backend
│   ├── pom.xml
│   └── src/main/
│       ├── java/
│       │   ├── config/
│       │   │   └── WebSocketConfig.java        # WebSocket configuration
│       │   ├── controller/
│       │   │   ├── ChatWebSocketHandler.java   # Chat WebSocket handler
│       │   │   ├── SessionController.java      # AES key registration API
│       │   │   ├── StreamViewerController.java # MJPEG stream endpoint
│       │   │   └── VideoStreamHandler.java     # Video WebSocket handler
│       │   ├── edu/project/app/
│       │   │   └── Main.java                   # Application entry point
│       │   ├── security/
│       │   │   ├── AESUtil.java                # AES decryption utility
│       │   │   └── SessionKeyRegistry.java     # Per-session key storage
│       │   └── service/
│       │       └── StreamManager.java          # Stream frame management
│       └── resources/
│           └── application.properties
│
└── frontend/                    # React Frontend
    ├── public/
    ├── src/
    │   ├── App.js
    │   ├── AppLayout.css
    │   ├── AppStreamerViewer.jsx       # Main app component
    │   ├── ChatContainer.jsx           # Chat WebSocket container
    │   ├── ChatPanel.jsx               # Chat UI component
    │   ├── ChatPanel.css
    │   ├── CryptoUtils.js              # AES encryption utilities
    │   ├── VideoStreamer.jsx           # Video streaming component
    │   ├── config.js                   # Backend URLs & constants
    │   └── index.js
    ├── package.json
    └── package-lock.json
```

---

## Requirements
You must have:
- **Java JDK 17+**
- **Apache Maven 3.9+**
- **Node.js + npm**
- **Git**

Verify Java:
```powershell
java -version
```

---

## Installing Maven Manually (Windows)
1. Download the ZIP (working link):  
   https://archive.apache.org/dist/maven/maven-3/3.9.7/binaries/apache-maven-3.9.7-bin.zip

2. Extract to:
```
C:\Program Files\apache-maven-3.9.7
```

3. Add to PATH:
```
C:\Program Files\apache-maven-3.9.7\bin
```

4. Restart PowerShell and verify:
```powershell
mvn -v
```

---

## Cloning the Repository
```powershell
git clone https://github.com/TheGoumble/secure-streaming.git
cd secure-streaming
```

---
## Project Configuration

### Backend Configuration
Ensure `backend/src/main/resources/application.properties` contains:
```properties
server.port=8080
spring.application.name=Secure_Stream
spring.websocket.messages.max-size=2097152
spring.websocket.buffer-size=2097152
```

### Frontend Configuration
Ensure `frontend/src/config.js` contains:
```javascript
export const BACKEND_HOST = "localhost";
export const BACKEND_PORT = "8080";
export const HTTP_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
export const WS_BASE_URL = `ws://${BACKEND_HOST}:${BACKEND_PORT}`;
```

**Important:** Backend and frontend ports must match!

---

## Running the Backend (Spring Boot on port 8080)

```powershell
cd backend
mvn clean spring-boot:run
```

Expected output:
```
:: Spring Boot :: (v3.2.0)
Tomcat started on port(s): 8080
```

Backend is now live at:
```
http://localhost:8080
```

WebSocket endpoints:
- `ws://localhost:8080/stream` — Video streaming
- `ws://localhost:8080/chat` — Chat messaging

Leave this terminal open.

---

## Running the Frontend (React on port 3000)

Open a second terminal:
```powershell
cd frontend
npm install     # first time only
npm start
```

The frontend opens automatically at:
```
http://localhost:3000
```

Leave this running.

---

## Using the Application

### Streamer Flow
1. Open `http://localhost:3000`
2. Enter a unique username (e.g., "Bob")
3. Click **Be a Streamer**
4. Click **Start Streaming**
   - Browser will request camera permission
   - AES-256 key is automatically generated and registered
   - Video frames are encrypted and sent to backend
   - You'll see "🔴 LIVE" when streaming
5. Use the chat panel to communicate with viewers

### Viewer Flow
1. Open another browser window/tab at `http://localhost:3000`
2. Enter your username (e.g., "Bob")
3. Click **Be a Viewer**
4. Enter the streamer's username (e.g., "Rick")
5. Click **Join Stream**
   - Live video feed appears automatically
   - Join the chat room to send messages

Multiple viewers can watch the same stream simultaneously.

---

## Testing Backend Without Browser

### Create Host Session
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/session" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"sessionId":"demo"}'
```

### Viewer Joins Session
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/join" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"sessionId":"demo"}'
```

---

## Troubleshooting

### `mvn` not recognized
Add Maven to PATH and restart PowerShell.

### Frontend cannot reach backend
Ensure:
- Backend is running  
- Correct port (8080)  
- `config.js` points to backend  

### Port collision
Close the app using port **3000** or **8080**, or update your port in the configuration.

---

## Architecture Summary

### Security Features
- **Per-session AES-256 keys**: Each streaming session uses a unique encryption key
- **Client-side encryption**: Video frames encrypted in browser using Web Crypto API
- **Backend decryption**: Server decrypts frames using session-specific keys
- **AES/ECB/PKCS7**: Symmetric encryption matching CryptoJS ↔ Java cipher compatibility
- **WebSocket security**: Encrypted frame transmission over WebSocket protocol

### Key Flow
1. **Frontend** generates 256-bit AES key using `crypto.subtle.generateKey()`
2. **Key Registration** via POST to `/api/session` with Latin-1 encoded key string
3. **Backend** stores key in `SessionKeyRegistry` with ISO-8859-1 encoding
4. **Encryption** happens client-side before WebSocket transmission
5. **Decryption** happens server-side using registered session key
6. **Viewers** receive decrypted MJPEG stream via HTTP endpoint

### Technology Stack
- **Frontend**: React, CryptoJS, Web Crypto API, WebSocket
- **Backend**: Spring Boot 3.2.0, Java 17, WebSocket, Jakarta Servlet
- **Encryption**: AES-256-ECB with PKCS5/PKCS7 padding
- **Streaming**: MJPEG over HTTP, encrypted frames via WebSocket
- **Chat**: WebSocket-based real-time messaging with room support

### Known Limitations (Educational Project)
**This is a demonstration project for CIS 4634. NOT production-ready:**
- Keys transmitted over HTTP (needs HTTPS in production)
- No authentication on key retrieval endpoint
- ECB mode used for simplicity (CBC/GCM preferred in production)
- Session keys stored in memory only

**For production use, implement:**
- TLS/HTTPS for all communications
- Proper authentication and authorization
- Diffie-Hellman key exchange (X25519)
- AES-GCM mode for authenticated encryption
- Persistent key storage with access controls