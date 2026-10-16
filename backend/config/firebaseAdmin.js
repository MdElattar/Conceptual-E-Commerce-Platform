import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

const __dirname = path.resolve();

if (!admin.apps.length) {
  try {
    // التعديل هنا: شلنا كلمة backend من المسار عشان نضمن إنه يقرأ من الفولدر الحالي
    const keyPath = path.join(__dirname, 'config', 'serviceAccountKey.json');
    
    const serviceAccount = JSON.parse(readFileSync(keyPath));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("❌ Firebase Initialization Error:", error.message);
  }
}

export default admin;