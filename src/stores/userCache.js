import { defineStore } from 'pinia'
import { ref } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'

// Global user cache to reduce Firebase reads
export const useUserCacheStore = defineStore('userCache', () => {
  const CACHE_KEY = 'vn_social_user_cache'
  const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours
  
  // Load from localStorage on init
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const now = Date.now()
        // Only load non-expired entries
        const validEntries = new Map()
        for (const [key, value] of Object.entries(parsed.data || {})) {
          if (value && value.timestamp && (now - value.timestamp < CACHE_EXPIRY)) {
            validEntries.set(key, value.data)
          }
        }
        return validEntries
      }
    } catch (error) {
      console.error('Error loading user cache from storage:', error)
    }
    return new Map()
  }
  
  // Save to localStorage
  const saveToStorage = () => {
    try {
      const data = {}
      const now = Date.now()
      userCache.value.forEach((value, key) => {
        if (value) { // Don't save null values
          data[key] = {
            data: value,
            timestamp: now
          }
        }
      })
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: now }))
    } catch (error) {
      console.error('Error saving user cache to storage:', error)
      // If quota exceeded, clear old entries
      try {
        localStorage.removeItem(CACHE_KEY)
      } catch (e) {
        // Ignore
      }
    }
  }
  
  const userCache = ref(loadFromStorage()) // Map<userId, userData>
  const loadingUsers = ref(new Set()) // Track users being loaded to avoid duplicate requests
  
  // Expose userCache for direct access (read-only)
  const getUserCache = () => userCache.value

  // Get user data from cache or Firebase
  const getUser = async (userId) => {
    if (!userId) return null

    // Return from cache if available
    if (userCache.value.has(userId)) {
      return userCache.value.get(userId)
    }

    // If already loading this user, wait a bit and check cache again
    if (loadingUsers.value.has(userId)) {
      // Wait up to 1 second for the other request to complete
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        if (userCache.value.has(userId)) {
          return userCache.value.get(userId)
        }
      }
      return null
    }

    // Load from Firebase
    loadingUsers.value.add(userId)
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() }
        userCache.value.set(userId, userData)
        // Save to localStorage (debounced)
        debouncedSave()
        return userData
      }
      // Don't cache null - let it try again next time
      return null
    } catch (error) {
      console.error('Error loading user:', userId, error)
      return null
    } finally {
      loadingUsers.value.delete(userId)
    }
  }

  // Batch get multiple users
  const getUsers = async (userIds) => {
    if (!userIds || userIds.length === 0) return []
    
    const uniqueIds = [...new Set(userIds)]
    const results = []
    const idsToLoad = []

    // Get from cache first
    for (const userId of uniqueIds) {
      if (userCache.value.has(userId)) {
        const cached = userCache.value.get(userId)
        if (cached) results.push(cached)
      } else {
        idsToLoad.push(userId)
      }
    }

    // Load missing users in parallel (but limit concurrent requests)
    if (idsToLoad.length > 0) {
      const batchSize = 10 // Load max 10 users at a time
      for (let i = 0; i < idsToLoad.length; i += batchSize) {
        const batch = idsToLoad.slice(i, i + batchSize)
        const batchResults = await Promise.all(
          batch.map(userId => getUser(userId))
        )
        results.push(...batchResults.filter(Boolean))
      }
    }

    return results
  }

  // Debounced save to localStorage
  let saveTimeout = null
  const debouncedSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      saveToStorage()
    }, 1000) // Save after 1 second of inactivity
  }

  // Update user in cache (when user data changes)
  const updateUser = (userId, userData) => {
    if (userId && userData) {
      userCache.value.set(userId, { id: userId, ...userData })
      debouncedSave()
    }
  }

  // Clear cache (useful for logout)
  const clearCache = () => {
    userCache.value.clear()
    loadingUsers.value.clear()
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch (error) {
      // Ignore
    }
  }

  // Preload user (useful for known users)
  const preloadUser = async (userId) => {
    if (!userId || userCache.value.has(userId)) return
    await getUser(userId)
  }

  return {
    userCache: userCache.value, // Expose for direct access
    getUser,
    getUsers,
    updateUser,
    clearCache,
    preloadUser,
    getUserCache
  }
})

