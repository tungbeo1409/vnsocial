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
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import Toast from '@/components/Toast.vue'
import FloatingChat from '@/components/FloatingChat.vue'
import { chatBus } from '@/utils/chatBus'

const authStore = useAuthStore()
const messagesStore = useMessagesStore()

const openChats = ref([]) // Array of { userId, autoOpen }
let unreadMessagesUnsubscribe = null

const openFloatingChat = (userId, options = {}) => {
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

// Handler khi có tin nhắn mới - tự động mở popup
const handleNewMessage = (fromUserId, message) => {
  // Kiểm tra xem chat đã mở chưa
  const existingChat = openChats.value.find(chat => chat.userId === fromUserId)
  if (!existingChat) {
    // Tự động mở popup chat với người gửi (autoOpen = true để không mark as read ngay)
    openFloatingChat(fromUserId, { autoOpen: true })
    console.log(`[App] Auto-opened chat with ${fromUserId} due to new message (unread mode)`)
  }
}

// Handler khi user click để mở chat (từ TopNavBar, ChatWidgetPopup, etc.)
const handleManualOpenChat = (userId) => {
  openFloatingChat(userId, { autoOpen: false }) // Không phải auto-open, mark as read ngay
}

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
})

onUnmounted(() => {
  chatBus.offOpenChat(handleManualOpenChat)
  
  // Unsubscribe from unread messages
  if (unreadMessagesUnsubscribe) {
    unreadMessagesUnsubscribe()
  }
})
</script>

