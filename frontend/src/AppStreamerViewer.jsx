// src/AppStreamerViewer.jsx
import React, { useState } from 'react';
import VideoStreamer from './VideoStreamer'; 
import ChatContainer from './ChatContainer';
import { HTTP_BASE_URL } from './config';
import "./AppLayout.css";

const AppStreamerViewer = () => {
    const [role, setRole] = useState(null); 
    const [username, setUsername] = useState('');
    const [targetStreamer, setTargetStreamer] = useState('');

    // --- VIEW / ROLE CHANGE HANDLERS ---
    const handleRoleSelect = (selectedRole) => {
        if (!username) {
            alert("Please enter a username first.");
            return;
        }
        setRole(selectedRole);
    };

    const handleBack = () => {
        setRole(null);
        setTargetStreamer('');
    };
    
    // --- RENDER FUNCTIONS ---
    const renderRoleSelection = () => (
        <div className="role-selection">
            <h2>1. Enter Your Identity</h2>
            <input
                type="text"
                placeholder="Enter Your Unique Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ padding: '8px', marginBottom: '20px' }}
            />
            
            <h2>2. Select Your Role</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
                <button
                    onClick={() => handleRoleSelect('streamer')}
                    disabled={!username}
                    style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    Be a Streamer 🎥
                </button>
                <button
                    onClick={() => handleRoleSelect('viewer')}
                    disabled={!username}
                    style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    Be a Viewer 📺
                </button>
            </div>
        </div>
    );

    const renderViewerMode = () => (
        <div className="viewer-mode">
            <h2>Viewer Mode: {username}</h2>
            <input
                type="text"
                placeholder="Enter Streamer's Username (e.g., Alice)"
                value={targetStreamer}
                onChange={(e) => setTargetStreamer(e.target.value.trim())}
                style={{ padding: '8px', marginBottom: '15px' }}
            />
            <button 
                onClick={() => {/* Join is automatic via input change */}}
                disabled={!targetStreamer}
                style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}
            >
                Join Stream
            </button>

            {targetStreamer && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Live Feed: {targetStreamer}</h3>
                    <p style={{ fontSize: '0.9em', color: '#666' }}>
                        Stream URL: {`${HTTP_BASE_URL}/view/${targetStreamer}`}
                    </p>
                    {/* The browser handles the MJPEG stream from the server */}
                    <img 
                        src={`${HTTP_BASE_URL}/view/${targetStreamer}`} 
                        alt={`Live Stream from ${targetStreamer}`}
                        style={{ width: '640px', height: '480px', border: '2px solid #007bff', backgroundColor: '#000' }}
                        onError={(e) => { 
                            console.error('Stream load failed for:', targetStreamer);
                            e.target.onerror = null; 
                            e.target.style.backgroundColor = '#333';
                            e.target.alt = 'Stream Offline - Check if streamer is broadcasting';
                        }}
                    />
                </div>
            )}
        </div>
    );

    // Determine chat roomId:
    // - For streamer: they are the room owner, so roomId = their username.
    // - For viewer: they join the stream named by targetStreamer.
    const resolvedRoomId = role === 'streamer'
        ? username || null
        : role === 'viewer'
            ? (targetStreamer || null)
            : null;

    return (
        <div className="app-shell">
            {/* Header */}
            <header className="app-topbar">
                <div className="topbar-left">
                    <div className="app-title">Secure Streaming Platform</div>
                    <div className="app-subtitle">CIS 4634 – Final Project</div>
                </div>

                <div className="topbar-right">
                    {role && (
                        <button onClick={handleBack} className="role-btn active">
                            ← Change Role
                        </button>
                    )}
                </div>
            </header>

            {/* No role yet */}
            {!role && (
                <div className="control-panel">
                    {renderRoleSelection()}
                </div>
            )}

            {/* STREAMER MODE */}
            {role === 'streamer' && (
                <div className="main-layout">
                    <div className="video-column">
                        <div>
                            <h2>Streamer Mode: {username}</h2>
                            <p>Camera feed is running through your custom AES encryption layer.</p>
                            <VideoStreamer username={username} />
                        </div>
                    </div>

                    <div className="chat-column">
                        {resolvedRoomId ? (
                            <ChatContainer roomId={resolvedRoomId} username={username} />
                        ) : (
                            <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                                Enter a valid username to join chat.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEWER MODE */}
            {role === 'viewer' && (
                <div className="main-layout">
                    <div className="video-column">
                        {renderViewerMode()}
                    </div>

                    <div className="chat-column">
                        {resolvedRoomId ? (
                            <ChatContainer roomId={resolvedRoomId} username={username} />
                        ) : (
                            <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                                Enter the streamer username and click "Join Stream" to connect chat.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppStreamerViewer;