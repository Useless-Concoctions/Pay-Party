
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, signInWithEmailLink, sendSignInLinkToEmail, isSignInWithEmailLink, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from 'firebase/firestore';

const STORAGE_KEY = 'payperiod_data_v1';
const EMAIL_KEY = 'payparty_email_for_signin';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let auth = null;
let db = null;

export const DB = {
    isCloudConfigured() {
        return true; // Always configured now
    },

    init() {
        try {
            app = initializeApp(firebaseConfig);
        } catch (e) {
            if (e.code === 'app/duplicate-app') {
                app = getApp();
            }
        }
        auth = getAuth(app);
        db = getFirestore(app);
    },

    // Auth Methods
    async login(email) {
        if (!auth) throw new Error('Cloud not configured');

        const actionCodeSettings = {
            url: window.location.href,
            handleCodeInApp: true,
        };

        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        localStorage.setItem(EMAIL_KEY, email);
        return true;
    },

    async completeSignIn() {
        if (!auth) return null;

        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = localStorage.getItem(EMAIL_KEY);
            if (!email) {
                email = window.prompt('Please enter your email to confirm sign-in:');
            }
            if (email) {
                const result = await signInWithEmailLink(auth, email, window.location.href);
                localStorage.removeItem(EMAIL_KEY);
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
                return result.user;
            }
        }
        return null;
    },

    getSession() {
        return new Promise((resolve) => {
            if (!auth) { resolve(null); return; }
            onAuthStateChanged(auth, (user) => {
                resolve(user);
            });
        });
    },

    async logout() {
        if (auth) {
            await signOut(auth);
        }
    },

    // Data Methods
    async getAll() {
        if (this.isCloudConfigured() && db && auth?.currentUser) {
            const q = query(
                collection(db, 'pay_periods'),
                where('user_id', '==', auth.currentUser.uid),
                orderBy('date', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        }
    },

    async add(item) {
        if (this.isCloudConfigured() && db && auth?.currentUser) {
            const { id, ...payload } = item;
            payload.user_id = auth.currentUser.uid;
            payload.created_at = serverTimestamp();

            const docRef = await addDoc(collection(db, 'pay_periods'), payload);
            return { id: docRef.id, ...payload };
        } else {
            const data = await this.getAll();
            item.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
            data.push(item);
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return item;
        }
    },

    async importFromLocal() {
        if (!this.isCloudConfigured() || !db || !auth?.currentUser) throw new Error('Cloud not ready');

        const localStr = localStorage.getItem(STORAGE_KEY);
        if (!localStr) return 0;

        const localData = JSON.parse(localStr);
        if (!Array.isArray(localData) || localData.length === 0) return 0;

        const userId = auth.currentUser.uid;
        let count = 0;

        for (const item of localData) {
            const { id, ...rest } = item;
            rest.user_id = userId;
            rest.created_at = serverTimestamp();
            await addDoc(collection(db, 'pay_periods'), rest);
            count++;
        }

        return count;
    },

    async seed() {
        if (!this.isCloudConfigured()) {
            const data = [
                { id: '1', date: '2024-01-15', gross: 2000, net: 1550, hours: 40, otHours: 0, company: 'Acme Corp', role: 'Junior Dev' },
                { id: '2', date: '2024-01-30', gross: 2000, net: 1550, hours: 40, otHours: 0, company: 'Acme Corp', role: 'Junior Dev' },
                { id: '3', date: '2024-02-15', gross: 2000, net: 1550, hours: 40, otHours: 0, company: 'Acme Corp', role: 'Junior Dev' },
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    }
};

DB.init();
