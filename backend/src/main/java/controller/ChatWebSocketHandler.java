package controller;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple chat WebSocket handler.
 * All clients with the same roomId share messages.
 * URL format: ws://localhost:8080/chat?roomId=alice&username=bob
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    // roomId -> set of sessions
    private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        if (uri == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Missing URI"));
            return;
        }

        String query = uri.getQuery();
        if (query == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Missing query params"));
            return;
        }

        var params = UriComponentsBuilder.fromUriString("?" + query)
                .build()
                .getQueryParams();

        String roomId = params.getFirst("roomId");
        String username = params.getFirst("username");

        if (roomId == null || roomId.isBlank() || username == null || username.isBlank()) {
            session.close(CloseStatus.BAD_DATA.withReason("roomId and username required"));
            return;
        }

        session.getAttributes().put("roomId", roomId);
        session.getAttributes().put("username", username);

        rooms.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);

        System.out.printf("Chat connected: %s in room %s%n", username, roomId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String roomId = (String) session.getAttributes().get("roomId");
        String username = (String) session.getAttributes().get("username");

        if (roomId == null || username == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Missing room/user attributes"));
            return;
        }

        // For simplicity we just broadcast the raw JSON string to others in the same room.
        String payload = message.getPayload();

        broadcastToRoom(roomId, payload);
    }

    private void broadcastToRoom(String roomId, String payload) {
        Set<WebSocketSession> sessions = rooms.get(roomId);
        if (sessions == null) return;

        for (WebSocketSession s : sessions) {
            if (s.isOpen()) {
                try {
                    s.sendMessage(new TextMessage(payload));
                } catch (IOException e) {
                    System.err.println("Failed to send chat message: " + e.getMessage());
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String roomId = (String) session.getAttributes().get("roomId");
        String username = (String) session.getAttributes().get("username");

        if (roomId != null) {
            Set<WebSocketSession> sessions = rooms.get(roomId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    rooms.remove(roomId);
                }
            }
        }

        System.out.printf("Chat disconnected: %s from room %s%n", username, roomId);
    }
}