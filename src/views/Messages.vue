<template>
  <div class="page-container pb-20">
    <!-- Top Navigation Bar -->
    <TopNavBar />

    <!-- Main Content -->
    <main class="page-main">
      <div class="card">
        <!-- Loading -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Đang tải...</p>
        </div>

        <!-- Conversations List -->
        <div v-else-if="messagesStore.conversations.length > 0" class="space-y-1">
          <TransitionGroup name="list" tag="div">
            <router-link
              v-for="conversation in messagesStore.conversations"
              :key="conversation.id"
              :to="`/chat/${conversation.otherUser?.id || conversation.participants.find(id => id !== authStore.user?.uid)}`"
              @click="handleConversationClick(conversation.otherUser?.id || conversation.participants.find(id => id !== authStore.user?.uid))"
              class="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 group animate-fade-in relative"
            >
              <div class="relative flex-shrink-0">
                <img
                  v-if="conversation.otherUser?.avatar"
                  :src="conversation.otherUser.avatar"
                  :alt="conversation.otherUser.displayName"
                  class="avatar-hover w-14 h-14"
                />
                <img
                  v-else
                  src="/user.png"
                  :alt="conversation.otherUser?.displayName || 'User'"
                  class="avatar-hover w-14 h-14"
                />
                <span 
                  v-if="conversation.unreadCount && conversation.unreadCount > 0" 
                  class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold"
                >
                  {{ conversation.unreadCount > 9 ? '9+' : conversation.unreadCount }}
                </span>
              </div>
              
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 truncate mb-0.5">
                  {{ conversation.otherUser?.displayName || 'Người dùng' }}
                </p>
                <p class="text-sm text-gray-500 truncate">
                  {{ conversation.lastMessage || 'Chưa có tin nhắn' }}
                </p>
              </div>
              
              <div class="text-xs text-gray-400 text-right flex-shrink-0">
                {{ formatTime(conversation.lastMessageTime) }}
              </div>
            </router-link>
          </TransitionGroup>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-state-icon">💬</div>
          <p class="empty-state-title">Chưa có cuộc trò chuyện nào</p>
          <p class="empty-state-description">Hãy tìm kiếm bạn bè và bắt đầu trò chuyện!</p>
          <router-link to="/search" class="btn-primary inline-block">
            Tìm kiếm bạn bè
          </router-link>
        </div>
      </div>
    </main>
    
    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'

const authStore = useAuthStore()
const messagesStore = useMessagesStore()

const loading = ref(true)
let unsubscribe = null

const handleConversationClick = async (userId) => {
  // Mark messages as read when clicking on conversation
  if (authStore.user && userId) {
    await messagesStore.markAsRead(authStore.user.uid, userId)
  }
}

onMounted(() => {
  if (authStore.user) {
    unsubscribe = messagesStore.subscribeToConversations(authStore.user.uid)
    // Set loading to false after conversations load
    let unwatch = null
    unwatch = watch(() => messagesStore.conversations.length, () => {
      loading.value = false
      if (unwatch) {
        unwatch()
      }
    }, { immediate: true })
    
    // Fallback: set loading to false after timeout
    setTimeout(() => {
      loading.value = false
    }, 2000)
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

const formatTime = (date) => {
  if (!date) return ''
  
  const d = date instanceof Date ? date : date.toDate?.() || new Date()
  const now = new Date()
  const diff = now - d
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`
  
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit'
  })
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>

