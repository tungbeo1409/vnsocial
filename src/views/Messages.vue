<template>
  <div class="page-container" style="padding-bottom: 0;">
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

        <!-- Groups and Conversations List -->
        <div v-else-if="sortedItems.length > 0" class="space-y-1">
          <TransitionGroup name="list" tag="div">
            <router-link
              v-for="item in sortedItems"
              :key="item.id"
              :to="item.type === 'group' ? `/chat/group/${item.id}` : `/chat/${item.otherUser?.id || item.participants.find(id => id !== authStore.user?.uid)}`"
              @click="item.type === 'conversation' ? handleConversationClick(item.otherUser?.id || item.participants.find(id => id !== authStore.user?.uid)) : null"
              class="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 group animate-fade-in relative"
            >
              <div class="relative flex-shrink-0">
                <!-- Group Avatar -->
                <div v-if="item.type === 'group'" class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Icon name="users" :size="24" class="text-white" />
                </div>
                <!-- User Avatar -->
                <template v-else>
                  <img
                    v-if="item.otherUser?.avatar"
                    :src="item.otherUser.avatar"
                    :alt="item.otherUser.displayName"
                    class="avatar-hover w-14 h-14"
                  />
                  <img
                    v-else
                    src="/user.png"
                    :alt="item.otherUser?.displayName || 'User'"
                    class="avatar-hover w-14 h-14"
                  />
                  <span 
                    v-if="item.unreadCount && item.unreadCount > 0" 
                    class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold"
                  >
                    {{ item.unreadCount > 9 ? '9+' : item.unreadCount }}
                  </span>
                </template>
              </div>
              
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 truncate mb-0.5">
                  {{ item.type === 'group' ? (item.name || 'Nhóm chat') : (item.otherUser?.displayName || 'Người dùng') }}
                </p>
                <p class="text-sm text-gray-500 truncate">
                  {{ item.type === 'group' ? `${item.members?.length || 0} thành viên` : (item.lastMessage || 'Chưa có tin nhắn') }}
                </p>
              </div>
              
              <div class="text-xs text-gray-400 text-right flex-shrink-0">
                <span v-if="item.type === 'conversation'">{{ formatTime(item.lastMessageTime) }}</span>
                <Icon v-else name="chevronRight" :size="16" class="text-gray-400" />
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { useGroupsStore } from '@/stores/groups'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'
import Icon from '@/components/Icon.vue'

const authStore = useAuthStore()
const messagesStore = useMessagesStore()
const groupsStore = useGroupsStore()

const loading = ref(true)
const groups = ref([])
let unsubscribe = null

const loadGroups = async () => {
  if (!authStore.user) return
  
  try {
    const userGroups = await groupsStore.loadUserGroups(authStore.user.uid)
    groups.value = userGroups || []
  } catch (error) {
    console.error('Error loading groups:', error)
    groups.value = []
  }
}

// Combine and sort groups and conversations by lastMessageTime
const sortedItems = computed(() => {
  const items = []
  
  // Add groups
  groups.value.forEach(group => {
    items.push({
      ...group,
      type: 'group',
      lastMessageTime: group.lastMessageTime?.toDate?.() || group.lastMessageTime || new Date(0)
    })
  })
  
  // Add conversations
  messagesStore.conversations.forEach(conv => {
    items.push({
      ...conv,
      type: 'conversation',
      lastMessageTime: conv.lastMessageTime instanceof Date ? conv.lastMessageTime : (conv.lastMessageTime?.toDate?.() || new Date(0))
    })
  })
  
  // Sort by lastMessageTime (most recent first)
  items.sort((a, b) => {
    const timeA = a.lastMessageTime instanceof Date ? a.lastMessageTime : new Date(a.lastMessageTime)
    const timeB = b.lastMessageTime instanceof Date ? b.lastMessageTime : new Date(b.lastMessageTime)
    return timeB - timeA
  })
  
  return items
})

const handleConversationClick = async (userId) => {
  // Mark messages as read when clicking on conversation
  if (authStore.user && userId) {
    await messagesStore.markAsRead(authStore.user.uid, userId)
  }
}

onMounted(async () => {
  if (authStore.user) {
    unsubscribe = messagesStore.subscribeToConversations(authStore.user.uid)
    await loadGroups()
    
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

