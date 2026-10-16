import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCw8LNNaziS3FssPrPvJ3Sq7nkwCs-gUD4",
  authDomain: "ahmed-66b8e.firebaseapp.com",
  projectId: "ahmed-66b8e",
  storageBucket: "ahmed-66b8e.firebasestorage.app",
  messagingSenderId: "941132699481",
  appId: "1:941132699481:web:bfa6e140b5aa4997de9e48",
  measurementId: "G-YQHH8JDXV7"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// دالة لطلب التصريح وتوليد التوكن 🔑
export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BD2lkfp9DqSLB-z7aUglPw1fYYUQZpMWg4hwcjZ2lOju08b4z_WlaQ3d-jDwK_dBkncusYWUhDvJlKuE-P1da7g" // جيبه من Firebase Console -> Messaging -> Web Push certificate
      });
      return token;
    }
  } catch (error) {
    console.error("Error getting token:", error);
  }
};

// دالة لاستقبال الرسالة والموقع مفتوح (Foreground)
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });