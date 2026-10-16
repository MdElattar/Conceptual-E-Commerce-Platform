import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

const __dirname = path.resolve();

// فحص إذا كان الـ App شغال فعلاً قبل ما ننشئه تاني
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      readFileSync(path.join(__dirname, 'backend/config/serviceAccountKey.json'))
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error.message);
  }
}

export default admin;