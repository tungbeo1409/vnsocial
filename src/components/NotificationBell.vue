<template>
  <div class="relative">
    <button
      ref="buttonRef"
      @click="toggleDropdown"
      class="p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-700 relative"
      title="Thông báo"
    >
      <Icon name="bell" :size="22" />
      <span 
        v-if="notificationsStore.unreadOtherCount > 0" 
        class="badge absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px]"
      >
        {{ notificationsStore.unreadOtherCount > 9 ? '9+' : notificationsStore.unreadOtherCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition name="slide-down">
      <div
        v-if="showDropdown"
        ref="dropdownRef"
        @click.stop
        class="notification-dropdown absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-apple-lg border border-gray-100 overflow-hidden z-50 animate-scale-in"
      >
        <!-- Header -->
        <div class="p-4 border-b border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-900">Thông báo</h3>
            <button
              v-if="(activeTab === 'other' && notificationsStore.unreadOtherCount > 0) || (activeTab === 'messages' && notificationsStore.unreadMessageCount > 0)"
              @click="handleMarkAllRead"
              class="text-xs text-system-blue hover:text-blue-600 font-medium"
            >
              Đánh dấu đã đọc
            </button>
          </div>
          
          <!-- Tabs -->
          <div class="flex gap-2 border-b border-gray-200">
            <button
              @click="activeTab = 'other'"
              class="px-3 py-1.5 text-sm font-medium transition-colors relative"
              :class="activeTab === 'other' 
                ? 'text-system-blue border-b-2 border-system-blue' 
                : 'text-gray-600 hover:text-gray-900'"
            >
              Khác
              <span 
                v-if="notificationsStore.unreadOtherCount > 0" 
                class="ml-1.5 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] inline-block text-center"
              >
                {{ notificationsStore.unreadOtherCount > 9 ? '9+' : notificationsStore.unreadOtherCount }}
              </span>
            </button>
            <button
              @click="activeTab = 'messages'"
              class="px-3 py-1.5 text-sm font-medium transition-colors relative"
              :class="activeTab === 'messages' 
                ? 'text-system-blue border-b-2 border-system-blue' 
                : 'text-gray-600 hover:text-gray-900'"
            >
              Tin nhắn
              <span 
                v-if="notificationsStore.unreadMessageCount > 0" 
                class="ml-1.5 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] inline-block text-center"
              >
                {{ notificationsStore.unreadMessageCount > 9 ? '9+' : notificationsStore.unreadMessageCount }}
              </span>
            </button>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="max-h-96 overflow-y-auto scrollbar-hide">
          <div v-if="notificationsStore.loading" class="p-8 text-center">
            <div class="inline-block w-6 h-6 border-2 border-system-blue border-t-transparent rounded-full animate-spin mb-2"></div>
            <p class="text-sm text-gray-500">Đang tải...</p>
          </div>

          <!-- Other Notifications Tab -->
          <div v-else-if="activeTab === 'other'">
            <div v-if="notificationsStore.otherNotifications.length === 0" class="p-8 text-center">
              <Icon name="bell" :size="40" class="mx-auto mb-3 text-gray-400" />
              <p class="text-sm text-gray-500">Chưa có thông báo nào</p>
            </div>

            <TransitionGroup v-else name="list" tag="div">
              <div
                v-for="notification in notificationsStore.otherNotifications.slice(0, 10)"
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                class="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                :class="{ 'bg-blue-50': !notification.read }"
              >
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0">
                  <img
                    v-if="notification.fromUserAvatar"
                    :src="notification.fromUserAvatar"
                    :alt="notification.fromUserName"
                    class="avatar w-10 h-10"
                  />
                  <img
                    v-else
                    src="/user.png"
                    :alt="notification.fromUserName"
                    class="avatar w-10 h-10"
                  />
                </div>
                
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900 leading-relaxed">
                    <Icon 
                      :name="notificationsStore.getNotificationIcon(notification.type)" 
                      :size="16" 
                      class="inline-block mr-1.5 align-middle"
                    />
                    {{ notificationsStore.getNotificationMessage(notification) }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ formatTime(notification.createdAt) }}
                  </p>
                  
                  <!-- Group Invite Actions -->
                  <div v-if="notification.type === 'group_invite'" class="flex items-center gap-2 mt-2">
                    <button
                      @click.stop="handleAcceptGroupInvite(notification)"
                      class="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Chấp nhận
                    </button>
                    <button
                      @click.stop="handleRejectGroupInvite(notification)"
                      class="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>

                <div v-if="!notification.read && notification.type !== 'group_invite'" class="flex-shrink-0 w-2 h-2 bg-system-blue rounded-full mt-2"></div>
              </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- Message Notifications Tab -->
          <div v-else-if="activeTab === 'messages'">
            <div v-if="notificationsStore.messageNotifications.length === 0" class="p-8 text-center">
              <Icon name="message" :size="40" class="mx-auto mb-3 text-gray-400" />
              <p class="text-sm text-gray-500">Chưa có tin nhắn nào</p>
            </div>

            <TransitionGroup v-else name="list" tag="div">
              <div
                v-for="notification in notificationsStore.messageNotifications.slice(0, 10)"
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                class="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                :class="{ 'bg-blue-50': !notification.read }"
              >
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0">
                    <img
                      v-if="notification.fromUserAvatar"
                      :src="notification.fromUserAvatar"
                      :alt="notification.fromUserName"
                      class="avatar w-10 h-10"
                    />
                    <img
                      v-else
                      src="/user.png"
                      :alt="notification.fromUserName"
                      class="avatar w-10 h-10"
                    />
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900 leading-relaxed">
                      <Icon 
                        :name="notificationsStore.getNotificationIcon(notification.type)" 
                        :size="16" 
                        class="inline-block mr-1.5 align-middle"
                      />
                      {{ notificationsStore.getNotificationMessage(notification) }}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ formatTime(notification.createdAt) }}
                    </p>
                  </div>

                  <div v-if="!notification.read" class="flex-shrink-0 w-2 h-2 bg-system-blue rounded-full mt-2"></div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-gray-100 text-center">
          <router-link
            to="/notifications"
            @click="closeDropdown"
            class="text-sm text-system-blue hover:text-blue-600 font-medium"
          >
            Xem tất cả thông báo
          </router-link>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import { useGroupsStore } from '@/stores/groups'
