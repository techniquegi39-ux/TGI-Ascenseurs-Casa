import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { AuthContext } from './auth-context.js'

async function findUserData(user) {
  const userDocument = await getDoc(doc(db, 'users', user.uid))

  if (userDocument.exists()) {
    return { ...userDocument.data(), id: userDocument.id }
  }

  const usersCollection = collection(db, 'users')
  const uidQuery = query(usersCollection, where('uid', '==', user.uid), limit(1))
  const uidResults = await getDocs(uidQuery)

  if (!uidResults.empty) {
    const userDocumentByUid = uidResults.docs[0]
    return { ...userDocumentByUid.data(), id: userDocumentByUid.id }
  }

  if (user.email) {
    const emailQuery = query(usersCollection, where('email', '==', user.email), limit(1))
    const emailResults = await getDocs(emailQuery)

    if (!emailResults.empty) {
      const userDocumentByEmail = emailResults.docs[0]
      return { ...userDocumentByEmail.data(), id: userDocumentByEmail.id }
    }
  }

  throw new Error('Profil utilisateur introuvable.')
}

function toError(error) {
  return error instanceof Error ? error : new Error(String(error))
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let isMounted = true
    let authChangeId = 0

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const currentChangeId = ++authChangeId

      if (!user) {
        setCurrentUser(null)
        setUserData(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setAuthError(null)

      try {
        const profile = await findUserData(user)

        if (!isMounted || currentChangeId !== authChangeId) {
          return
        }

        if (profile.active === false) {
          throw new Error('Compte désactivé')
        }

        setCurrentUser(user)
        setUserData(profile)
        setLoading(false)
      } catch (error) {
        if (!isMounted || currentChangeId !== authChangeId) {
          return
        }

        const profileError = toError(error)
        setCurrentUser(null)
        setUserData(null)
        setAuthError(profileError)

        try {
          await signOut(auth)
        } catch (signOutError) {
          const logoutError = toError(signOutError)
          setAuthError(
            new Error(`${profileError.message} (Échec de la déconnexion : ${logoutError.message})`),
          )
        } finally {
          if (isMounted && currentChangeId === authChangeId) {
            setLoading(false)
          }
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  async function login(email, password) {
    let authenticated = false

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      authenticated = true

      const profile = await findUserData(credential.user)
      if (profile.active === false) {
        throw new Error('Compte désactivé')
      }

      setAuthError(null)
      return credential.user
    } catch (error) {
      let loginError = toError(error)

      if (authenticated && auth.currentUser) {
        try {
          await signOut(auth)
        } catch (signOutError) {
          const logoutError = toError(signOutError)
          loginError = new Error(
            `${loginError.message} (Échec de la déconnexion : ${logoutError.message})`,
          )
        }
      }

      setAuthError(loginError)
      throw loginError
    }
  }

  async function logout() {
    await signOut(auth)
    setAuthError(null)
  }

  if (loading) {
    return (
      <main className="auth-loading-screen" role="status" aria-live="polite">
        <div className="auth-loading-card">
          <div className="auth-spinner" aria-hidden="true" />
          <p className="auth-loading-brand">TGI ASCENSEURS CASA</p>
          <p className="auth-loading-message">Vérification sécurisée de votre session...</p>
        </div>
      </main>
    )
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, userData, loading, authError, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}