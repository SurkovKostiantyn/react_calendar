import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Перевірка змінних середовища
const requiredEnvVars = {
    apiKey: 'REACT_APP_FIREBASE_API_KEY',
    authDomain: 'REACT_APP_FIREBASE_AUTH_DOMAIN',
    databaseURL: 'REACT_APP_FIREBASE_DATABASE_URL',
    projectId: 'REACT_APP_FIREBASE_PROJECT_ID',
    storageBucket: 'REACT_APP_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'REACT_APP_FIREBASE_APP_ID'
};

const missingVars = [];
for (const envVar of Object.values(requiredEnvVars)) {
    if (!process.env[envVar]) {
        missingVars.push(envVar);
    }
}

if (missingVars.length > 0) {
    const errorMessage = `Помилка конфігурації Firebase: відсутні змінні середовища:\n${missingVars.join('\n')}\n\nПереконайтеся, що файл .env існує та містить всі необхідні змінні.\nПерегляньте .env.example для прикладу.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
}

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
