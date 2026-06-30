// Reemplaza estos valores con la configuracion Web App de Firebase.
// Firebase Console > Project settings > Your apps > Web app.
export const firebaseConfig = {
  apiKey: "AIzaSyCAj0biqGog7eKuslS4Ek9B9NKY426hR0I",
  authDomain: "caloria-e0e98.firebaseapp.com",
  projectId: "caloria-e0e98",
  storageBucket: "caloria-e0e98.firebasestorage.app",
  messagingSenderId: "607446224794",
  appId: "1:607446224794:web:6cc1b648de3536658db423",
  measurementId: "G-VQYBR30G7S",
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}
