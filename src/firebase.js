import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyC3YmnjKGFdntCB5a9BK6DCX7QhS4l0WPo',
  authDomain: 'tgi-ascenseurs-casa.firebaseapp.com',
  projectId: 'tgi-ascenseurs-casa',
  storageBucket: 'tgi-ascenseurs-casa.firebasestorage.app',
  messagingSenderId: '73651191706',
  appId: '1:73651191706:web:6c193bace84cae9ef4c423',
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)