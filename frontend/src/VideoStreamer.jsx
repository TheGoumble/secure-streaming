import React, { useRef, useEffect, useCallback, useState } from 'react';
import { WS_BASE_URL } from './config';
import { encryptFrame } from './CryptoUtils';


// Derive the WebSocket URL from the base HTTP URL
const WEBSOCKET_URL = WS_BASE_URL;
const FRAME_RATE_MS = 200; // 5 frames per second

// --- REACT COMPONENT ---
const VideoStreamer = ({ username }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const intervalRef = useRef(null);
    const [status, setStatus] = useState('Initializing...');
    const [isStreaming, setIsStreaming] = useState(false);

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

                // --- REAL ENCRYPTION STEP ---
                try {
                    const encryptedFrame = encryptFrame(frameData); // <-- Using imported function
                    ws.send(encryptedFrame);
                } catch (e) {
                    console.error("Encryption failed:", e);
                    // Optionally close the connection or skip the frame
                }
            };
            reader.readAsArrayBuffer(blob);

        }, 'image/jpeg', 0.5); // Reduced quality (0.5) to avoid error 1009
    }, []);


    // 2. Start Stream and WebSocket Connection
    const startStream = useCallback(async (user) => {
        if (isStreaming) return; // Prevent double starting

        setStatus('Accessing camera...');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoRef.current.srcObject = mediaStream;

            videoRef.current.onloadedmetadata = () => {
                setStatus('Camera active. Connecting...');

                wsRef.current = new WebSocket(`${WEBSOCKET_URL}/stream?username=${user}`);

                wsRef.current.onopen = () => {
                    setStatus(`Streaming successfully started for ${user}.`);
                    setIsStreaming(true); 
                    intervalRef.current = setInterval(sendFrame, FRAME_RATE_MS);
                };

                wsRef.current.onerror = (error) => {
                    setStatus('WebSocket Error. Check backend console.');
                    console.error("WebSocket error:", error);
                    stopStream();
                };

                wsRef.current.onclose = () => {
                    setStatus('Stream disconnected.');
                    setIsStreaming(false);
                };

            };
        } catch (err) {
            setStatus(`Error accessing camera: ${err.message}`);
            console.error("Error accessing camera: ", err);
            setIsStreaming(false);
        }
    }, [sendFrame, isStreaming]);

    // 3. Stop Stream Logic
     const stopStream = useCallback(() => {
        setStatus('Stream stopped.');
        setIsStreaming(false); // Set streaming status to false
        
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
        return () => stopStream();
    }, [stopStream]);


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