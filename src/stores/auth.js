import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(false)
  const authReady = ref(false) // Track if auth state has been initialized
  let authInitPromise = null // Store the promise to avoid multiple initializations

  const isAuthenticated = computed(() => !!user.value)

  // Initialize auth state listener and wait for initial state
  const initAuth = () => {
    // Return existing promise if already initializing
    if (authInitPromise) {
      return authInitPromise
    }
    
    // If already ready, return resolved promise
    if (authReady.value) {
      return Promise.resolve()
    }
    
    authInitPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        user.value = firebaseUser
        if (firebaseUser) {
          await loadUserProfile(firebaseUser.uid)
        } else {
          userProfile.value = null
        }
        
        // Mark auth as ready after first state change
        if (!authReady.value) {
          authReady.value = true
          resolve()
        }
      })
    })
    
    return authInitPromise
  }

  // Initialize auth on store creation (non-blocking)
  initAuth()

  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        userProfile.value = { id: userDoc.id, ...userDoc.data() }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const login = async (email, password) => {
    loading.value = true
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const register = async (email, password, displayName, username) => {
    loading.value = true
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        username,
        avatar: '',
        bio: '',
        createdAt: new Date().toISOString(),
        followers: [],
        following: [],
        friends: [],
        friendRequests: [],
        sentRequests: []
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateProfile = async (updates) => {
    if (!user.value) {
      return { success: false, error: 'Chưa đăng nhập' }
    }

    loading.value = true
    try {
      const userRef = doc(db, 'users', user.value.uid)
      await setDoc(userRef, updates, { merge: true })
      
      // Reload user profile
      await loadUserProfile(user.value.uid)
      
      return { success: true }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    userProfile,
    loading,
    authReady,
    isAuthenticated,
    initAuth,
    login,
    register,
    logout,
    updateProfile,
    loadUserProfile
  }
})

