package controller;
import security.SessionKeyRegistry;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/session")
// FIX: Changed the allowed origin to http://localhost:3000 to resolve the CORS error 
// reported by the React frontend during key registration.
@CrossOrigin(origins = "http://localhost:3000") 
public class SessionController {

    private final SessionKeyRegistry keyRegistry;

    public SessionController(SessionKeyRegistry keyRegistry) {
        this.keyRegistry = keyRegistry;
    }

    @PostMapping
    public ResponseEntity<Void> createSession(@RequestBody SessionKeyRequest req) {
        keyRegistry.registerKey(req.getSessionId(), req.getAesKey());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{sessionId}/key")
    public ResponseEntity<SessionKeyResponse> getSessionKey(@PathVariable String sessionId) {
        var keySpec = keyRegistry.getKey(sessionId);
        if (keySpec == null) {
            return ResponseEntity.notFound().build();
        }
        // NOTE: Sending the raw key over a REST endpoint for a demo. In production, 
        // this must be protected (e.g., using TLS and authentication).
        try {
            String keyString = new String(keySpec.getEncoded(), "ISO-8859-1");
            return ResponseEntity.ok(new SessionKeyResponse(sessionId, keyString));
        } catch (java.io.UnsupportedEncodingException e) {
            return ResponseEntity.status(500).build();
        }
    }

    /** Data Transfer Object for session key registration requests */
    public static class SessionKeyRequest {
        private String sessionId;
        private String aesKey;

        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        public String getAesKey() { return aesKey; }
        public void setAesKey(String aesKey) { this.aesKey = aesKey; }
    }

    /** Data Transfer Object for session key retrieval responses */
    public static class SessionKeyResponse {
        private String sessionId;
        private String aesKey;
        public SessionKeyResponse(String sessionId, String aesKey) {
            this.sessionId = sessionId;
            this.aesKey = aesKey;
        }
        public String getSessionId() { return sessionId; }
        public String getAesKey() { return aesKey; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        public void setAesKey(String aesKey) { this.aesKey = aesKey; }
    }
}