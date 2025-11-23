import React, { useState } from 'react';
import VideoStreamer from './VideoStreamer'; 
import { HTTP_BASE_URL } from './config';

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
    }

    const handleBack = () => {
        setRole(null);
        setTargetStreamer('');
    }
    
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
            <h2>Viewer Mode: Watching as **{username}**</h2>
            <input
                type="text"
                placeholder="Enter Streamer's Username (e.g., Alice)"
                value={targetStreamer}
                onChange={(e) => setTargetStreamer(e.target.value)}
                style={{ padding: '8px', marginBottom: '15px' }}
            />
            <button 
                onClick={() => setTargetStreamer(targetStreamer.trim())}
                disabled={!targetStreamer}
                style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}
            >
                Join Stream
            </button>

            {targetStreamer && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Live Feed: **{targetStreamer}** (Decrypted by Server)</h3>
                    {/* The browser handles the MJPEG stream from the server */}
                    <img 
                        src={`${HTTP_BASE_URL}/view/${targetStreamer}`} 
                        alt={`Live Stream from ${targetStreamer}`}
                        style={{ width: '640px', height: '480px', border: '2px solid #007bff' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/640x480?text=Stream+Offline'; }}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div style={{ padding: '40px', fontFamily: 'Arial' }}>
            <h1>🔐 Custom AES Video Stream</h1>
            <hr />
            
            {role && (
                <button onClick={handleBack} style={{ marginBottom: '20px', padding: '10px' }}>
                    ← Change Role
                </button>
            )}

            {role === null && renderRoleSelection()}
            
            {role === 'streamer' && (
                <div>
                    <h2>Streamer Mode: **{username}**</h2>
                    <p>Camera feed is running through **your custom AES encryption** layer.</p>
                    <VideoStreamer username={username} />
                </div>
            )}

            {role === 'viewer' && renderViewerMode()}

        </div>
    );
};

// Example App.js usage:
// function App() { return <AppStreamerViewer />; }
// export default App;

export default AppStreamerViewer;