# Secure Streaming Platform — CIS 4634 Final Project

This project is our secure streaming prototype for **CIS 4634-001**.  
It demonstrates a **hybrid cryptographic architecture** combining:

- **React Frontend (Create React App)**
- **Java Spring Boot AES Key Server**
- **AES-256-GCM encryption/decryption in the browser (WebCrypto)**
- **(Future) dedicated WebSocket relay** that only transports encrypted frames

The core idea:

**The backend manages session keys.  
The browser encrypts and decrypts all sensitive data.  
Any relay only sees ciphertext — never plaintext.**

---

## 🔐 Features

### Frontend (React + WebCrypto)

- Login screen  
- Host or Viewer selection  
- Create or join a Session ID  
- Fetch AES-256-GCM key from backend  
- Import AES key into WebCrypto API  
- Encrypt chat/stream metadata locally with AES-GCM  
- Send ciphertext to the backend/relay  
- Decrypt messages on the receiver side  
- Event log to visualize each step in the crypto pipeline  

### Backend (Java Spring Boot AES Key Server)

- Exposes REST endpoints for:
  - `POST /api/session` → Host creates or receives an AES session key  
  - `POST /api/join` → Viewer joins an existing session and receives the same key  
- Keys are stored per session (in memory) and returned as Base64 (`aesKeyB64`)  
- Designed so the backend never handles decrypted video/chat content — it only issues keys and receives ciphertext

> **Backend port:** The Spring Boot server is configured to run on  
> `http://localhost:8081` (see `backend/src/main/resources/application.properties`).

### Hybrid Crypto Architecture

- **AES-256-GCM** used for all symmetric encryption  
- **Java backend** manages session keys and exposes REST APIs  
- **Browser frontend** performs all encryption/decryption via **WebCrypto**  
- **WebSocket relay** (future C++/Node component) will forward only ciphertext  
- Goal: End-to-end confidentiality with minimum trusted surface

---

## 📁 Project Structure

```
secure-streaming/
│
├── backend/                     # Java Spring Boot AES key server
│   ├── pom.xml                  # Maven project descriptor
│   └── src/
│       └── main/
│           ├── java/
│           │   ├── config/      # Security / CORS / app config
│           │   ├── controller/  # REST controllers (session, join, etc.)
│           │   ├── edu/         # Project base package
│           │   ├── security/    # Security helpers
│           │   └── service/     # AES key + session management
│           └── resources/
│               └── application.properties  # Server + app configuration
│
└── frontend/                    # React client (Create React App)
    ├── public/
    │   ├── index.html
    │   └── icons / manifest, etc.
    ├── src/
    │   ├── App.js               # Root React component
    │   ├── AppStreamerViewer.jsx# Host/Viewer UI and flow
    │   ├── VideoStreamer.jsx    # Video + WebRTC/WebSocket plumbing
    │   ├── config.js            # API base URLs, constants, helpers
    │   └── index.js             # React entry point
    ├── package.json
    └── package-lock.json
```

---

## 🛠 Requirements

You will need:

- **Node.js + npm**
- **Java JDK 17+**  
  Example (Windows, via winget):

  ```powershell
  winget install --id Microsoft.OpenJDK.17 -e
  ```

- **Maven** (if not already installed)
- **Git**

---

## 🚀 Running the System

### 1️⃣ Start the Java AES Key Server (Backend)

Open a terminal in the **repo root** and run:

```bash
cd backend
mvn clean spring-boot:run
```

If the build succeeds, you should see logs similar to:

```text
Started SecureStreamingApplication in X.Y seconds
```

The backend will be available at:

```text
http://localhost:8081
```

(If the port is changed in `application.properties`, update it here and in `config.js`.)

Leave this terminal running.

---

### 2️⃣ Start the React Frontend (Create React App)

Open a **second** terminal in the repo root:

```bash
cd frontend
npm install      # only needed the first time
npm start
```

Create React App will open the frontend at:

```text
http://localhost:3000/
```

If it doesn’t auto-open, you can manually visit that URL in your browser.

Leave this running as well.

---

### 3️⃣ (Future Work) WebSocket Relay

Architecturally, the system is designed to support a dedicated WebSocket relay (Node.js or C++) that:

- Accepts **only encrypted frames / messages** from the frontend  
- Broadcasts ciphertext to viewers in the same session  
- Never sees decrypted content  

Once this relay is implemented and added to the repo, the typical command will look like:

```bash
node ws-relay.js
# or: ./ws-relay   (for a compiled C++ version)
```

At that point, the frontend’s WebSocket URL (configured in `config.js`) will point to:

```text
ws://localhost:<relay-port>/<path>
```

---

## 🧪 How to Use the App

### HOST FLOW

1. Open `http://localhost:3000/`  
2. Log in / identify yourself  
3. Select **Host (Streamer)**  
4. Enter a **Session ID** (e.g., `cis-demo-1`)  
5. Click **“Host: Get Key from Backend”**  
6. The frontend calls `POST /api/session` on the backend  
7. The AES-256-GCM key is returned, imported into WebCrypto, and logged in the event log (Base64 only, never plaintext key bytes)

Now the host is ready to send encrypted chat or stream metadata.

### VIEWER FLOW

1. Open a **second browser window** or a second machine  
2. Navigate to `http://localhost:3000/`  
3. Select **Viewer**  
4. Enter the **same Session ID** used by the host (e.g., `cis-demo-1`)  
5. Click **“Viewer: Join & Load Key”**  
6. The frontend calls `POST /api/join` on the backend  
7. Viewer receives the same AES key (Base64), imports it into WebCrypto, and logs the event

At this point, both Host and Viewer share the same AES-256-GCM key and can encrypt/decrypt messages.

### Encrypted Chat / Messages

- User types a message on Host or Viewer  
- Browser uses the shared AES-256-GCM key to **encrypt** the payload  
- Ciphertext (plus IV and auth tag) is sent to the backend/relay  
- The recipient uses the same key to **decrypt** the message locally  
- At no point does the backend/relay see the plaintext message

---

## 🧪 Optional: Test Backend API with PowerShell (No Browser)

These examples assume the backend is running on `http://localhost:8081`.

### Create or Get a Session Key (Host)

```powershell
Invoke-WebRequest -Uri "http://localhost:8081/api/session" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"sessionId":"demo"}'
```

### Join Session and Fetch Key (Viewer)

```powershell
Invoke-WebRequest -Uri "http://localhost:8081/api/join" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"sessionId":"demo"}'
```

Each response should include an `aesKeyB64` field representing the Base64-encoded AES key for that session.