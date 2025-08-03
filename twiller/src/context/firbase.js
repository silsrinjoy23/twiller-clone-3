
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA6cfwfmIOlEcA4BWv-Ln_SKbp6HEtS_sU",
  authDomain: "twiller-457a6.firebaseapp.com",
  projectId: "twiller-457a6",
  storageBucket: "twiller-457a6.firebasestorage.app",
  messagingSenderId: "341658706580",
  appId: "1:341658706580:web:f4ba7ea2de658c626b8a81",
  measurementId: "G-261KS58K78"
};

const app = initializeApp(firebaseConfig);
export const auth=getAuth(app)
const user = auth.currentUser;
export default app
// const analytics = getAnalytics(app);

