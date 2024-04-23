import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, Timestamp } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";  // Only if you're using analytics
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid'; // Optional: For generating unique file names

async function uploadImageToFirebaseStorage(file) {
  try {
    const uniqueId = uuidv4(); // Generate a unique ID for the file name or use another method
    const storageRef = storageRef(storage, `images/${uniqueId}`);
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded a blob or file!', snapshot);

    // Get the URL of the uploaded file
    const url = await getDownloadURL(snapshot.ref);
    console.log('File available at', url);

    // Optionally save the URL in Firestore
    return url; // Return the URL to use it later, for example, saving it in Firestore
  } catch (error) {
    console.error('Upload failed', error);
    throw error; // Throw error so it can be handled by caller
  }
}

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
const storage = getStorage(app);

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

const handleFileUpload = async (event) => {
    const file = event.target.files[0]; // Get the file from a file input
    if (!file) return;
  
    try {
      const imageUrl = await uploadImageToFirebaseStorage(file);
      // Now you can save this URL in Firestore or use it in your app
      sendDataToFirestore('images', { url: imageUrl, description: 'Example image' });
    } catch (error) {
      console.error('Failed to upload image and save to Firestore', error);
    }
  }


function getCanvasBlob(canvas) {
return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
        if (blob) {
            resolve(blob);
        } else {
            reject(new Error('Canvas to Blob conversion failed'));
        }
    }, 'image/png');
});
}

 export async function uploadCanvasImage(canvas) {
    try {
        const blob = await getCanvasBlob(canvas);

        const uniqueId = new Date().getTime(); // Example of generating a unique file name
        const imageRef = storageRef(storage, `webgl-images/${uniqueId}.png`);

        const snapshot = await uploadBytes(imageRef, blob);
        console.log('Uploaded a blob or file!', snapshot);

        // Get the URL of the uploaded file
        const url = await getDownloadURL(snapshot.ref);
        console.log('File available at', url);

        return url; // You can return the URL to use it further (e.g., store in Firestore or display in UI)
    } catch (error) {
        console.error('Failed to upload canvas image', error);
        throw error;
    }
}

export async function uploadDataWithImage(canvas, collectionPath, data) {
    try {
      // Convert the canvas to a blob
      const blob = await getCanvasBlob(canvas);
      const uniqueId = uuidv4(); // Generate a unique ID for the file name
      const imageRef = storageRef(storage, `webgl-images/${uniqueId}.png`);
  
      // Upload the blob to Firebase Storage
      const snapshot = await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(snapshot.ref); // Get the URL of the uploaded file
  
      // Include the image URL in the data to be stored
      const completeData = { ...data, imageUrl, timestamp: new Date()};
  
      // Save the data with image URL to Firestore
      const docRef = doc(collection(db, collectionPath));
      await setDoc(docRef, completeData);
      console.log("Document written with ID: ", docRef.id, "and image URL: ", imageUrl);
      return { docId: docRef.id, imageUrl }; // Return document ID and image URL for further use
    } catch (error) {
      console.error('Failed to upload image and save data', error);
      throw error;
    }
  }