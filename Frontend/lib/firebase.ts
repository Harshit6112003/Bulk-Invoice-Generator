// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAHBlo1HW9BIJl9mmP52Lik482GxSUuhYo",
  authDomain: "bulk-invoice-generator-87bfc.firebaseapp.com",
  projectId: "bulk-invoice-generator-87bfc",
  storageBucket: "bulk-invoice-generator-87bfc.firebasestorage.app",
  messagingSenderId: "519972907520",
  appId: "1:519972907520:web:d7202247b74cc8bd6606e5",
  measurementId: "G-X8R8JEPM0S"
};


const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, googleProvider, facebookProvider };