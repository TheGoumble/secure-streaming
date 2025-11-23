package controller;

import security.AESUtil;
import service.StreamManager;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class VideoStreamHandler extends TextWebSocketHandler {

    private final StreamManager streamManager;
    private final AESUtil aesUtil; // Injected or instantiated

    public VideoStreamHandler(StreamManager streamManager) {
        this.streamManager = streamManager;
        this.aesUtil = new AESUtil(); 
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

        // Store the username in session attributes for later cleanup/tracking
        session.getAttributes().put("username", username); 
        System.out.println("New Stream Established: " + username + " (ID: " + session.getId() + ")");
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String username = (String) session.getAttributes().get("username");

        try {
            String encryptedFrameString = message.getPayload();
            
            // 1. Decrypt the frame using your custom AES utility
            byte[] decryptedFrameBytes = aesUtil.decrypt(encryptedFrameString);
            
            // 2. Update the latest frame in the manager for viewers
            streamManager.updateFrame(username, decryptedFrameBytes); 
            
            // System.out.printf("Received and Decrypted Frame (%d bytes) from %s%n", decryptedFrameBytes.length, username);

        } catch (Exception e) {
            System.err.println("Decryption failed for " + username + ": " + e.getMessage());
            try {
                session.close(CloseStatus.PROTOCOL_ERROR.withReason("Decryption Error"));
            } catch (IOException ignored) {}
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String username = (String) session.getAttributes().get("username");
        if (username != null) {
            streamManager.removeStream(username); // Remove the stream on disconnect
            System.out.println("Stream Stopped and Removed: " + username);
        }
    }
}