package controller;

import security.AESUtil;
import service.StreamManager;
import security.SessionKeyRegistry; 
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.spec.SecretKeySpec; 
import java.io.IOException;

@Component
public class VideoStreamHandler extends TextWebSocketHandler {

    private final StreamManager streamManager;
    private final AESUtil aesUtil; 
    private final SessionKeyRegistry keyRegistry; 

    // Constructor: Takes dependencies via Spring injection
    public VideoStreamHandler(StreamManager streamManager, AESUtil aesUtil, SessionKeyRegistry keyRegistry) {
        this.streamManager = streamManager;
        this.aesUtil = aesUtil; 
        this.keyRegistry = keyRegistry; 
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String query = session.getUri().getQuery();
        String username = UriComponentsBuilder.fromUriString("?" + query)
                .build()
                .getQueryParams()
                .getFirst("username");
        
        if (username == null || username.trim().isEmpty()) {
            session.close(CloseStatus.BAD_DATA.withReason("Username required."));
            return;
        }

        // Store the username (which serves as the sessionId/key)
        session.getAttributes().put("username", username); 
        
        // Register the stream immediately so viewers can connect
        streamManager.registerStream(username);
        
        System.out.println("New Stream Established: " + username + " (ID: " + session.getId() + ")");
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // The 'username' is the sessionId used to register the key
        String sessionIdFromWs = (String) session.getAttributes().get("username");

        if (sessionIdFromWs == null) {
             System.err.println("Decryption failed: Missing session ID (username) in attributes.");
            try { session.close(CloseStatus.PROTOCOL_ERROR.withReason("Missing Session ID")); } catch (IOException ignored) {}
            return;
        }

        // 1. Get the session-specific key
        SecretKeySpec keyForSession = keyRegistry.getKey(sessionIdFromWs); 
        
        if (keyForSession == null) {
            System.err.println("Decryption failed: No key found for session ID: " + sessionIdFromWs);
            try { session.close(CloseStatus.PROTOCOL_ERROR.withReason("Missing Encryption Key")); } catch (IOException ignored) {}
            return;
        }

        try {
            String encryptedFrameString = message.getPayload();
            
            // 2. Decrypt the frame using the session-specific key
            byte[] decryptedFrameBytes = aesUtil.decrypt(encryptedFrameString, keyForSession); 
            
            // 3. Update the latest frame in the manager for viewers
            streamManager.updateFrame(sessionIdFromWs, decryptedFrameBytes); 
            
            // System.out.printf("Received and Decrypted Frame (%d bytes) from %s%n", decryptedFrameBytes.length, sessionIdFromWs);

        } catch (Exception e) {
            System.err.println("Decryption failed for " + sessionIdFromWs + ": " + e.getMessage());
            try {
                session.close(CloseStatus.PROTOCOL_ERROR.withReason("Decryption Error"));
            } catch (IOException ignored) {}
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String username = (String) session.getAttributes().get("username");
        if (username != null) {
            streamManager.removeStream(username); 
            System.out.println("Stream Stopped and Removed: " + username);
        }
    }
}