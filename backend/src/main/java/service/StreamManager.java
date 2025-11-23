package service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class StreamManager {

    // Key: Username, Value: The byte array of the latest decrypted JPEG frame
    private final Map<String, byte[]> activeStreams = new ConcurrentHashMap<>();

    public void updateFrame(String username, byte[] frameBytes) {
        activeStreams.put(username, frameBytes);
    }

    public byte[] getLatestFrame(String username) {
        return activeStreams.get(username);
    }

    public void removeStream(String username) {
        activeStreams.remove(username);
    }

    public boolean isStreaming(String username) {
        return activeStreams.containsKey(username);
    }
}