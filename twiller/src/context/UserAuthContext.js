import { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import { auth } from "./firbase";
import { sendPasswordResetEmail } from "firebase/auth";

 const userAuthContext = createContext();

export function UserAuthContextProvider( props ) {
    const [user, setUser] = useState({});

    function logIn(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }
function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

    function logOut() {
        return signOut(auth);
    }
    function googleSignIn() {
        const googleAuthProvider = new GoogleAuthProvider();
        return signInWithPopup(auth, googleAuthProvider);
    }
    // forgot pass
function forgotPassword(email) {
  const actionCodeSettings = {
    url: "http://localhost:3000/reset-password", // or your domain
    handleCodeInApp: false, // important: false for web redirect
  };

  return sendPasswordResetEmail(auth, email, actionCodeSettings);
}


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentuser) => {
            console.log("Auth", currentuser);
            setUser(currentuser);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <userAuthContext.Provider
            value={{ user, logIn, signUp, logOut, googleSignIn,forgotPassword }}
        >
            {props.children}
        </userAuthContext.Provider>
    );
}
// export default UserAuthContextProvider
export function useUserAuth() {
    return useContext(userAuthContext);
}