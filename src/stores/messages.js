import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot, 
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useNotificationsStore } from './notifications'
import { useUserCacheStore } from './userCache'

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
  const sendMessage = async (fromUserId, toUserId, content, fileData = null, replyToMessageId = null) => {
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
        if (fileData.type === 'images' && fileData.images && Array.isArray(fileData.images)) {
          // Multiple images
          const count = fileData.images.length
          lastMessageText = count === 1 ? '📷 Ảnh' : `📷 ${count} ảnh`
        } else if (fileData.type === 'image') {
          lastMessageText = '📷 Ảnh'
        } else if (fileData.type === 'video') lastMessageText = '🎥 Video'
        else if (fileData.type === 'audio') lastMessageText = '🎤 Ghi âm'
        else if (fileData.type === 'file') lastMessageText = `📎 ${fileData.filename || 'File'}`
        if (content?.trim()) lastMessageText = `${lastMessageText}: ${content.trim()}`
      }

      // Check if conversation exists, create if not
      const conversationDoc = await getDoc(conversationRef)
      let conversationExists = conversationDoc.exists()
      
      if (!conversationExists) {
        // Create new conversation with participants
        try {
          await setDoc(conversationRef, {
            participants: [fromUserId, toUserId],
            lastMessage: lastMessageText,
            lastMessageTime: serverTimestamp(),
            createdAt: serverTimestamp()
          })
          // Wait a bit to ensure conversation is created before sending message
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (createError) {
          // If creation fails, check if conversation was created by another request
          const retryDoc = await getDoc(conversationRef)
          if (!retryDoc.exists()) {
            throw createError
          }
          conversationExists = true
        }
      }
      
      if (conversationExists) {
        // Ensure current user is a participant (fix for old conversations)
        const conversationData = conversationDoc.exists() ? conversationDoc.data() : (await getDoc(conversationRef)).data()
        const participants = conversationData?.participants || []
        
        // Ensure both users are participants
        const missingFrom = !participants.includes(fromUserId)
        const missingTo = !participants.includes(toUserId)
        
        if (missingFrom || missingTo) {
          try {
            // Use arrayUnion to add missing participants
            if (missingFrom) {
              await updateDoc(conversationRef, {
                participants: arrayUnion(fromUserId)
              })
            }
            if (missingTo) {
              await updateDoc(conversationRef, {
                participants: arrayUnion(toUserId)
              })
            }
          } catch (updateError) {
            // If update fails due to permissions, log but continue
            console.warn('Could not update participants:', updateError.message)
            // Still try to send message - rules might allow it
          }
        }
        
        // Update last message
        try {
          await updateDoc(conversationRef, {
            lastMessage: lastMessageText,
            lastMessageTime: serverTimestamp()
          })
        } catch (updateError) {
          // If update fails, log but continue (message can still be sent)
          console.warn('Could not update last message:', updateError.message)
        }
      }

      // Get from user data using cache
      const userCacheStore = useUserCacheStore()
      const fromUserData = await userCacheStore.getUser(fromUserId) || {}

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

      // Add replyTo if replying to a message
      if (replyToMessageId) {
        messageData.replyTo = replyToMessageId
      }

      // Add file data if exists
      if (fileData) {
        if (fileData.type === 'images' && fileData.images && Array.isArray(fileData.images)) {
          // Multiple images
          messageData.fileType = 'images'
          messageData.images = fileData.images // Array of base64 images
          messageData.imageCount = fileData.images.length
          
          // Log để debug
          console.log('[MessagesStore] Sending multiple images:', {
            count: fileData.images.length,
            firstImageSize: fileData.images[0]?.length || 0,
            totalSize: fileData.images.reduce((sum, img) => sum + (img?.length || 0), 0)
          })
        } else {
          // Single file
          messageData.fileType = fileData.type
          messageData.fileData = fileData.data
          messageData.fileName = fileData.filename || null
          messageData.fileSize = fileData.size || null
          messageData.mimeType = fileData.mimeType || null
          if (fileData.duration) {
            messageData.duration = fileData.duration
          }
        }
      }

      // Add message to messages subcollection
      const messagesRef = collection(db, 'conversations', conversationId, 'messages')
      
      // Check total size of message data (Firestore limit is ~1MB per document)
      const messageDataSize = JSON.stringify(messageData).length
      if (messageDataSize > 900 * 1024) { // 900KB to be safe
        console.warn('[MessagesStore] Message data size is large:', messageDataSize, 'bytes')
        // If too large, try to reduce image quality or split
        if (fileData && fileData.type === 'images' && fileData.images) {
          return { 
            success: false, 
            error: `Tin nhắn quá lớn (${Math.round(messageDataSize / 1024)}KB). Vui lòng gửi ít hình hơn hoặc giảm kích thước hình.` 
          }
        }
      }
      
      try {
        await addDoc(messagesRef, messageData)
        console.log('[MessagesStore] Message sent successfully:', {
          fileType: messageData.fileType,
          hasImages: !!messageData.images,
          imagesCount: messageData.images?.length || 0
        })
      } catch (error) {
        console.error('[MessagesStore] Error adding message to Firestore:', error)
        
        // Check if it's a permission error - try to fix and retry
        if (error.code === 'permission-denied') {
          try {
            // Ensure conversation has correct participants
            const convDoc = await getDoc(conversationRef)
            if (convDoc.exists()) {
              const convData = convDoc.data()
              const participants = convData?.participants || []
              
              // Ensure both users are participants
              if (!participants.includes(fromUserId) || !participants.includes(toUserId)) {
                if (!participants.includes(fromUserId)) {
                  await updateDoc(conversationRef, { participants: arrayUnion(fromUserId) })
                }
                if (!participants.includes(toUserId)) {
                  await updateDoc(conversationRef, { participants: arrayUnion(toUserId) })
                }
                
                // Wait a bit and retry
                await new Promise(resolve => setTimeout(resolve, 200))
                await addDoc(messagesRef, messageData)
                console.log('[MessagesStore] Message sent successfully after retry')
              } else {
                // Participants are correct but still permission denied - rules issue
                return { 
                  success: false, 
                  error: 'Không có quyền gửi tin nhắn. Vui lòng kiểm tra Firestore rules hoặc thử lại sau.' 
                }
              }
            } else {
              return { 
                success: false, 
                error: 'Conversation không tồn tại. Vui lòng thử lại.' 
              }
            }
          } catch (retryError) {
            console.error('[MessagesStore] Retry failed:', retryError)
            return { 
              success: false, 
              error: 'Không thể gửi tin nhắn. Vui lòng kiểm tra quyền truy cập hoặc thử lại sau.' 
            }
          }
        } else if (error.message && error.message.includes('size')) {
          return { 
            success: false, 
            error: 'Tin nhắn quá lớn. Vui lòng gửi ít hình hơn hoặc giảm kích thước hình.' 
          }
        } else {
          throw error
        }
      }

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

  // Track message subscriptions to avoid duplicates
  const messageSubscriptions = new Map() // Map<conversationId, {unsubscribe, count}>
  
  // Internal function to create subscription
  const _subscribeToMessages = (userId1, userId2, callback = null) => {
    const conversationId = getConversationId(userId1, userId2)
    const messagesRef = collection(db, 'conversations', conversationId, 'messages')
    // Query all messages, ordered by creation time ascending (oldest first, newest last)
    const q = query(messagesRef, orderBy('createdAt', 'asc'))

    return onSnapshot(q, async (snapshot) => {
      const messagesData = snapshot.docs.map(doc => {
        const data = doc.data()
        const message = {
          id: doc.id,
          ...data,
          // Ensure images array is preserved if it exists
          images: data.images && Array.isArray(data.images) ? data.images : (data.images ? [data.images] : null),
          createdAt: data.createdAt?.toDate?.() || new Date()
        }
        
        // Log để debug multiple images
        if (message.fileType === 'images' && message.images) {
          console.log('[MessagesStore] Loaded message with images:', {
            messageId: message.id,
            fileType: message.fileType,
            imagesCount: message.images?.length || 0,
            hasImages: !!message.images,
            isArray: Array.isArray(message.images)
          })
        }
        
        return message
      })
      
      // Use user cache to load user info efficiently
      const userCacheStore = useUserCacheStore()
      const userIds = [...new Set(messagesData.map(m => m.fromUserId).filter(Boolean))]
      await userCacheStore.getUsers(userIds) // Preload all users in batch
      
      // Attach user info from cache
      const cache = userCacheStore.getUserCache()
      const messagesWithLatestInfo = messagesData.map((message) => {
        if (message.fromUserId) {
          const userData = cache.get(message.fromUserId)
          if (userData) {
            message.fromUserAvatar = userData.avatar || ''
            message.fromUserName = userData.displayName || 'Người dùng'
          } else if (!message.fromUserName) {
            // Fallback if cache miss
            message.fromUserName = 'Người dùng'
            message.fromUserAvatar = ''
          }
        }
        return message
      })
      
      // If callback provided, use it (for multiple chat windows)
      // Otherwise, update shared messages.value (for single chat view)
      if (callback && typeof callback === 'function') {
        callback(messagesWithLatestInfo)
      } else {
        messages.value = messagesWithLatestInfo
      }
    }, (error) => {
      // Handle permission errors gracefully
      if (error.code === 'permission-denied') {
        console.warn(`[MessagesStore] Permission denied for messages in conversation ${conversationId}. You may not have access to this conversation.`)
        // Set empty messages if permission denied
        if (callback && typeof callback === 'function') {
          callback([])
        } else {
          messages.value = []
        }
      } else {
        console.error(`[MessagesStore] Error subscribing to messages in conversation ${conversationId}:`, error)
      }
    })
  }

  // Track active subscriptions to avoid duplicates
  let conversationsUnsubscribe = null
  let conversationsSubscribersCount = 0
  let activeUserId = null
  
  // Subscribe to conversations for a user with realtime unread count
  const subscribeToConversations = (userId) => {
    // If already subscribed for this user, just increment counter
    if (conversationsUnsubscribe && activeUserId === userId) {
      conversationsSubscribersCount++
      return () => {
        conversationsSubscribersCount--
        // Only unsubscribe when no one is listening
        if (conversationsSubscribersCount === 0 && conversationsUnsubscribe) {
          conversationsUnsubscribe()
          conversationsUnsubscribe = null
          activeUserId = null
        }
      }
    }
    
    // If subscribed for different user, unsubscribe first
    if (conversationsUnsubscribe) {
      conversationsUnsubscribe()
      conversationsUnsubscribe = null
    }
    
    activeUserId = userId
    conversationsSubscribersCount = 1
    
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
        // Handle permission errors gracefully
        if (error.code === 'permission-denied') {
          console.warn(`[MessagesStore] Permission denied for unread messages in conversation ${conversationId}. This conversation may not exist or you may not have access.`)
        } else {
          console.error(`[MessagesStore] Error subscribing to unread messages in conversation ${conversationId}:`, error)
        }
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
        // Ensure participants exists and is an array
        if (!data || !Array.isArray(data.participants)) {
          console.warn(`[MessagesStore] Conversation ${docSnap.id} has invalid participants field, skipping`)
          continue
        }
        const otherUserId = data.participants.find(id => id !== userId)
        
        if (!otherUserId) {
          console.warn(`[MessagesStore] Conversation ${docSnap.id} does not have other user, skipping`)
          continue
        }
        
        const conversationId = docSnap.id
        
        // Use user cache to get other user info
        const userCacheStore = useUserCacheStore()
        const otherUser = await userCacheStore.getUser(otherUserId)

        // Create conversation with initial unreadCount = 0
        const conversation = {
          id: conversationId,
          ...data,
          otherUser,
          unreadCount: 0,
          lastMessageTime: data.lastMessageTime?.toDate?.() || data.lastMessageTime || new Date()
        }
        
        convs.push(conversation)
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
      
      // Handle permission errors
      if (error.code === 'permission-denied') {
        console.warn('[MessagesStore] Permission denied for conversations query. User may not have access to any conversations.')
        conversations.value = []
        return
      }
      
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
            // Ensure participants exists and is an array
            if (!data || !Array.isArray(data.participants)) {
              continue
            }
            const otherUserId = data.participants.find(id => id !== userId)
            if (!otherUserId) continue
            
            const conversationId = docSnap.id
            
            // Use user cache to get other user info
            const userCacheStore = useUserCacheStore()
            const otherUser = await userCacheStore.getUser(otherUserId)

            // Create conversation with initial unreadCount = 0
            const conversation = {
              id: conversationId,
              ...data,
              otherUser,
              unreadCount: 0,
              lastMessageTime: data.lastMessageTime?.toDate?.() || data.lastMessageTime || new Date()
            }
            
            convs.push(conversation)
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
        
        // Replace conversationsUnsubscribe with simple query cleanup
        conversationsUnsubscribe = () => {
          unsubscribeSimple()
          messageUnsubscribes.forEach((unsub) => unsub())
          messageUnsubscribes.clear()
        }
      } else {
        // For other errors, set up basic cleanup
        conversationsUnsubscribe = () => {
          messageUnsubscribes.forEach((unsub) => unsub())
          messageUnsubscribes.clear()
        }
      }
    })
    
    // Set up conversationsUnsubscribe if not already set (for successful subscription)
    if (!conversationsUnsubscribe) {
      conversationsUnsubscribe = () => {
        unsubscribeConversations()
        messageUnsubscribes.forEach((unsub) => unsub())
        messageUnsubscribes.clear()
      }
    }
    
    return () => {
      conversationsSubscribersCount--
      // Only unsubscribe when no one is listening
      if (conversationsSubscribersCount === 0 && conversationsUnsubscribe) {
        conversationsUnsubscribe()
        conversationsUnsubscribe = null
        activeUserId = null
      }
    }
  }
  
  // Optimized subscribeToMessages - reuse subscriptions
  const subscribeToMessages = (userId1, userId2, callback = null) => {
    const conversationId = getConversationId(userId1, userId2)
    
    // If already subscribed, just increment counter
    if (messageSubscriptions.has(conversationId)) {
      const sub = messageSubscriptions.get(conversationId)
      sub.count++
      return () => {
        sub.count--
        if (sub.count === 0) {
          sub.unsubscribe()
          messageSubscriptions.delete(conversationId)
        }
      }
    }
    
    // Create new subscription using internal function
    const unsubscribe = _subscribeToMessages(userId1, userId2, callback)
    messageSubscriptions.set(conversationId, {
      unsubscribe,
      count: 1
    })
    
    return () => {
      const sub = messageSubscriptions.get(conversationId)
      if (sub) {
        sub.count--
        if (sub.count === 0) {
          sub.unsubscribe()
          messageSubscriptions.delete(conversationId)
        }
      }
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
        
        try {
          await batch.commit()
          
          // Immediately update unreadCount in conversations array (optimistic update)
          const conv = conversations.value.find(c => c.id === conversationId)
          if (conv) {
            conv.unreadCount = 0
            console.log(`[MessagesStore] Marked ${snapshot.size} messages as read for conversation ${conversationId}`)
          }
        } catch (updateError) {
          // If update fails due to permissions, still update UI optimistically
          console.warn('Could not update read status in Firestore (permissions issue):', updateError.message)
          const conv = conversations.value.find(c => c.id === conversationId)
          if (conv) {
            conv.unreadCount = 0
          }
          // Mark messages as read locally in the messages array
          messages.value.forEach(msg => {
            if (msg.toUserId === userId1 && !msg.read) {
              msg.read = true
            }
          })
        }
      }
      
      return { success: true }
    } catch (error) {
      // Silently handle errors - don't break the chat experience
      console.warn('Error marking as read:', error.message)
      // Still update UI optimistically
      const conversationId = getConversationId(userId1, userId2)
      const conv = conversations.value.find(c => c.id === conversationId)
      if (conv) {
        conv.unreadCount = 0
      }
      // Mark messages as read locally
      messages.value.forEach(msg => {
        if (msg.toUserId === userId1 && !msg.read) {
          msg.read = true
        }
      })
      return { success: false, error: error.message }
    }
  }

  // Delete a message
  const deleteMessage = async (userId1, userId2, messageId) => {
    try {
      const conversationId = getConversationId(userId1, userId2)
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)
      
      // Check if message exists and belongs to current user
      const messageDoc = await getDoc(messageRef)
      if (!messageDoc.exists()) {
        return { success: false, error: 'Tin nhắn không tồn tại' }
      }
      
      const messageData = messageDoc.data()
      const currentUserId = userId1 // Assuming userId1 is the current user
      
      // Only allow deleting own messages
      if (messageData.fromUserId !== currentUserId) {
        return { success: false, error: 'Bạn chỉ có thể xóa tin nhắn của mình' }
      }
      
      // Mark message as deleted instead of deleting it
      await updateDoc(messageRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        content: '', // Clear content
        fileType: null,
        fileData: null,
        images: null
      })
      
      // Update last message in conversation if this was the last message
      const conversationRef = doc(db, 'conversations', conversationId)
      const conversationDoc = await getDoc(conversationRef)
      
      if (conversationDoc.exists()) {
        const convData = conversationDoc.data()
        // If deleted message was the last message, update conversation
        if (convData.lastMessageId === messageId) {
          // Get the new last message
          const messagesRef = collection(db, 'conversations', conversationId, 'messages')
          const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1))
          const snapshot = await getDocs(q)
          
          if (snapshot.size > 0) {
            const lastMsg = snapshot.docs[0]
            const lastMsgData = lastMsg.data()
            await updateDoc(conversationRef, {
              lastMessage: lastMsgData.content || (lastMsgData.fileType === 'images' ? `📷 ${lastMsgData.imageCount || lastMsgData.images?.length || 0} ảnh` : 
                lastMsgData.fileType === 'image' ? '📷 Ảnh' :
                lastMsgData.fileType === 'video' ? '🎥 Video' :
                lastMsgData.fileType === 'audio' ? '🎤 Ghi âm' :
                lastMsgData.fileType === 'file' ? `📎 ${lastMsgData.fileName || 'File'}` : ''),
              lastMessageId: lastMsg.id,
              lastMessageTime: lastMsgData.createdAt
            })
          } else {
            // No messages left, clear conversation
            await updateDoc(conversationRef, {
              lastMessage: '',
              lastMessageId: null,
              lastMessageTime: null
            })
          }
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error deleting message:', error)
      
      // Check if it's a permissions error
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        return { 
          success: false, 
          error: 'Không có quyền xóa tin nhắn. Vui lòng cập nhật Firestore Rules để cho phép xóa tin nhắn.' 
        }
      }
      
      return { success: false, error: error.message || 'Không thể xóa tin nhắn' }
    }
  }

  // Edit a message (only text content)
  const editMessage = async (userId1, userId2, messageId, newContent) => {
    try {
      if (!newContent || !newContent.trim()) {
        return { success: false, error: 'Nội dung tin nhắn không được để trống' }
      }
      
      const conversationId = getConversationId(userId1, userId2)
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)
      
      // Check if message exists and belongs to current user
      const messageDoc = await getDoc(messageRef)
      if (!messageDoc.exists()) {
        return { success: false, error: 'Tin nhắn không tồn tại' }
      }
      
      const messageData = messageDoc.data()
      const currentUserId = userId1 // Assuming userId1 is the current user
      
      // Only allow editing own messages
      if (messageData.fromUserId !== currentUserId) {
        return { success: false, error: 'Bạn chỉ có thể sửa tin nhắn của mình' }
      }
      
      // Only allow editing messages with text content
      if (!messageData.content || !messageData.content.trim()) {
        return { success: false, error: 'Chỉ có thể sửa tin nhắn có văn bản' }
      }
      
      // Update the message
      await updateDoc(messageRef, {
        content: newContent.trim(),
        edited: true,
        editedAt: serverTimestamp()
      })
      
      // Update last message in conversation if this was the last message
      const conversationRef = doc(db, 'conversations', conversationId)
      const conversationDoc = await getDoc(conversationRef)
      
      if (conversationDoc.exists()) {
        const convData = conversationDoc.data()
        if (convData.lastMessageId === messageId) {
          await updateDoc(conversationRef, {
            lastMessage: newContent.trim()
          })
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error editing message:', error)
      
      // Check if it's a permissions error
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        return { 
          success: false, 
          error: 'Không có quyền sửa tin nhắn. Vui lòng cập nhật Firestore Rules để cho phép sửa tin nhắn.' 
        }
      }
      
      return { success: false, error: error.message || 'Không thể sửa tin nhắn' }
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
          
          // Check for new messages (only on 'added' events, not on initial load)
          // Skip initial snapshot to avoid auto-opening chats for old unread messages
          if (messagesSnapshot.metadata.hasPendingWrites === false) {
            messagesSnapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const message = change.doc.data()
                const messageFromUserId = message.fromUserId
                
                // Only trigger if:
                // 1. Message is from the other user in this conversation
                // 2. Message is actually unread (read === false)
                // 3. Message is for current user (toUserId === userId)
                if (messageFromUserId === otherUserId && 
                    message.read === false && 
                    message.toUserId === userId) {
                  // New unread message arrived - tự động mở popup
                  console.log(`[MessagesStore] New unread message from ${otherUserId}, auto-opening chat`)
                  if (onNewMessage) {
                    onNewMessage(otherUserId, message)
                  }
                }
              }
            })
          }
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
    deleteMessage,
    editMessage,
    updateUnreadCount,
    subscribeToUnreadMessages,
    getConversationId
  }
})
