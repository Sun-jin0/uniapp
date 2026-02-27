
import CryptoJS from 'crypto-js';

// 必须与后端保持一致
const ENCRYPTION_KEY = 'ojld_video_secret_key_2024_999';

/**
 * 解密视频链接
 * @param {string} encryptedText 加密后的字符串 (format: iv:hex)
 * @returns {string} 原始链接
 */
export function decryptVideoUrl(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(':');
    const iv = CryptoJS.enc.Hex.parse(parts[0]);
    const encryptedData = CryptoJS.enc.Hex.parse(parts[1]);
    
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
    
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encryptedData },
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    const result = decrypted.toString(CryptoJS.enc.Utf8);
    return result || encryptedText;
  } catch (error) {
    console.error('Video decryption error:', error);
    return encryptedText;
  }
}

/**
 * 加密视频链接 (如果前端需要加密上传)
 * @param {string} text 
 * @returns {string}
 */
export function encryptVideoUrl(text) {
  if (!text) return text;
  try {
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
    const iv = CryptoJS.lib.WordArray.random(16);
    
    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return iv.toString(CryptoJS.enc.Hex) + ':' + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Video encryption error:', error);
    return text;
  }
}
