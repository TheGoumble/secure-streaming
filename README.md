# Secure Streaming Platform — CIS 4634 Final Project

This project is a secure streaming prototype for **CIS 4634**.  
It demonstrates a **hybrid cryptographic architecture** combining:

- **React Frontend (Create React App)**
- **Java Spring Boot AES Key Server**
- **AES-256-GCM encryption/decryption in the browser (WebCrypto)**

The core idea:

**The backend manages AES session keys.  
The browser encrypts and decrypts all sensitive data.  
The server never processes plaintext video or chat messages.**

---

# Features

## Frontend (React + WebCrypto)

- Login screen  
- Host or Viewer role selection  
- Create or join a Session ID  
- Fetch AES-256-GCM key from backend  
- Import AES key into WebCrypto  
- Encrypt messages locally before sending  
- Decrypt messages locally when receiving  
- Event log showing each crypto step  

## Backend (Java Spring Boot AES Key Server)

- Runs at: **http://localhost:8084**
- Manages per-session AES-256-GCM keys
- Exposes REST endpoints:
  - `POST /api/session` → Create or fetch session key (Host)
  - `POST /api/join` → Retrieve existing session key (Viewer)
- Returns keys in Base64 (`aesKeyB64`)
- Stores keys in memory only
- No plaintext video/chat content ever touches the backend

### Backend configuration (`application.properties`):

```
server.port=8084
spring.application.name=Secure_Stream
spring.websocket.messages.max-size=2097152
spring.websocket.buffer-size=2097152
```

---

# Project Structure

```
secure-streaming/
│
├── backend/                     # Spring Boot AES Key Server
│   ├── pom.xml
│   └── src/main/
│       ├── java/
│       │   ├── config/
│       │   ├── controller/      # /api/session, /api/join
│       │   ├── security/
│       │   └── service/         # AES key generation + storage
│       └── resources/
│           └── application.properties
│
└── frontend/                    # React + WebCrypto client
    ├── public/
    ├── src/
    │   ├── App.js
    │   ├── AppStreamerViewer.jsx
    │   ├── VideoStreamer.jsx
    │   ├── config.js            # Backend URL
    │   └── index.js
    ├── package.json
    └── package-lock.json
```

---

# Requirements

You will need:

- **Node.js + npm**
- **Java JDK 17+**
- **Maven**
- **Git**

Example JDK install (Windows):

```powershell
winget install --id Microsoft.OpenJDK.17 -e
```

Example Maven install:

```powershell
winget install Maven
```

---

# Running the Project

## 1️⃣ Start the Java Backend (Spring Boot)

Open a terminal:

```powershell
cd secure-streaming/backend
mvn clean spring-boot:run
```

Expected output:

```
Started Secure_Stream in X seconds
Tomcat started on port(s): 8084 (http)
```

Backend is now running at:

```
http://localhost:8084
```

Leave this terminal open.

---

## 2️⃣ Start the React Frontend

Open a new terminal:

```powershell
cd secure-streaming/frontend
npm install     # first time only
npm start
```

Frontend will open at:

```
http://localhost:3000/
```

Leave this running too.

---

# Frontend Config Update (Important)

Make sure your React app points to the correct backend port  
(**8084**, not 8081 or 8080).

Inside:

```
frontend/src/config.js
```

Set:

```js
export const API_BASE = "http://localhost:8084";
```

If using a WebSocket path, update that too:

```js
export const WS_BASE = "ws://localhost:8084";
```

---

# Using the App

## HOST FLOW

1. Open **http://localhost:3000/**
2. Select **Host (Streamer)**
3. Enter a **Session ID** (e.g., `cis-demo-1`)
4. Click **“Host: Get Key from Backend”**
5. The backend generates or returns an AES-256-GCM session key (Base64)
6. Key is imported into WebCrypto and shown in the log

## VIEWER FLOW

1. Open **a second browser window**
2. Select **Viewer**
3. Enter the **same Session ID**
4. Click **“Viewer: Join & Load Key”**
5. Viewer receives the same AES key and loads it into WebCrypto

Now both clients share the same session key.

## Sending Messages

- User types a message
- Browser encrypts text via AES-GCM
- Ciphertext is sent
- Receiver decrypts with the shared key
- Backend never sees plaintext

---

# Optional: Test Backend API (No Browser)

### Host Creates/Fetches Session Key

```powershell
Invoke-WebRequest -Uri "http://localhost:8084/api/session" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"sessionId":"demo"}'
```

### Viewer Joins Session

```powershell
Invoke-WebRequest -Uri "http://localhost:8084/api/join" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"sessionId":"demo"}'
```