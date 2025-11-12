<template>
  <router-view />
  
  <!-- Floating Chat Windows (available on all pages) -->
  <TransitionGroup name="chat-window" tag="div">
    <FloatingChat
      v-for="(chat, index) in openChats"
      :key="chat.userId"
      :other-user-id="chat.userId"
      :index="index"
      :auto-open="chat.autoOpen || false"
      @close="closeFloatingChat(chat.userId)"
    />
  </TransitionGroup>
  
  <Toast />
  <Confirm />
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import Toast from '@/components/Toast.vue'
import Confirm from '@/components/Confirm.vue'
import FloatingChat from '@/components/FloatingChat.vue'
import { chatBus } from '@/utils/chatBus'

const route = useRoute()
const authStore = useAuthStore()
const messagesStore = useMessagesStore()

const openChats = ref([]) // Array of { userId, autoOpen }
let unreadMessagesUnsubscribe = null

// Check if current route is messages page
const isMessagesPage = () => {
  return route.path.startsWith('/messages') || route.path.startsWith('/chat/')
}

const openFloatingChat = (userId, options = {}) => {
  // Don't open popup if on messages page
  if (isMessagesPage()) {
    return
  }
  
  // Check if chat is already open
  const existingChat = openChats.value.find(chat => chat.userId === userId)
  if (!existingChat) {
    // Store chat with options
    openChats.value.push({
      userId,
      autoOpen: options.autoOpen || false
    })
  }
}

const closeFloatingChat = (userId) => {
  openChats.value = openChats.value.filter(chat => chat.userId !== userId)
}

// Close all floating chats
const closeAllFloatingChats = () => {
  openChats.value = []
}

// Play notification sound when new message arrives
const playMessageSound = () => {
  try {
    const audio = new Audio('/audio/ring_mess.mp3')
    audio.volume = 0.5 // Set volume to 50%
    audio.play().catch(err => {
      // Silently handle autoplay restrictions
      console.warn('Could not play message sound:', err.message)
    })
  } catch (error) {
    console.warn('Error playing message sound:', error.message)
  }
}

// Handler khi có tin nhắn mới - tự động mở popup
const handleNewMessage = (fromUserId, message) => {
  // Kiểm tra xem tin nhắn có thực sự chưa đọc không
  // VÀ không phải tin nhắn do chính mình gửi (tránh phát âm thanh khi gửi tin nhắn)
  if (message && message.read === false && message.toUserId === authStore.user?.uid && message.fromUserId !== authStore.user?.uid) {
    // Kiểm tra xem user có đang xem chat với người gửi không
    const isViewingThisChat = route.path === `/chat/${fromUserId}`
    
    // Kiểm tra xem có floating chat đang mở với người gửi không
    const hasFloatingChatOpen = openChats.value.some(chat => chat.userId === fromUserId)
    
    // Chỉ phát âm thanh nếu:
    // 1. Không đang xem chat với người gửi trong route
    // 2. Không có floating chat đang mở (hoặc có nhưng đang ở trang khác)
    // 3. Không phát âm thanh khi gửi tin nhắn (đã check ở trên)
    if (!isViewingThisChat) {
      playMessageSound()
    }
    
    // Don't auto-open popup if on messages page
    if (isMessagesPage()) {
      return
    }
    
    // Kiểm tra xem chat đã mở chưa
    if (!hasFloatingChatOpen) {
      // Tự động mở popup chat với người gửi (autoOpen = true để không mark as read ngay)
      openFloatingChat(fromUserId, { autoOpen: true })
      console.log(`[App] Auto-opened chat with ${fromUserId} due to new unread message`)
    }
  }
}

// Handler khi user click để mở chat (từ TopNavBar, ChatWidgetPopup, etc.)
const handleManualOpenChat = (userId) => {
  // Don't open popup if on messages page
  if (isMessagesPage()) {
    return
  }
  
  openFloatingChat(userId, { autoOpen: false }) // Không phải auto-open, mark as read ngay
}

// Watch route changes to close popups when entering messages page
watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/messages') || newPath.startsWith('/chat/')) {
    // Close all floating chats when entering messages page
    closeAllFloatingChats()
  }
}, { immediate: true })

// Watch auth state - close all chats when user logs out
watch(() => authStore.user, (newUser, oldUser) => {
  if (!newUser && oldUser) {
    // User logged out - close all floating chats
    closeAllFloatingChats()
    // Unsubscribe from messages
    if (unreadMessagesUnsubscribe) {
      unreadMessagesUnsubscribe()
      unreadMessagesUnsubscribe = null
    }
  } else if (newUser && !oldUser) {
    // User logged in - subscribe to messages
    if (newUser) {
      unreadMessagesUnsubscribe = messagesStore.subscribeToUnreadMessages(
        newUser.uid,
        handleNewMessage
      )
    }
  }
}, { immediate: false })

// Listen to chat bus for opening chats
onMounted(() => {
  chatBus.onOpenChat(handleManualOpenChat)
  
  // Subscribe to unread messages để detect tin nhắn mới
  if (authStore.user) {
    unreadMessagesUnsubscribe = messagesStore.subscribeToUnreadMessages(
      authStore.user.uid,
      handleNewMessage
    )
  }
  
  // Close all popups if already on messages page
  if (isMessagesPage()) {
    closeAllFloatingChats()
  }
})

onUnmounted(() => {
  chatBus.offOpenChat(handleManualOpenChat)
  
  // Unsubscribe from unread messages
  if (unreadMessagesUnsubscribe) {
    unreadMessagesUnsubscribe()
  }
})
</script>

