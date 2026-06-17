// Firebase Admin SDK - xác thực Firebase ID token từ client (OAuth login)
const admin = require('firebase-admin');
const crypto = require('crypto');

let _initialized = false;
let _initError = null;

if (!admin.apps.length) {
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey      = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && rawKey) {
    try {
      // Normalize key qua crypto để tránh lỗi error:1E08010C trên OpenSSL 3 (Node 18+/Render)
      let privateKey = rawKey;
      try {
        const keyObj = crypto.createPrivateKey({ key: rawKey, format: 'pem' });
        privateKey = keyObj.export({ type: 'pkcs8', format: 'pem' });
      } catch (_) {
        // Nếu normalize thất bại thì dùng key gốc
      }

      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      _initialized = true;
    } catch (err) {
      _initError = err;
      console.warn('[Firebase Admin] Khởi tạo thất bại:', err.message);
    }
  } else {
    const missing = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'].filter(k => !process.env[k]);
    console.warn(`[Firebase Admin] Thiếu ${missing.join(', ')} trong .env`);
  }
}

admin._initialized = _initialized;
admin._initError   = _initError;

module.exports = admin;
