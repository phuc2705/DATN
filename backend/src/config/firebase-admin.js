// Firebase Admin SDK - xác thực Firebase ID token từ client (OAuth login)
const admin = require('firebase-admin');

let _initialized = false;
let _initError = null;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    try {
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
    console.warn(`[Firebase Admin] Thiếu ${missing.join(', ')} trong .env — Google login dùng fallback decode (chỉ an toàn cho dev local).`);
  }
}

admin._initialized = _initialized;
admin._initError = _initError;

module.exports = admin;
