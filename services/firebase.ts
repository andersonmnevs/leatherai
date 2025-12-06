import { initializeApp } from "firebase/app";
import { getAuth } from "@firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Configuração usando variáveis de ambiente do .env.local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);

// Inicialização Robusta do Firestore
// Usamos initializeFirestore em vez de getFirestore para forçar configurações que evitam travamentos
export const db = initializeFirestore(app, {
  // Força o uso de Long Polling em vez de WebSockets. 
  // Isso resolve problemas de timeout em muitas redes corporativas ou ambientes de teste.
  experimentalForceLongPolling: true,
});

// Log para depuração
console.log("Firebase Modular Services Initialized (Long Polling Mode)");