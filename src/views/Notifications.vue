<template>
  <div class="page-container pb-20">
    <!-- Top Navigation Bar -->
    <TopNavBar />
    
    <!-- Header with Tabs -->
    <div class="px-4 pt-2 pb-2 border-b border-gray-200 bg-white sticky top-[73px] z-30">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-bold text-gray-900">Thông báo</h1>
        <button
          v-if="(activeTab === 'other' && notificationsStore.unreadOtherCount > 0) || (activeTab === 'messages' && notificationsStore.unreadMessageCount > 0)"
          @click="handleMarkAllRead"
          class="btn-ghost text-xs"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>
      
      <!-- Tabs -->
      <div class="flex gap-4 border-b border-gray-200">
        <button
          @click="activeTab = 'other'"
          class="px-4 py-2 font-medium text-sm transition-colors relative"
          :class="activeTab === 'other' 
            ? 'text-system-blue border-b-2 border-system-blue' 
            : 'text-gray-600 hover:text-system-blue'"
        >
          Thông báo khác
          <span 
            v-if="notificationsStore.unreadOtherCount > 0" 
            class="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
          >
            {{ notificationsStore.unreadOtherCount > 9 ? '9+' : notificationsStore.unreadOtherCount }}
          </span>
        </button>
        <button
          @click="activeTab = 'messages'"
          class="px-4 py-2 font-medium text-sm transition-colors relative"
          :class="activeTab === 'messages' 
            ? 'text-system-blue border-b-2 border-system-blue' 
            : 'text-gray-600 hover:text-system-blue'"
        >
          Tin nhắn
          <span 
            v-if="notificationsStore.unreadMessageCount > 0" 
            class="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
          >
            {{ notificationsStore.unreadMessageCount > 9 ? '9+' : notificationsStore.unreadMessageCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <main class="page-main">
      <div class="card">
        <!-- Loading -->
        <div v-if="notificationsStore.loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Đang tải...</p>
        </div>

        <!-- Other Notifications Tab -->
        <div v-else-if="activeTab === 'other'">
          <div v-if="notificationsStore.otherNotifications.length === 0" class="empty-state">
            <div class="empty-state-icon">🔔</div>
            <p class="empty-state-title">Chưa có thông báo nào</p>
            <p class="empty-state-description">Bạn sẽ nhận được thông báo khi có hoạt động mới</p>
          </div>

          <div v-else class="space-y-1">
            <TransitionGroup name="list" tag="div">
              <div
                v-for="notification in notificationsStore.otherNotifications"
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                class="p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group animate-fade-in"
                :class="{ 'bg-blue-50/50': !notification.read }"
              >
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                  <img
                    v-if="notification.fromUserAvatar"
                    :src="notification.fromUserAvatar"
                    :alt="notification.fromUserName"
                    class="avatar-hover w-12 h-12"
                  />
                  <img
                    v-else
                    src="/user.png"
                    :alt="notification.fromUserName || 'User'"
                    class="avatar-hover w-12 h-12"
                  />
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                      <p class="text-sm text-gray-900 leading-relaxed">
                        <Icon 
                          :name="notificationsStore.getNotificationIcon(notification.type)" 
                          :size="16" 
                          class="inline-block mr-1.5 align-middle"
                        />
                        {{ notificationsStore.getNotificationMessage(notification) }}
                      </p>
                      <p class="text-xs text-gray-500 mt-1.5">
                        {{ formatTime(notification.createdAt) }}
                      </p>
                    </div>

                    <div class="flex items-center gap-2 flex-shrink-0">
                      <div v-if="!notification.read" class="w-2 h-2 bg-system-blue rounded-full"></div>
                      <button
                        @click.stop="handleDelete(notification.id)"
                        class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-system-red transition-opacity p-1"
                        title="Xóa"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
          </div>
        </div>

        <!-- Message Notifications Tab -->
        <div v-else-if="activeTab === 'messages'">
          <div v-if="notificationsStore.messageNotifications.length === 0" class="empty-state">
            <div class="empty-state-icon">💬</div>
            <p class="empty-state-title">Chưa có tin nhắn nào</p>
            <p class="empty-state-description">Bạn sẽ nhận được thông báo khi có tin nhắn mới</p>
          </div>

          <div v-else class="space-y-1">
            <TransitionGroup name="list" tag="div">
              <div
                v-for="notification in notificationsStore.messageNotifications"
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                class="p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group animate-fade-in"
                :class="{ 'bg-blue-50/50': !notification.read }"
              >
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0">
                    <img
                      v-if="notification.fromUserAvatar"
                      :src="notification.fromUserAvatar"
                      :alt="notification.fromUserName"
                      class="avatar-hover w-12 h-12"
                    />
                    <img
                      v-else
                      src="/user.png"
                      :alt="notification.fromUserName || 'User'"
                      class="avatar-hover w-12 h-12"
                    />
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1">
                        <p class="text-sm text-gray-900 leading-relaxed">
                          <Icon 
                            :name="notificationsStore.getNotificationIcon(notification.type)" 
                            :size="16" 
                            class="inline-block mr-1.5 align-middle"
                          />
                          {{ notificationsStore.getNotificationMessage(notification) }}
                        </p>
                        <p class="text-xs text-gray-500 mt-1.5">
                          {{ formatTime(notification.createdAt) }}
                        </p>
                      </div>

                      <div class="flex items-center gap-2 flex-shrink-0">
                        <div v-if="!notification.read" class="w-2 h-2 bg-system-blue rounded-full"></div>
                        <button
                          @click.stop="handleDelete(notification.id)"
                          class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-system-red transition-opacity p-1"
                          title="Xóa"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'
import Icon from '@/components/Icon.vue'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()

const activeTab = ref('other') // 'other' or 'messages'

let unsubscribe = null

onMounted(() => {
  if (authStore.user) {
    unsubscribe = notificationsStore.subscribeToNotifications(authStore.user.uid)
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

const handleNotificationClick = async (notification) => {
  // Mark as read
  if (!notification.read) {
    await notificationsStore.markAsRead(notification.id)
  }

  // Navigate based on type
  if (notification.type === 'friend_request' || notification.type === 'friend_accepted') {
    router.push(`/profile/${notification.fromUserId}`)
  } else if (notification.type === 'message') {
    router.push(`/chat/${notification.fromUserId}`)
  } else if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'new_post') {
    // Navigate to home page (posts are displayed there)
    router.push('/')
  }
}

const handleMarkAllRead = async () => {
  if (authStore.user) {
    // Mark all as read for current tab
    const notificationsToMark = activeTab.value === 'messages' 
      ? notificationsStore.messageNotifications.filter(n => !n.read)
      : notificationsStore.otherNotifications.filter(n => !n.read)
    
    await Promise.all(
      notificationsToMark.map(notification => 
        notificationsStore.markAsRead(notification.id)
      )
    )
  }
}

const handleDelete = async (notificationId) => {
  await notificationsStore.deleteNotification(notificationId)
}

const formatTime = (date) => {
  if (!date) return ''
  
  const d = date instanceof Date ? date : new Date(date)
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
    month: '2-digit',
    year: 'numeric'
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

