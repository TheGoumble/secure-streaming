package security;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AESUtil {

    private static final String ALGORITHM = "AES";
    // NOTE: This MUST match the key used in React (AES_KEY in ./config)
    private static final String PLACEHOLDER_KEY = "0123456789abcdef0123456789abcdef"; 
    private static final String ENCRYPTION_PREFIX = "AES_ENC_PREFIX::";

    // Pattern to match the full header and capture the pure Base64 payload
    private static final Pattern ENCRYPTED_MESSAGE_PATTERN = 
        Pattern.compile("^" + ENCRYPTION_PREFIX.replace("::", "::") + ".{8}::(.*)$");

    private final SecretKeySpec secretKey;

    public AESUtil() {
        this.secretKey = new SecretKeySpec(PLACEHOLDER_KEY.getBytes(), ALGORITHM);
    }

    /**
     * Decrypts an AES-encrypted, Base64-encoded frame string.
     * This method performs the actual AES decryption using PKCS5Padding.
     * @param encryptedMessage The message string prefixed with ENCRYPTION_PREFIX and key chunk.
     * @return The raw decrypted image bytes.
     * @throws Exception If message parsing or decryption fails.
     */
    public byte[] decrypt(String encryptedMessage) throws Exception {
        if (!encryptedMessage.startsWith(ENCRYPTION_PREFIX)) {
            throw new IllegalArgumentException("Message missing AES encryption prefix.");
        }
        
        Matcher matcher = ENCRYPTED_MESSAGE_PATTERN.matcher(encryptedMessage);
        
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Message format is corrupted or missing the key prefix.");
        }
        
        // Extract the pure Base64 data (Group 1 is the payload/ciphertext)
        String base64Data = matcher.group(1);

        // 1. Decode the Base64 string into raw bytes (the ciphertext)
        byte[] encryptedBytes = Base64.getDecoder().decode(base64Data);

        // 2. Perform REAL AES Decryption
        // The PKCS5Padding (compatible with client's PKCS7) will be automatically removed.
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding"); 
        
        cipher.init(Cipher.DECRYPT_MODE, secretKey);
        
        // This call will now succeed because the client guarantees the input array length 
        // is a multiple of 16 bytes.
        byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
        
        return decryptedBytes; 
    }
}