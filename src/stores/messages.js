import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useNotificationsStore } from './notifications'

export const useMessagesStore = defineStore('messages', () => {
  const conversations = ref([])
  const messages = ref([])
  const loading = ref(false)
  const unreadMessagesCount = ref(0) // Tổng số tin nhắn chưa đọc

  // Get or create conversation ID between two users
  const getConversationId = (userId1, userId2) => {
    // Sort IDs to ensure consistent conversation ID
    const sortedIds = [userId1, userId2].sort()
    return `${sortedIds[0]}_${sortedIds[1]}`
  }

  // Send a message - ĐỜN GIẢN: chỉ tạo message, không có unreadCount phức tạp
  const sendMessage = async (fromUserId, toUserId, content, fileData = null) => {
    // Must have either content or fileData
    if ((!content || !content.trim()) && !fileData) {
      return { success: false, error: 'Tin nhắn hoặc file không được để trống' }
    }

    loading.value = true
    try {
      const conversationId = getConversationId(fromUserId, toUserId)
      const conversationRef = doc(db, 'conversations', conversationId)

      // Prepare last message text
      let lastMessageText = content?.trim() || ''
      if (fileData) {
        if (fileData.type === 'image') lastMessageText = '📷 Ảnh'
        else if (fileData.type === 'video') lastMessageText = '🎥 Video'
        else if (fileData.type === 'audio') lastMessageText = '🎤 Ghi âm'
        else if (fileData.type === 'file') lastMessageText = `📎 ${fileData.filename || 'File'}`
        if (content?.trim()) lastMessageText = `${lastMessageText}: ${content.trim()}`
      }

      // Check if conversation exists, create if not
      const conversationDoc = await getDoc(conversationRef)
      if (!conversationDoc.exists()) {
        await setDoc(conversationRef, {
          participants: [fromUserId, toUserId],
          lastMessage: lastMessageText,
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp()
        })
      } else {
        // Update last message
        await updateDoc(conversationRef, {
          lastMessage: lastMessageText,
          lastMessageTime: serverTimestamp()
        })
      }

      // Get from user data for avatar and name
      const fromUserDoc = await getDoc(doc(db, 'users', fromUserId))
      const fromUserData = fromUserDoc.exists() ? fromUserDoc.data() : {}

      // Prepare message data
      const messageData = {
        fromUserId,
        toUserId,
        fromUserName: fromUserData.displayName || 'Người dùng',
        fromUserAvatar: fromUserData.avatar || '',
        content: content?.trim() || '',
        read: false, // Mặc định là chưa đọc
        createdAt: serverTimestamp()
      }

      // Add file data if exists
      if (fileData) {
        messageData.fileType = fileData.type
        messageData.fileData = fileData.data
        messageData.fileName = fileData.filename || null
        messageData.fileSize = fileData.size || null
        messageData.mimeType = fileData.mimeType || null
        if (fileData.duration) {
          messageData.duration = fileData.duration
        }
      }

      // Add message to messages subcollection
      const messagesRef = collection(db, 'conversations', conversationId, 'messages')
      await addDoc(messagesRef, messageData)

      // Tạo thông báo cho người nhận (giữ lại logic cũ)
      try {
        const notificationsStore = useNotificationsStore()
        await notificationsStore.createNotification(toUserId, 'message', {
          fromUserId,
          fromUserName: fromUserData.displayName || 'Người dùng',
          fromUserAvatar: fromUserData.avatar || '',
          message: lastMessageText
        })
      } catch (error) {
        console.error('Error creating message notification:', error)
      }

      return { success: true }
    } catch (error) {
      console.error('Error sending message:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // Subscribe to messages in a conversation
  const subscribeToMessages = (userId1, userId2) => {
    const conversationId = getConversationId(userId1, userId2)
    const messagesRef = collection(db, 'conversations', conversationId, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'))

    return onSnapshot(q, async (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }))
      
      // Always load latest user info for all messages
      const messagesWithLatestInfo = await Promise.all(
        messagesData.map(async (message) => {
          if (message.fromUserId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', message.fromUserId))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                // Always update with latest info from user profile
                message.fromUserAvatar = userData.avatar || ''
                message.fromUserName = userData.displayName || message.fromUserName || 'Người dùng'
              }
            } catch (error) {
              console.error('Error loading user info for message:', error)
            }
          }
          return message
        })
      )
      
      messages.value = messagesWithLatestInfo
    })
  }

  // Subscribe to conversations for a user with realtime unread count
  const subscribeToConversations = (userId) => {
    const conversationsRef = collection(db, 'conversations')
    const messageUnsubscribes = new Map() // Track unread message subscriptions
    
    // Helper function to subscribe to unread messages for a conversation
    const subscribeToUnreadForConversation = (conversationId) => {
      // Clean up existing subscription if any
      if (messageUnsubscribes.has(conversationId)) {
        messageUnsubscribes.get(conversationId)()
      }
      
      const messagesRef = collection(db, 'conversations', conversationId, 'messages')
      const unreadQuery = query(
        messagesRef,
        where('toUserId', '==', userId),
        where('read', '==', false)
      )
      
      const unsubscribe = onSnapshot(unreadQuery, (unreadSnapshot) => {
        // Always find conversation by ID to update unreadCount (more reliable than index)
        const conv = conversations.value.find(c => c.id === conversationId)
        if (conv) {
          conv.unreadCount = unreadSnapshot.size
          console.log(`[MessagesStore] Updated unreadCount for conversation ${conversationId}: ${unreadSnapshot.size}`)
        }
      }, (error) => {
        console.error(`Error subscribing to unread messages in conversation ${conversationId}:`, error)
      })
      
      messageUnsubscribes.set(conversationId, unsubscribe)
    }
    
    // Try with orderBy first
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    )

    const unsubscribeConversations = onSnapshot(q, async (snapshot) => {
      // Clean up old message subscriptions
      messageUnsubscribes.forEach((unsub) => unsub())
      messageUnsubscribes.clear()
      
      const convs = []
      for (let i = 0; i < snapshot.docs.length; i++) {
        const docSnap = snapshot.docs[i]
        const data = docSnap.data()
        const otherUserId = data.participants.find(id => id !== userId)
        
        if (!otherUserId) continue
        
        const conversationId = docSnap.id
        
        // Get other user's info
        try {
          const otherUserDoc = await getDoc(doc(db, 'users', otherUserId))
          const otherUser = otherUserDoc.exists() 
            ? { id: otherUserDoc.id, ...otherUserDoc.data() }
            : null

          // Create conversation with initial unreadCount = 0
          const conversation = {
            id: conversationId,
            ...data,
            otherUser,
            unreadCount: 0,
            lastMessageTime: data.lastMessageTime?.toDate?.() || data.lastMessageTime || new Date()
          }
          
          convs.push(conversation)
        } catch (error) {
          console.error('Error loading user info:', error)
          // Still add conversation without user info
          convs.push({
            id: conversationId,
            ...data,
            otherUser: null,
            unreadCount: 0,
            lastMessageTime: data.lastMessageTime?.toDate?.() || data.lastMessageTime || new Date()
          })
        }
      }
      
      // Sort by lastMessageTime (in case orderBy doesn't work)
      convs.sort((a, b) => {
        const timeA = a.lastMessageTime instanceof Date ? a.lastMessageTime : new Date(a.lastMessageTime)
        const timeB = b.lastMessageTime instanceof Date ? b.lastMessageTime : new Date(b.lastMessageTime)
        return timeB - timeA
      })
      
      conversations.value = convs
      
      // Subscribe to unread messages for each conversation (realtime)
      convs.forEach((conv) => {
        subscribeToUnreadForConversation(conv.id)
      })
    }, (error) => {
      console.error('Error in conversations subscription:', error)
      
      // If composite index missing, use simple query without orderBy
      if (error.code === 'failed-precondition') {
        console.warn('Composite index missing, using simple query. Click the link in error to create index.')
        const simpleQ = query(
          conversationsRef,
          where('participants', 'array-contains', userId)
        )
        
        const unsubscribeSimple = onSnapshot(simpleQ, async (snapshot) => {
          // Clean up old message subscriptions
          messageUnsubscribes.forEach((unsub) => unsub())
          messageUnsubscribes.clear()
          
          const convs = []
          for (let i = 0; i < snapshot.docs.length; i++) {
            const docSnap = snapshot.docs[i]
            const data = docSnap.data()
            const otherUserId = data.participants.find(id => id !== userId)
            if (!otherUserId) continue
            
            const conversationId = docSnap.id
            
            try {
              const otherUserDoc = await getDoc(doc(db, 'users', otherUserId))
              const otherUser = otherUserDoc.exists() 
                ? { id: otherUserDoc.id, ...otherUserDoc.data() }
                : null

              // Create conversation with initial unreadCount = 0
              const conversation = {
                id: conversationId,
                ...data,
                otherUser,
                unreadCount: 0,
                lastMessageTime: data.lastMessageTime?.toDate?.() || data.lastMessageTime || new Date()
              }
              
              convs.push(conversation)
            } catch (err) {
              console.error('Error loading user info:', err)
            }
          }
          
          // Sort by lastMessageTime manually
          convs.sort((a, b) => {
            const timeA = a.lastMessageTime instanceof Date ? a.lastMessageTime : new Date(a.lastMessageTime)
            const timeB = b.lastMessageTime instanceof Date ? b.lastMessageTime : new Date(b.lastMessageTime)
            return timeB - timeA
          })
          
          conversations.value = convs
          
          // Subscribe to unread messages for each conversation (realtime)
          convs.forEach((conv) => {
            subscribeToUnreadForConversation(conv.id)
          })
        })
        
        // Replace the unsubscribe function to handle simple query cleanup
        return () => {
          unsubscribeSimple()
          messageUnsubscribes.forEach((unsub) => unsub())
          messageUnsubscribes.clear()
        }
      }
    })
    
    // Return cleanup function
    return () => {
      unsubscribeConversations()
      messageUnsubscribes.forEach((unsub) => unsub())
      messageUnsubscribes.clear()
    }
  }

  // Mark messages as read - ĐỜN GIẢN: chỉ update read: true
  const markAsRead = async (userId1, userId2) => {
    try {
      const conversationId = getConversationId(userId1, userId2)
      const messagesRef = collection(db, 'conversations', conversationId, 'messages')
      const q = query(
        messagesRef,
        where('toUserId', '==', userId1),
        where('read', '==', false)
      )

      const snapshot = await getDocs(q)
      
      // Update all unread messages using batch writes
      if (snapshot.size > 0) {
        const batch = writeBatch(db)
        snapshot.docs.forEach((docSnap) => {
          const messageRef = doc(db, 'conversations', conversationId, 'messages', docSnap.id)
          batch.update(messageRef, { read: true })
        })
        await batch.commit()
        
        // Immediately update unreadCount in conversations array (optimistic update)
        const conv = conversations.value.find(c => c.id === conversationId)
        if (conv) {
          conv.unreadCount = 0
          console.log(`[MessagesStore] Marked ${snapshot.size} messages as read for conversation ${conversationId}`)
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error marking as read:', error)
      return { success: false, error: error.message }
    }
  }

  // Tính tổng số tin nhắn chưa đọc từ tất cả conversations - ĐỜN GIẢN: query trực tiếp từ messages
  const updateUnreadCount = async (userId) => {
    try {
      // Get all conversations
      const conversationsRef = collection(db, 'conversations')
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
      )
      
      const conversationsSnapshot = await getDocs(q)
      let totalUnread = 0
      
      // Count unread messages from each conversation
      for (const convDoc of conversationsSnapshot.docs) {
        const conversationId = convDoc.id
        const messagesRef = collection(db, 'conversations', conversationId, 'messages')
        const unreadQuery = query(
          messagesRef,
          where('toUserId', '==', userId),
          where('read', '==', false)
        )
        const unreadSnapshot = await getDocs(unreadQuery)
        totalUnread += unreadSnapshot.size
      }
      
      unreadMessagesCount.value = totalUnread
      return totalUnread
    } catch (error) {
      console.error('Error updating unread count:', error)
      unreadMessagesCount.value = 0
      return 0
    }
  }

  // Subscribe to all unread messages for a user - để detect tin nhắn mới và tự động mở popup
  // ĐỜN GIẢN: Subscribe đến tất cả conversations, với mỗi conversation subscribe đến unread messages
  const subscribeToUnreadMessages = (userId, onNewMessage = null) => {
    const unsubscribes = []
    const conversationUnreadCounts = {} // Map conversationId -> unreadCount
    
    // Function để tính tổng unread count
    const updateTotalUnread = () => {
      const total = Object.values(conversationUnreadCounts).reduce((sum, count) => sum + (count || 0), 0)
      unreadMessagesCount.value = total
    }
    
    // Subscribe to conversations
    const conversationsRef = collection(db, 'conversations')
    const conversationsQuery = query(
      conversationsRef,
      where('participants', 'array-contains', userId)
    )
    
    const conversationsUnsubscribe = onSnapshot(conversationsQuery, (conversationsSnapshot) => {
      // Unsubscribe from old conversations
      unsubscribes.forEach(unsub => unsub())
      unsubscribes.length = 0
      
      // Reset counts - xóa tất cả keys
      Object.keys(conversationUnreadCounts).forEach(key => {
        delete conversationUnreadCounts[key]
      })
      
      // Subscribe to unread messages in each conversation
      conversationsSnapshot.docs.forEach((convDoc) => {
        const conversationId = convDoc.id
        const convData = convDoc.data()
        const otherUserId = convData.participants.find(id => id !== userId)
        
        if (!otherUserId) return
        
        const messagesRef = collection(db, 'conversations', conversationId, 'messages')
        
        // Query unread messages - đơn giản, không cần orderBy
        const unreadQuery = query(
          messagesRef,
          where('toUserId', '==', userId),
          where('read', '==', false)
        )
        
        const messagesUnsubscribe = onSnapshot(unreadQuery, (messagesSnapshot) => {
          // Update unread count for this conversation
          conversationUnreadCounts[conversationId] = messagesSnapshot.size
          
          // Update total unread count
          updateTotalUnread()
          
          // Check for new messages
          messagesSnapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const message = change.doc.data()
              const messageFromUserId = message.fromUserId
              
              // Only trigger if message is from the other user in this conversation
              if (messageFromUserId === otherUserId) {
                // New unread message arrived - tự động mở popup
                console.log(`[MessagesStore] New unread message from ${otherUserId}, auto-opening chat`)
                if (onNewMessage) {
                  onNewMessage(otherUserId, message)
                }
              }
            }
          })
        }, (error) => {
          console.error(`Error subscribing to messages in conversation ${conversationId}:`, error)
          // Remove this conversation from counts if error
          delete conversationUnreadCounts[conversationId]
          updateTotalUnread()
        })
        
        unsubscribes.push(messagesUnsubscribe)
      })
    }, (error) => {
      console.error('Error subscribing to conversations:', error)
    })
    
    // Return unsubscribe function
    return () => {
      conversationsUnsubscribe()
      unsubscribes.forEach(unsub => unsub())
    }
  }

  return {
    conversations,
    messages,
    loading,
    unreadMessagesCount,
    sendMessage,
    subscribeToMessages,
    subscribeToConversations,
    markAsRead,
    updateUnreadCount,
    subscribeToUnreadMessages,
    getConversationId
  }
})
