import React, { useRef, useEffect, useCallback, useState } from 'react';
import { WS_BASE_URL } from './config';


// Derive the WebSocket URL from the base HTTP URL
const WEBSOCKET_URL = WS_BASE_URL;
const FRAME_RATE_MS = 200; // 5 frames per second

// Placeholder key for AES. IN PRODUCTION, THIS MUST BE EXCHANGED SECURELY!
const AES_KEY = "0123456789abcdef0123456789abcdef"; 

// --- ENCRYPTION SIMULATION ---
const encryptFrame = (frameData) => {
    // 1. Convert ArrayBuffer to Base64 string
    const base64Data = btoa(String.fromCharCode.apply(null, new Uint8Array(frameData)));
    
    // 2. Simulate AES encryption by adding a custom header/prefix
    const encryptedData = `AES_ENC_PREFIX::${base64Data}`;
    
    return encryptedData;
};

// --- REACT COMPONENT ---
const VideoStreamer = ({ username }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const intervalRef = useRef(null);
    const [status, setStatus] = useState('Initializing...');

    // 1. Send Frame Logic (Memoized)
    const sendFrame = useCallback(() => {
        const ws = wsRef.current;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!ws || ws.readyState !== WebSocket.OPEN || !video || !canvas) {
            return;
        }

        const context = canvas.getContext('2d');
        
        if (canvas.width === 0 && video.videoWidth > 0) {
             canvas.width = video.videoWidth;
             canvas.height = video.videoHeight;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
            if (!blob) return;

            const reader = new FileReader();
            reader.onload = () => {
                const frameData = reader.result; // ArrayBuffer of the JPEG data
                
                const encryptedFrame = encryptFrame(frameData);
                ws.send(encryptedFrame);
            };
            reader.readAsArrayBuffer(blob);
            
        }, 'image/jpeg', 0.5); // Reduced quality (0.5) to avoid error 1009
    }, []);


    // 2. Start Stream and WebSocket Connection
    const startStream = useCallback(async (user) => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoRef.current.srcObject = mediaStream;
            
            videoRef.current.onloadedmetadata = () => {
                setStatus('Camera active. Connecting...');
                
                wsRef.current = new WebSocket(`${WEBSOCKET_URL}/stream?username=${user}`);

                wsRef.current.onopen = () => {
                    setStatus(`Streaming successfully started for ${user}.`);
                    intervalRef.current = setInterval(sendFrame, FRAME_RATE_MS);
                };

                wsRef.current.onerror = (error) => {
                    setStatus('WebSocket Error. Check backend console.');
                    console.error("WebSocket error:", error);
                    stopStream();
                };

                wsRef.current.onclose = () => {
                    setStatus('Stream disconnected.');
                    stopStream();
                };
            };
        } catch (err) {
            setStatus(`Error accessing camera: ${err.message}`);
            console.error("Error accessing camera: ", err);
        }
    }, [sendFrame]);
    
    // 3. Stop Stream Logic
    const stopStream = useCallback(() => {
        setStatus('Stream stopped.');
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

    // Effect to start stream when component mounts and stop when unmounts
    useEffect(() => {
        if (username) {
            startStream(username);
        }
        return () => stopStream();
    }, [username, startStream, stopStream]);


    // 4. Render UI
    return (
        <div style={{ marginTop: '20px' }}>
            <p><strong>Status:</strong> {status}</p>
            
            {/* Display local feed for streamer (muted) */}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                style={{ width: '400px', height: '300px', border: '1px solid gray' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default VideoStreamer;