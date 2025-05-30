import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDt3kepZQrZHlRxUj2EKNR-Te5cRpX_1JY",
  authDomain: "budgetme-a930a.firebaseapp.com",
  projectId: "budgetme-a930a",
  storageBucket: "budgetme-a930a.firebasestorage.app",
  messagingSenderId: "402965197869",
  appId: "1:402965197869:web:6121c6d01cc62de0ba74a4"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Funzioni di autenticazione
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

// Funzioni Firestore
export const saveTransaction = async (userId, transaction) => {
  const ref = doc(db, `users/${userId}/transactions/${transaction.id}`);
  await setDoc(ref, transaction);
};

export const getTransactions = async (userId) => {
  const q = collection(db, `users/${userId}/transactions`);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const deleteTransaction = async (userId, transactionId) => {
  const ref = doc(db, `users/${userId}/transactions/${transactionId}`);
  await deleteDoc(ref);
};

export const saveAccount = async (userId, account) => {
  const ref = doc(db, `users/${userId}/accounts/${account.id}`);
  await setDoc(ref, account);
};

export const getAccounts = async (userId) => {
  const q = collection(db, `users/${userId}/accounts`);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const deleteAccount = async (userId, accountId) => {
  const ref = doc(db, `users/${userId}/accounts/${accountId}`);
  await deleteDoc(ref);
};

export const saveCategories = async (userId, categories) => {
  const ref = doc(db, `users/${userId}/settings/categories`);
  await setDoc(ref, { categories });
};

export const getCategories = async (userId) => {
  const snapshot = await getDocs(collection(db, `users/${userId}/settings`));
  const docSnap = snapshot.docs.find(doc => doc.id === 'categories');
  return docSnap ? docSnap.data().categories : [];
};

export { auth, db }; 