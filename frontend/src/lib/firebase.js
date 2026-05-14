// Firebase SDK is lazy-loaded on first use (not at app startup).
//
// The SDK is ~300 KB gzipped; loading it eagerly delayed first paint by
// ~300 ms on cold caches. Now it only downloads when a user actually
// clicks "Sign in with Google" or "Sign up with Google".
//
//     import { getFirebaseAuth } from '@/lib/firebase';
//     const { auth, googleProvider, signInWithPopup } = await getFirebaseAuth();
//     const result = await signInWithPopup(auth, googleProvider);

let _cache = null;

export async function getFirebaseAuth() {
    if (_cache) return _cache;

    const [{ initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup }] =
        await Promise.all([
            import('firebase/app'),
            import('firebase/auth'),
        ]);

    const app = initializeApp({
        apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    });

    _cache = {
        auth: getAuth(app),
        googleProvider: new GoogleAuthProvider(),
        signInWithPopup,
    };
    return _cache;
}
