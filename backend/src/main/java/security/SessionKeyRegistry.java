package security;

import org.springframework.stereotype.Service;
import javax.crypto.spec.SecretKeySpec;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Stores the AES SecretKeySpec for each active session (streamer).
 * The key is registered via the REST API before streaming starts.
 */
@Service
public class SessionKeyRegistry {

    private static final String ALGO = "AES";
    private final ConcurrentHashMap<String, SecretKeySpec> keys = new ConcurrentHashMap<>();

    /**
     * Registers a new key from the raw byte string provided by the client.
     * @param sessionId The ID of the session (username).
     * @param aesKeyString The raw byte string of the AES key.
     */
    public void registerKey(String sessionId, String aesKeyString) {
        try {
            SecretKeySpec spec = new SecretKeySpec(aesKeyString.getBytes("ISO-8859-1"), ALGO);
            keys.put(sessionId, spec);
            System.out.println("Registered key for session: " + sessionId);
        } catch (java.io.UnsupportedEncodingException e) {
            throw new RuntimeException("Failed to encode AES key", e);
        }
    }

    /**
     * Retrieves the SecretKeySpec for a given session ID.
     * @param sessionId The ID of the session (username).
     * @return The SecretKeySpec or null if not found.
     */
    public SecretKeySpec getKey(String sessionId) {
        return keys.get(sessionId);
    }
}