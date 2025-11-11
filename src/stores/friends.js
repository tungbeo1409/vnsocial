import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useNotificationsStore } from './notifications'

export const useFriendsStore = defineStore('friends', () => {
  const friendRequests = ref([])
  const friends = ref([])
  const loading = ref(false)

  // Search users by username or displayName
  const searchUsers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return []
    
    loading.value = true
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef)
      const snapshot = await getDocs(q)
      
      const users = []
      const term = searchTerm.toLowerCase()
      
      snapshot.forEach((doc) => {
        const userData = doc.data()
        const username = (userData.username || '').toLowerCase()
        const displayName = (userData.displayName || '').toLowerCase()
        
        if (username.includes(term) || displayName.includes(term)) {
          users.push({
            id: doc.id,
            ...userData
          })
        }
      })
      
      return users
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  // Get user by ID
  const getUserById = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() }
      }
      return null
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  }

  // Send friend request
  const sendFriendRequest = async (fromUserId, toUserId) => {
    try {
      // Get sender info for notification
      const senderDoc = await getDoc(doc(db, 'users', fromUserId))
      const senderData = senderDoc.exists() ? senderDoc.data() : {}

      // Add to sender's sentRequests
      const senderRef = doc(db, 'users', fromUserId)
      await updateDoc(senderRef, {
        sentRequests: arrayUnion(toUserId)
      })

      // Add to receiver's friendRequests
      const receiverRef = doc(db, 'users', toUserId)
      await updateDoc(receiverRef, {
        friendRequests: arrayUnion(fromUserId)
      })

      // Create notification
      const notificationsStore = useNotificationsStore()
      await notificationsStore.createNotification(toUserId, 'friend_request', {
        fromUserId,
        fromUserName: senderData.displayName || 'Người dùng',
        fromUserAvatar: senderData.avatar || ''
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Accept friend request
  const acceptFriendRequest = async (currentUserId, friendId) => {
    try {
      // Get current user info for notification
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId))
      const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {}

      // Remove from current user's friendRequests
      const currentUserRef = doc(db, 'users', currentUserId)
      await updateDoc(currentUserRef, {
        friendRequests: arrayRemove(friendId),
        friends: arrayUnion(friendId)
      })

      // Remove from friend's sentRequests and add to friends
      const friendRef = doc(db, 'users', friendId)
      await updateDoc(friendRef, {
        sentRequests: arrayRemove(currentUserId),
        friends: arrayUnion(currentUserId)
      })

      // Create notification for the friend who sent the request
      const notificationsStore = useNotificationsStore()
      await notificationsStore.createNotification(friendId, 'friend_accepted', {
        fromUserId: currentUserId,
        fromUserName: currentUserData.displayName || 'Người dùng',
        fromUserAvatar: currentUserData.avatar || ''
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Reject friend request
  const rejectFriendRequest = async (currentUserId, friendId) => {
    try {
      // Remove from current user's friendRequests
      const currentUserRef = doc(db, 'users', currentUserId)
      await updateDoc(currentUserRef, {
        friendRequests: arrayRemove(friendId)
      })

      // Remove from friend's sentRequests
      const friendRef = doc(db, 'users', friendId)
      await updateDoc(friendRef, {
        sentRequests: arrayRemove(currentUserId)
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Remove friend
  const removeFriend = async (currentUserId, friendId) => {
    try {
      // Remove from current user's friends
      const currentUserRef = doc(db, 'users', currentUserId)
      await updateDoc(currentUserRef, {
        friends: arrayRemove(friendId)
      })

      // Remove from friend's friends
      const friendRef = doc(db, 'users', friendId)
      await updateDoc(friendRef, {
        friends: arrayRemove(currentUserId)
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Cancel sent request
  const cancelFriendRequest = async (fromUserId, toUserId) => {
    try {
      // Remove from sender's sentRequests
      const senderRef = doc(db, 'users', fromUserId)
      await updateDoc(senderRef, {
        sentRequests: arrayRemove(toUserId)
      })

      // Remove from receiver's friendRequests
      const receiverRef = doc(db, 'users', toUserId)
      await updateDoc(receiverRef, {
        friendRequests: arrayRemove(fromUserId)
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get friend requests for current user
  const loadFriendRequests = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        // Ensure friendRequests is an array
        const requestIds = Array.isArray(userData.friendRequests) ? userData.friendRequests : []
        
        // Get user details for each request
        const requests = await Promise.all(
          requestIds.map(async (requestId) => {
            // Ensure requestId is a valid string
            if (!requestId || typeof requestId !== 'string') return null
            const requestUser = await getUserById(requestId)
            return requestUser
          })
        )
        
        return requests.filter(Boolean)
      }
      return []
    } catch (error) {
      console.error('Error loading friend requests:', error)
      return []
    }
  }

  // Get friends list
  const loadFriends = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        // Ensure friends is an array
        const friendIds = Array.isArray(userData.friends) ? userData.friends : []
        
        // Get user details for each friend
        const friendsList = await Promise.all(
          friendIds.map(async (friendId) => {
            // Ensure friendId is a valid string
            if (!friendId || typeof friendId !== 'string') return null
            const friend = await getUserById(friendId)
            return friend
          })
        )
        
        return friendsList.filter(Boolean)
      }
      return []
    } catch (error) {
      console.error('Error loading friends:', error)
      return []
    }
  }

  // Check friendship status
  const getFriendshipStatus = async (currentUserId, targetUserId) => {
    try {
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId))
      if (!currentUserDoc.exists()) return 'none'

      const userData = currentUserDoc.data()
      // Ensure all are arrays
      const friends = Array.isArray(userData.friends) ? userData.friends : []
      const sentRequests = Array.isArray(userData.sentRequests) ? userData.sentRequests : []
      const friendRequests = Array.isArray(userData.friendRequests) ? userData.friendRequests : []

      if (friends.includes(targetUserId)) {
        return 'friends'
      } else if (sentRequests.includes(targetUserId)) {
        return 'sent'
      } else if (friendRequests.includes(targetUserId)) {
        return 'received'
      }
      return 'none'
    } catch (error) {
      console.error('Error checking friendship status:', error)
      return 'none'
    }
  }

  return {
    friendRequests,
    friends,
    loading,
    searchUsers,
    getUserById,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    cancelFriendRequest,
    loadFriendRequests,
    loadFriends,
    getFriendshipStatus
  }
})

