# Secure Streaming Platform — CIS 4634 Final Project
This project is a secure streaming prototype built for **CIS 4634**. It demonstrates a **hybrid cryptographic architecture** combining:
- **React Frontend (Create React App)**
- **Java Spring Boot AES Key Server**
- **AES-256-GCM encryption/decryption via WebCrypto**

The core idea:
**The backend manages AES session keys. The browser encrypts and decrypts all sensitive data. The server never sees plaintext video/chat content.**

---

## Features

### Frontend (React + WebCrypto)
- Login screen  
- Host or Viewer selection  
- Create or join a Session ID  
- Request AES-256-GCM key from backend  
- Import AES key into WebCrypto  
- Encrypt outgoing messages locally  
- Decrypt incoming messages locally  
- Integrated event log for crypto/network steps  

### Backend (Spring Boot AES Key Server)
- Runs on **http://localhost:8084**
- Generates per-session AES keys and stores them in memory  
- REST endpoints (names may vary slightly):
  - `POST /api/session` — Host creates/loads AES key  
  - `POST /api/join` — Viewer loads same key  
- Keys returned as Base64 (`aesKeyB64`)
- Backend configuration (`application.properties`):
```properties
server.port=8084
spring.application.name=Secure_Stream
spring.websocket.messages.max-size=2097152
spring.websocket.buffer-size=2097152
```

---

## Project Structure

```
secure-streaming/
│
├── backend/                     # Spring Boot AES Key Server
│   ├── pom.xml
│   └── src/main/
│       ├── java/
│       │   ├── config/          # CORS / security
│       │   ├── controller/      # API endpoints
│       │   ├── edu/             # Main application entry point
│       │   ├── security/        # Security helpers (if used)
│       │   └── service/         # AES key/session service
│       └── resources/
│           └── application.properties
│
└── frontend/                    # React (Create React App)
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

## Running the Backend (Spring Boot on port 8084)
```powershell
cd backend
mvn clean spring-boot:run
```

Expected output:
```
:: Spring Boot :: (v3.x.x)
Tomcat started on port(s): 8084
```

Backend is now live at:
```
http://localhost:8084
```

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

## Frontend Configuration
Ensure `frontend/src/config.js` contains:
```js
export const API_BASE = "http://localhost:8084";
```

---

## Using the Application

### Host Flow
1. Open `http://localhost:3000`
2. Choose **Host**
3. Enter a Session ID
4. Click **Host: Get Key**
5. AES key loads and event log updates

### Viewer Flow
1. Open another browser window
2. Choose **Viewer**
3. Enter the **same Session ID**
4. Click **Join & Load Key**

Both clients share the same AES-256-GCM session key.

---

## Testing Backend Without Browser

### Create Host Session
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

---

## Troubleshooting

### `mvn` not recognized
Add Maven to PATH and restart PowerShell.

### Frontend cannot reach backend
Ensure:
- Backend is running  
- Correct port (8084)  
- `config.js` points to backend  

### Port collision
Close the app using port **3000** or **8084**, or update your port in the configuration.

---

## Summary
This system demonstrates:
- Secure, browser-side AES-256-GCM encryption  
- Spring Boot backend for AES key distribution  
- React frontend for client-side crypto  
- Backend never handles plaintext  
- Fully end-to-end encrypted communication for streaming/chat use cases