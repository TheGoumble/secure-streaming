import React, { useRef, useEffect, useCallback, useState } from 'react';
import { WS_BASE_URL, HTTP_BASE_URL  } from './config';
import { encryptFrame } from './CryptoUtils';

const FRAME_RATE_MS = 200; // 5 frames per second

// --- REACT COMPONENT ---
const VideoStreamer = ({ username }) => {
     const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const intervalRef = useRef(null);
    const aesKeyRef = useRef(null); // Use ref for immediate access
    const [status, setStatus] = useState('Initializing...');
    const [isStreaming, setIsStreaming] = useState(false);
    // New state to hold the dynamically generated key string (for display)
    const [aesKey, setAesKey] = useState(null); 

    // --- KEY MANAGEMENT FUNCTIONS ---

    // Generates a new 256-bit AES key and registers it with the backend
    const generateAndRegisterKey = useCallback(async (sessionId) => {
        setStatus('Generating and registering AES key...');
        
        try {
            // Use the browser's native Web Crypto API
            const key = await window.crypto.subtle.generateKey(
                { name: "AES-CBC", length: 256 }, 
                true, // exportable
                ["encrypt", "decrypt"]
            );

            // Export the key as raw bytes (ArrayBuffer)
            const rawKey = await window.crypto.subtle.exportKey("raw", key);
            
            // Convert ArrayBuffer to a Latin-1 string for Java compatibility
            const keyArray = new Uint8Array(rawKey);
            let keyString = '';
            for (let i = 0; i < keyArray.length; i++) {
                keyString += String.fromCharCode(keyArray[i]);
            }
            
            console.log('Generated key length:', keyString.length, 'bytes');

            // 1. Register the key with the backend
            const backendUrl = `${HTTP_BASE_URL}/api/session`;
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    aesKey: keyString // Send the raw byte string
                })
            });

            if (response.ok) {
                setStatus('Key registered successfully. Ready to stream.');
                aesKeyRef.current = keyString; // Store in ref for immediate access
                setAesKey(keyString); // Store the key string in state for display
                return keyString;
            } else {
                const error = await response.text();
                throw new Error(`Failed to register key: ${error}`);
            }
        } catch (e) {
            setStatus(`Key Error: ${e.message}`);
            throw e;
        }
    }, []);


    // 1. Send Frame Logic (Memoized)
    const sendFrame = useCallback(() => {
        const ws = wsRef.current;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const key = aesKeyRef.current;

        if (!ws || ws.readyState !== WebSocket.OPEN || !video || !canvas || !key) {
            console.warn('Cannot send frame:', { 
                wsOpen: ws?.readyState === WebSocket.OPEN, 
                videoReady: !!video, 
                canvasReady: !!canvas, 
                keyPresent: !!key 
            });
            return; // Guard: Only send if key is present
        }

        const context = canvas.getContext('2d');

        if (canvas.width === 0 && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log('Canvas initialized:', canvas.width, 'x', canvas.height);
        }

        if (canvas.width === 0) {
            console.warn('Canvas width is 0, video not ready yet');
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Failed to create blob from canvas');
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const frameData = reader.result; // ArrayBuffer of the JPEG data

                // --- REAL ENCRYPTION STEP ---
                try {
                    // PASS THE DYNAMIC KEY TO THE ENCRYPTION UTILITY
                    const encryptedFrame = encryptFrame(frameData, key);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(encryptedFrame);
                        console.log('Frame sent, size:', encryptedFrame.length);
                    }
                } catch (e) {
                    console.error("Encryption failed:", e);
                }
            };
            reader.onerror = (e) => {
                console.error("FileReader error:", e);
            };
            reader.readAsArrayBuffer(blob);

        }, 'image/jpeg', 0.5); // Reduced quality (0.5) to avoid error 1009
    }, []); // No dependencies needed - uses refs


    // 2. Start Stream and WebSocket Connection
    const startStream = useCallback(async (user) => {
        if (isStreaming) return; // Prevent double starting
        
        try {
            // STEP 1: GENERATE AND REGISTER KEY
            const keyString = await generateAndRegisterKey(user);
            console.log('Key generated and registered, length:', keyString.length);

            // STEP 2: START MEDIA STREAM
            setStatus('Accessing camera...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoRef.current.srcObject = mediaStream;

            videoRef.current.onloadedmetadata = () => {
                setStatus('Camera active. Connecting WebSocket...');

                // STEP 3: ESTABLISH WS CONNECTION
                const wsUrl = `${WS_BASE_URL}/stream?username=${user}`;
                console.log('Connecting to WebSocket:', wsUrl);
                wsRef.current = new WebSocket(wsUrl);

                wsRef.current.onopen = () => {
                    console.log('WebSocket connected successfully for:', user);
                    console.log('AES key available in ref:', !!aesKeyRef.current);
                    setStatus(`Streaming successfully started for ${user}.`);
                    setIsStreaming(true); 
                    // STEP 4: START SENDING ENCRYPTED FRAMES
                    intervalRef.current = setInterval(sendFrame, FRAME_RATE_MS);
                };

                wsRef.current.onerror = (error) => {
                    console.error('WebSocket error for', user, ':', error);
                    setStatus('WebSocket Error. Check backend console.');
                    stopStream();
                };

                wsRef.current.onclose = (event) => {
                    console.log('WebSocket closed for', user, 'Code:', event.code, 'Reason:', event.reason);
                    setStatus('Stream disconnected.');
                    setIsStreaming(false);
                };
            };
        } catch (err) {
            setStatus(`Error: ${err.message}`);
            console.error("Critical error during setup: ", err);
            setIsStreaming(false);
            // Cleanup media stream if it started before the error
            const stream = videoRef.current?.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
    }, [isStreaming, generateAndRegisterKey, sendFrame]);

    // 3. Stop Stream Logic
    const stopStream = useCallback(() => {
        setStatus('Stream stopped.');
        setIsStreaming(false); 
        aesKeyRef.current = null; // Clear the key ref
        setAesKey(null); // Clear the key state
        
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
        }
        wsRef.current = null;

        const stream = videoRef.current?.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }, []);

    // Effect to handle cleanup when the component unmounts
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            const stream = videoRef.current?.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);
    // 4. Render UI
    return (
        <div style={{ marginTop: '20px' }}>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Username:</strong> {username}</p>
            {isStreaming && <p style={{ color: 'green' }}><strong>🔴 LIVE</strong></p>}

            {/* Display local feed for streamer (muted) */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '400px', height: '300px', border: '1px solid gray' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {isStreaming ? (
                <button
                    onClick={stopStream}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150 shadow-md"
                >
                    Stop Streaming
                </button>
            ) : (
                <button
                    onClick={() => startStream(username)}
                    className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150 shadow-md"
                >
                    Start Streaming
                </button>
            )}
        </div>
    );
};

export default VideoStreamer;