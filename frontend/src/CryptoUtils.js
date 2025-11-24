import CryptoJS from "crypto-js";
import {AES_KEY, ENCRYPTION_PREFIX } from './config';

const KEY_CHUNK_PLACEHOLDER = "00000000::"; 

/**
 * Encrypts raw binary data (ArrayBuffer) of a JPEG frame using AES.
 * The result is formatted as a prefixed Base64 string for the Java backend.
 * * @param {ArrayBuffer} frameData The raw ArrayBuffer of the JPEG frame.
 * @returns {string} The fully prefixed and encrypted Base64 string.
 */
export const encryptFrame = (frameData) => {
    // 1. Convert ArrayBuffer to a Uint8Array
    const frameDataArray = new Uint8Array(frameData); 

    // 2. Convert native Uint8Array to a CryptoJS WordArray (required for encryption)
    const wordArray = CryptoJS.lib.WordArray.create(frameDataArray);

    // 3. Parse the key
    const key = CryptoJS.enc.Utf8.parse(AES_KEY);

    // 4. Encrypt the WordArray using ECB mode and PKCS7 padding 
    //    (which matches the Java PKCS5Padding)
    const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
        // IV is not required for ECB mode
    });

    // 5. Extract the Base64 ciphertext string
    // The result 'encrypted' is a CipherParams object; we need its ciphertext property.
    const base64Ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

    // 6. Assemble the final message string with the required prefix and placeholder
    const finalMessage = ENCRYPTION_PREFIX + KEY_CHUNK_PLACEHOLDER + base64Ciphertext;
    
    return finalMessage;
};