import { useAuthStore } from '@/stores/auth'
import Icon from '@/components/Icon.vue'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const groupsStore = useGroupsStore()
const authStore = useAuthStore()

const showDropdown = ref(false)
const dropdownRef = ref(null)
const buttonRef = ref(null)
const activeTab = ref('other') // 'other' or 'messages'


const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

// Expose closeDropdown method for parent components
defineExpose({
  closeDropdown
})

const handleNotificationClick = async (notification) => {
  // Don't navigate for group_invite - user needs to accept/reject first
  if (notification.type === 'group_invite') {
    return
  }

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
  } else if (notification.type === 'group_member_joined') {
    // Navigate to group chat if groupId exists
    if (notification.groupId) {
      router.push(`/chat/group/${notification.groupId}`)
    }
  }

  closeDropdown()
}

const handleMarkAllRead = async () => {
  if (authStore.user) {
    // Mark all as read for current tab
    const notificationsToMark = activeTab.value === 'messages' 
      ? notificationsStore.messageNotifications.filter(n => !n.read)
      : notificationsStore.otherNotifications.filter(n => !n.read && n.type !== 'group_invite')
    
    await Promise.all(
      notificationsToMark.map(notification => 
        notificationsStore.markAsRead(notification.id)
      )
    )
  }
}

const handleAcceptGroupInvite = async (notification) => {
  if (!authStore.user || !notification.groupId) return

  try {
    const result = await groupsStore.acceptGroupInvite(authStore.user.uid, notification.groupId)
    
    if (result.success) {
      // Mark notification as read
      await notificationsStore.markAsRead(notification.id)
      
      if (window.showToast) {
        window.showToast('Đã tham gia nhóm thành công', 'success', '', 2000)
      }
      
      // Navigate to group chat
      router.push(`/chat/group/${notification.groupId}`)
      closeDropdown()
    } else {
      if (window.showToast) {
        window.showToast('Không thể tham gia nhóm', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error accepting group invite:', error)
    if (window.showToast) {
      window.showToast('Có lỗi xảy ra', 'error', error.message || '', 3000)
    }
  }
}

const handleRejectGroupInvite = async (notification) => {
  if (!authStore.user || !notification.groupId) return

  try {
    const result = await groupsStore.rejectGroupInvite(authStore.user.uid, notification.groupId)
    
    if (result.success) {
      // Mark notification as read
      await notificationsStore.markAsRead(notification.id)
      
      if (window.showToast) {
        window.showToast('Đã từ chối lời mời', 'info', '', 2000)
      }
      
      closeDropdown()
    } else {
      if (window.showToast) {
        window.showToast('Không thể từ chối lời mời', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error rejecting group invite:', error)
    if (window.showToast) {
      window.showToast('Có lỗi xảy ra', 'error', error.message || '', 3000)
    }
  }
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
    month: '2-digit'
  })
}

// Click outside handler - close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (!showDropdown.value) return
  
  const clickedInsideDropdown = dropdownRef.value?.contains(event.target)
  const clickedInsideButton = buttonRef.value?.contains(event.target)
  
  // Close if clicking outside both dropdown and button
  if (!clickedInsideDropdown && !clickedInsideButton) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease-out;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>

