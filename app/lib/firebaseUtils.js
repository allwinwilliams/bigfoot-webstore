import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";  // Only if you're using analytics

const firebaseConfig = {
    apiKey: "AIzaSyCUCy7_Cn-lPI5pdgTQs6TB4BhMNy8lOeo",
    authDomain: "bigfoot-dd040.firebaseapp.com",
    projectId: "bigfoot-dd040",
    storageBucket: "bigfoot-dd040.appspot.com",
    messagingSenderId: "473863351164",
    appId: "1:473863351164:web:2ae2290e0e3d39d62612f9",
    measurementId: "G-K5D111SR04"
  };
  
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

  export async function sendDataToFirestore(collectionPath, data) {
    try {
      // Create a new document with an auto-generated ID
      const docRef = doc(collection(db, collectionPath));
      await setDoc(docRef, data);
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
}