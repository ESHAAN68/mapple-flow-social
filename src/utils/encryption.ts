import CryptoJS from 'crypto-js';

// Generate a unique encryption key for each user session
export const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
};

// Create a hash of the encryption key for storage
export const hashEncryptionKey = (key: string): string => {
  return CryptoJS.SHA256(key).toString();
};

// Encrypt a message
export const encryptMessage = (message: string, key: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(message, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Decrypt a message
export const decryptMessage = (encryptedMessage: string, key: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key);
    const originalMessage = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!originalMessage) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    return originalMessage;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};

// Store encryption key securely in session storage (cleared when browser closes)
export const storeEncryptionKey = (key: string): void => {
  sessionStorage.setItem('chat_encryption_key', key);
};

// Retrieve encryption key from session storage
export const getStoredEncryptionKey = (): string | null => {
  return sessionStorage.getItem('chat_encryption_key');
};

// Clear encryption key from storage
export const clearEncryptionKey = (): void => {
  sessionStorage.removeItem('chat_encryption_key');
};

// Generate and store a new encryption key for the user
export const initializeUserEncryption = (): string => {
  const key = generateEncryptionKey();
  storeEncryptionKey(key);
  return key;
};