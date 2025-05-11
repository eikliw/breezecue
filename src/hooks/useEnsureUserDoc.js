import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Adjusted path based on our setup

/**
 * Custom hook to ensure a user document exists in Firestore.
 * On authentication state change, if a user is logged in and their document
 * doesn't exist in the 'users' collection, it creates one with
 * email, homeRegion (initially null), and createdAt timestamp.
 */
const useEnsureUserDoc = () => {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          try {
            await setDoc(userDocRef, {
              email: user.email,
              homeRegion: null,
              createdAt: serverTimestamp(),
            });
            console.log('User document created for UID:', user.uid);
          } catch (error) {
            console.error('Error creating user document:', error);
          }
        }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount
};

export default useEnsureUserDoc; 