import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVpBBjMCSD-0xRMyUocKD7lS-fFA-a870",
  authDomain: "news-eff0b.firebaseapp.com",
  projectId: "news-eff0b",
  storageBucket: "news-eff0b.firebasestorage.app",
  messagingSenderId: "395035180615",
  appId: "1:395035180615:web:043cdea9835c1d0f2efb62",
  measurementId: "G-QHKR92B7JT"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app