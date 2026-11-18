"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { firebaseApp, firebaseEnabled } from "@/lib/firebase";

// Which books a person has read, with the day they ticked each one.
// Signed out: kept in this browser. Signed in: kept in their Firestore record
// (users/{uid}), and anything ticked before signing in is carried over once.

type ReadMap = Record<string, string>;
type User = { name: string; photo: string | null };
type Ctx = {
  read: ReadMap;
  ready: boolean;
  user: User | null;
  canSignIn: boolean;
  toggle: (id: string) => void;
  signIn: () => void;
  signOut: () => void;
  error: string | null;
};

const LOCAL = "books-read";
const ProgressContext = createContext<Ctx | null>(null);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const loadLocal = (): ReadMap => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL) ?? "{}") ?? {};
  } catch {
    return {};
  }
};
const saveLocal = (m: ReadMap) => {
  try {
    if (Object.keys(m).length) localStorage.setItem(LOCAL, JSON.stringify(m));
    else localStorage.removeItem(LOCAL);
  } catch {}
};

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [read, setRead] = useState<ReadMap>({});
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uid = useRef<string | null>(null);

  useEffect(() => {
    setRead(loadLocal());
    if (!firebaseEnabled) return setReady(true);

    let stopDoc: (() => void) | undefined;
    let stopAuth: (() => void) | undefined;
    (async () => {
      const app = firebaseApp()!;
      const { getAuth, onAuthStateChanged, getRedirectResult } = await import("firebase/auth");
      const { getFirestore, doc, onSnapshot, setDoc } = await import("firebase/firestore");
      const auth = getAuth(app);
      const db = getFirestore(app);
      getRedirectResult(auth).catch(() => {});
      stopAuth = onAuthStateChanged(auth, (u) => {
        stopDoc?.();
        uid.current = u?.uid ?? null;
        if (!u) {
          setUser(null);
          setRead(loadLocal());
          setReady(true);
          return;
        }
        setUser({ name: u.displayName ?? u.email ?? "You", photo: u.photoURL });
        const ref = doc(db, "users", u.uid);
        let first = true;
        stopDoc = onSnapshot(
          ref,
          (snap) => {
            const cloud: ReadMap = (snap.data()?.read as ReadMap) ?? {};
            if (first) {
              first = false;
              // Carry over ticks made before signing in.
              const local = loadLocal();
              const missing = Object.fromEntries(Object.entries(local).filter(([id]) => !(id in cloud)));
              if (Object.keys(missing).length) {
                setDoc(ref, { read: missing }, { merge: true }).then(() => saveLocal({}));
              } else saveLocal({});
              setRead({ ...cloud, ...missing });
            } else setRead(cloud);
            setReady(true);
          },
          () => {
            setError("Couldn’t load your list. Your ticks are safe; try again in a moment.");
            setReady(true);
          },
        );
      });
    })();
    return () => {
      stopDoc?.();
      stopAuth?.();
    };
  }, []);

  const toggle = useCallback((id: string) => {
    setRead((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = today();
      if (!uid.current) saveLocal(next);
      else {
        const was = prev[id];
        (async () => {
          const { getFirestore, doc, setDoc, updateDoc, deleteField, FieldPath } = await import("firebase/firestore");
          const ref = doc(getFirestore(firebaseApp()!), "users", uid.current!);
          try {
            if (was) await updateDoc(ref, new FieldPath("read", id), deleteField());
            else await setDoc(ref, { read: { [id]: next[id] } }, { merge: true });
            setError(null);
          } catch {
            setError("Couldn’t save that tick. Check your connection and try again.");
            setRead((cur) => {
              const undo = { ...cur };
              if (was) undo[id] = was;
              else delete undo[id];
              return undo;
            });
          }
        })();
      }
      return next;
    });
  }, []);

  const signIn = useCallback(async () => {
    const app = firebaseApp();
    if (!app) return;
    const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import("firebase/auth");
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") await signInWithRedirect(auth, provider);
      else if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") setError("Sign-in didn’t work. Please try again.");
    }
  }, []);

  const signOut = useCallback(async () => {
    const app = firebaseApp();
    if (!app) return;
    const { getAuth, signOut } = await import("firebase/auth");
    await signOut(getAuth(app));
  }, []);

  return (
    <ProgressContext.Provider value={{ read, ready, user, canSignIn: firebaseEnabled, toggle, signIn, signOut, error }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress outside ProgressProvider");
  return ctx;
}
