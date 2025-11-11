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
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/config/firebase'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)

  // Computed: Filter message notifications
  const messageNotifications = computed(() => {
    return notifications.value.filter(n => n.type === 'message')
  })

  // Computed: Filter other notifications (non-message)
  const otherNotifications = computed(() => {
    return notifications.value.filter(n => n.type !== 'message')
  })

  // Computed: Unread message count
  const unreadMessageCount = computed(() => {
    return messageNotifications.value.filter(n => !n.read).length
  })

  // Computed: Unread other notifications count
  const unreadOtherCount = computed(() => {
    return otherNotifications.value.filter(n => !n.read).length
  })

  // Create a notification - đơn giản: tạo document và xong
  const createNotification = async (toUserId, type, data) => {
    try {
      // Không gửi thông báo cho chính mình
      if (data.fromUserId === toUserId) return { success: true }

      await addDoc(collection(db, 'notifications'), {
        toUserId,
        type,
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        fromUserAvatar: data.fromUserAvatar || '',
        postId: data.postId || null,
        message: data.message || null,
        read: false,
        createdAt: serverTimestamp()
      })
      return { success: true }
    } catch (error) {
      console.error('Error creating notification:', error)
      return { success: false, error: error.message }
    }
  }

  // Subscribe to notifications - đơn giản: dùng onSnapshot realtime
  const subscribeToNotifications = (userId) => {
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(q, 
      // Success: cập nhật notifications realtime
      (snapshot) => {
        const loadedNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }))
        notifications.value = loadedNotifications
        unreadCount.value = notifications.value.filter(n => !n.read).length
        console.log('Notifications loaded:', loadedNotifications.length)
        console.log('Message notifications:', loadedNotifications.filter(n => n.type === 'message').length)
        console.log('Other notifications:', loadedNotifications.filter(n => n.type !== 'message').length)
      },
      // Error: nếu thiếu index thì dùng query đơn giản
      (error) => {
        if (error.code === 'failed-precondition') {
          // Query đơn giản không cần index
          const simpleQ = query(
            collection(db, 'notifications'),
            where('toUserId', '==', userId)
          )
          return onSnapshot(simpleQ, (snapshot) => {
            const loadedNotifications = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date()
            })).sort((a, b) => b.createdAt - a.createdAt)
            notifications.value = loadedNotifications
            unreadCount.value = notifications.value.filter(n => !n.read).length
            console.log('Notifications loaded (fallback):', loadedNotifications.length)
            console.log('Message notifications:', loadedNotifications.filter(n => n.type === 'message').length)
            console.log('Other notifications:', loadedNotifications.filter(n => n.type !== 'message').length)
          })
        }
        notifications.value = []
        unreadCount.value = 0
      }
    )
  }

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId)
      await updateDoc(notificationRef, {
        read: true
      })
      return { success: true }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: error.message }
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async (userId) => {
    try {
      const unreadNotifications = notifications.value.filter(n => !n.read && n.toUserId === userId)
      
      await Promise.all(
        unreadNotifications.map(notification => 
          markAsRead(notification.id)
        )
      )
      
      return { success: true }
    } catch (error) {
      console.error('Error marking all as read:', error)
      return { success: false, error: error.message }
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId)
      await updateDoc(notificationRef, {
        read: true // Soft delete by marking as read and old
      })
      return { success: true }
    } catch (error) {
      console.error('Error deleting notification:', error)
      return { success: false, error: error.message }
    }
  }

  // Get notification message based on type
  const getNotificationMessage = (notification) => {
    const messages = {
      friend_request: `${notification.fromUserName} đã gửi lời mời kết bạn`,
      friend_accepted: `${notification.fromUserName} đã chấp nhận lời mời kết bạn`,
      message: `${notification.fromUserName} đã gửi tin nhắn: ${notification.message || ''}`,
      like: `${notification.fromUserName} đã thích bài viết của bạn`,
      comment: `${notification.fromUserName} đã bình luận: ${notification.message || ''}`,
      new_post: `${notification.fromUserName} đã đăng bài viết mới`
    }
    return messages[notification.type] || 'Bạn có thông báo mới'
  }

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      friend_request: 'users',
      friend_accepted: 'check',
      message: 'message',
      like: 'heart',
      comment: 'message',
      new_post: 'home'
    }
    return icons[type] || 'bell'
  }

  return {
    notifications,
    unreadCount,
    loading,
    messageNotifications,
    otherNotifications,
    unreadMessageCount,
    unreadOtherCount,
    createNotification,
    subscribeToNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationMessage,
    getNotificationIcon
  }
})

