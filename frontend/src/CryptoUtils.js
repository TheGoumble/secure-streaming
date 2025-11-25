import CryptoJS from "crypto-js";
import { ENCRYPTION_PREFIX } from './config';

const KEY_CHUNK_PLACEHOLDER = "00000000::"; 

/**
 * Encrypts raw binary data (ArrayBuffer) of a JPEG frame using AES.
 * @param {ArrayBuffer} frameData The raw ArrayBuffer of the JPEG frame.
 * @param {string} aesKeyString The raw byte string of the dynamic AES key.
 * @returns {string} The fully prefixed and encrypted Base64 string.
 */
export const encryptFrame = (frameData, aesKeyString) => {
    // 1. Convert ArrayBuffer to a Uint8Array
    const frameDataArray = new Uint8Array(frameData); 

    // 2. Convert native Uint8Array to a CryptoJS WordArray (required for encryption)
    const wordArray = CryptoJS.lib.WordArray.create(frameDataArray);

    // 3. Parse the key using Latin1 encoding (ISO-8859-1)
    // This matches the Java backend's ISO-8859-1 encoding
    const key = CryptoJS.enc.Latin1.parse(aesKeyString);
    
    console.log('Encrypting with key length:', key.sigBytes, 'bytes');

    // 4. Encrypt the WordArray using ECB mode and PKCS7 padding 
    const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    });

    // 5. Extract the Base64 ciphertext string
    const base64Ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

    // 6. Assemble the final message string with the required prefix and placeholder
    const finalMessage = ENCRYPTION_PREFIX + KEY_CHUNK_PLACEHOLDER + base64Ciphertext;
    
    return finalMessage;
};