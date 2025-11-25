package service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.Arrays;

/**
 * Manages the latest decrypted video frame for each active stream.
 * This is the bridge between the WebSocket (Host) and the REST endpoint (Viewer).
 */
@Service
public class StreamManager {

    private final Map<String, byte[]> activeStreams = new ConcurrentHashMap<>();

    /**
     * Registers a stream as active (called when WebSocket connects).
     * @param username The ID of the stream.
     */
    public void registerStream(String username) {
        activeStreams.put(username, new byte[0]);
        System.out.println("Stream registered: " + username);
    }

    /**
     * Updates the latest frame for a given username.
     * @param username The ID of the stream.
     * @param frameBytes The raw decrypted JPEG byte array.
     */
    public void updateFrame(String username, byte[] frameBytes) {
        // Note: Creating a copy of the array is good practice if the source array 
        // could be modified elsewhere, but for a one-time copy from WS handler, it's fine.
        activeStreams.put(username, frameBytes);
    }

    /**
     * Gets the latest frame for a given username.
     * @param username The ID of the stream.
     * @return The latest JPEG byte array, or null if stream is inactive.
     */
    public byte[] getLatestFrame(String username) {
        return activeStreams.get(username);
    }

    /**
     * Removes an active stream.
     * @param username The ID of the stream to remove.
     */
    public void removeStream(String username) {
        activeStreams.remove(username);
    }

    /**
     * Checks if a stream is currently active.
     * @param username The ID of the stream.
     * @return true if streaming, false otherwise.
     */
    public boolean isStreaming(String username) {
        return activeStreams.containsKey(username);
    }
}