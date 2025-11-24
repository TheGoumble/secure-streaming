// The base URL for your Spring Boot server
export const BACKEND_HOST = "localhost";
export const BACKEND_PORT = "8080";

// HTTP URL for the Viewer's MJPEG stream (e.g., http://localhost:8080)
export const HTTP_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

// WebSocket URL for the Streamer's connection (e.g., ws://localhost:8080)
export const WS_BASE_URL = `ws://${BACKEND_HOST}:${BACKEND_PORT}`;

// change later for secret exchange
export const AES_KEY = "0123456789abcdef0123456789abcdef";
export const ENCRYPTION_PREFIX = "AES_ENC_PREFIX::";