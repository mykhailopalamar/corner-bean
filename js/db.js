// Firebase setup. Firebase is loaded lazily, only when firebase-config.js is filled in,
// so the site and the admin page work without any network libraries in local mode.
import { firebaseConfig } from "../firebase-config.js";

export const isConfigured =
  typeof firebaseConfig.apiKey === "string" &&
  firebaseConfig.apiKey.length > 0 &&
  !firebaseConfig.apiKey.startsWith("PASTE");

const BASE = "https://www.gstatic.com/firebasejs/10.14.1/";
let cached = null;

// Resolves to { db, auth, fs, authMod }: fs is the Firestore module, authMod the Auth module.
export function loadFirebase() {
  if (!isConfigured) {
    return Promise.reject(new Error("Firebase is not configured"));
  }
  if (!cached) {
    cached = (async () => {
      const [appMod, fs, authMod] = await Promise.all([
        import(BASE + "firebase-app.js"),
        import(BASE + "firebase-firestore.js"),
        import(BASE + "firebase-auth.js"),
      ]);
      const app = appMod.initializeApp(firebaseConfig);
      return { db: fs.getFirestore(app), auth: authMod.getAuth(app), fs, authMod };
    })();
    cached.catch(() => {
      cached = null; // allow a retry after a network error
    });
  }
  return cached;
}
