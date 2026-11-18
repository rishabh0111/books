// Firebase is optional: without its config the site runs with ticks saved in
// the browser only, and no sign-in button.
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

export function firebaseApp(): FirebaseApp | null {
  if (!firebaseEnabled) return null;
  return getApps()[0] ?? initializeApp(config);
}
