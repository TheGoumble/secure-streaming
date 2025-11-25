package security;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AESUtil {

    private static final String ALGORITHM = "AES";
    private static final String ENCRYPTION_PREFIX = "AES_ENC_PREFIX::";

    // Pattern to match the prefix and the 8-character placeholder, capturing the Base64 data
    private static final Pattern ENCRYPTED_MESSAGE_PATTERN
            = Pattern.compile("^" + ENCRYPTION_PREFIX.replace("::", "::") + ".{8}::(.*)$");

    /**
     * Decrypts an encrypted message string using the provided AES key.
     * Assumes ECB mode with PKCS5/PKCS7 padding, matching the client-side encryption.
     * * @param encryptedMessage The message string starting with AES_ENC_PREFIX::...::Base64Data
     * @param secretKey The SecretKeySpec object retrieved from the registry
     * @return The decrypted raw byte array (JPEG frame data)
     * @throws Exception If decryption fails or message format is incorrect
     */
    public byte[] decrypt(String encryptedMessage, SecretKeySpec secretKey) throws Exception {
        if (!encryptedMessage.startsWith(ENCRYPTION_PREFIX)) {
            throw new IllegalArgumentException("Message missing AES encryption prefix.");
        }

        Matcher matcher = ENCRYPTED_MESSAGE_PATTERN.matcher(encryptedMessage);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Message format is corrupted or missing the key prefix.");
        }

        String base64Data = matcher.group(1);
        byte[] encryptedBytes = Base64.getDecoder().decode(base64Data);

        // AES/ECB/PKCS5Padding is equivalent to AES/ECB/PKCS7Padding used by the CryptoJS client
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey);

        return cipher.doFinal(encryptedBytes);
    }
}