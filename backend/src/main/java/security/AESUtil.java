package security;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class AESUtil {

    private static final String ALGORITHM = "AES";
    // NOTE: This must match the key used in the React client's placeholder
    private static final String PLACEHOLDER_KEY = "0123456789abcdef0123456789abcdef"; 
    private static final String ENCRYPTION_PREFIX = "AES_ENC_PREFIX::";

    private final SecretKeySpec secretKey;

    public AESUtil() {
        this.secretKey = new SecretKeySpec(PLACEHOLDER_KEY.getBytes(), ALGORITHM);
    }

    /**
     * Decrypts the frame data received from the client.
     */
    public byte[] decrypt(String encryptedMessage) throws Exception {
        if (!encryptedMessage.startsWith(ENCRYPTION_PREFIX)) {
             throw new IllegalArgumentException("Message missing AES encryption prefix.");
        }
        
        String base64Data = encryptedMessage.substring(ENCRYPTION_PREFIX.length());

        // 1. Decode the Base64 string into raw encrypted bytes
        byte[] encryptedBytes = Base64.getDecoder().decode(base64Data);

        // --- REPLACE THE NEXT LINE WITH YOUR ACTUAL AES DECRYPTION ---
        // Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding"); 
        // cipher.init(Cipher.DECRYPT_MODE, secretKey);
        // byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
        // return decryptedBytes; 
        
        // TEMPORARY: Return the decoded bytes for the proof-of-concept
        return encryptedBytes; 
    }
}