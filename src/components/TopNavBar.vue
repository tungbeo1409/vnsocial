<template>
  <header class="page-header">
    <div class="page-header-content">
      <!-- Left Side: Logo + Search -->
      <div class="flex items-center gap-3 flex-1">
        <router-link to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
          <img 
            src="/logo.png" 
            alt="VN Social Logo" 
            class="w-8 h-8 object-contain"
          />
          <h1 class="page-title">
            VN Social
          </h1>
        </router-link>
        
        <!-- Search Input -->
        <div class="relative flex-1 max-w-xs">
          <input
            v-model="searchQuery"
            @keydown.enter="handleSearch"
            @focus="showSearchSuggestions = true"
            type="text"
            placeholder="Tìm kiếm..."
            class="input-search"
          />
          <Icon name="search" :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>
      
      <!-- Right Side: Icons -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <div v-if="showMessageButton" class="relative" ref="chatButtonContainerRef">
          <button
            @click.stop="toggleChatPopup"
            class="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700 relative"
            title="Tin nhắn"
          >
            <Icon name="message" :size="22" />
            <span v-if="unreadMessagesCount > 0" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-semibold">
              {{ unreadMessagesCount > 9 ? '9+' : unreadMessagesCount }}
            </span>
          </button>
          
          <!-- Chat Popup -->
          <Transition name="slide-down">
            <div
              v-if="showChatPopup"
              ref="chatPopupRef"
              @click.stop
              class="chat-popup-container absolute right-0 top-full mt-2 w-96 h-[600px] bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden z-50"
            >
              <ChatWidgetPopup 
                @close="showChatPopup = false" 
                @openChat="handleOpenChat"
              />
            </div>
          </Transition>
        </div>
        <NotificationBell ref="notificationBellRef" />
        
        <!-- User Menu -->
        <div class="relative" ref="userMenuContainerRef">
          <button
            @click.stop="toggleUserMenu"
            class="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors group"
            title="Menu người dùng"
          >
            <img
              v-if="authStore.userProfile?.avatar"
              :src="authStore.userProfile.avatar"
              :alt="authStore.userProfile.displayName"
              class="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-gray-200 transition-all"
            />
            <img
              v-else
              src="/user.png"
              alt="User"
              class="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-gray-200 transition-all"
            />
          </button>
          
          <!-- User Menu Dropdown -->
          <Transition name="slide-down">
            <div
              v-if="showUserMenu"
              @click.stop
              class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
            >
              <!-- Profile Link -->
              <router-link
                :to="`/profile/${authStore.user?.uid}`"
                @click="showUserMenu = false"
                class="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <Icon name="user" :size="18" />
                <span>Trang cá nhân</span>
              </router-link>
              
              <div class="border-t border-gray-100 my-1"></div>
              
              <!-- Dark Mode Toggle -->
              <button
                @click="toggleDarkMode"
                class="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between gap-3 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <Icon :name="isDarkMode ? 'sun' : 'moon'" :size="18" />
                  <span>{{ isDarkMode ? 'Chế độ sáng' : 'Chế độ tối' }}</span>
                </div>
                <div class="w-10 h-6 rounded-full relative transition-colors duration-200" :class="isDarkMode ? 'bg-blue-500' : 'bg-gray-300'">
                  <div class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200" :class="isDarkMode ? 'translate-x-4' : 'translate-x-0'"></div>
                </div>
              </button>
              
              <!-- Settings (Placeholder) -->
              <button
                @click="handleSettings"
                class="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <Icon name="settings" :size="18" />
                <span>Cài đặt</span>
              </button>
              
              <div class="border-t border-gray-100 my-1"></div>
              
              <!-- Logout -->
              <button
                @click="handleLogout"
                class="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <Icon name="logout" :size="18" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import NotificationBell from '@/components/NotificationBell.vue'
import ChatWidgetPopup from '@/components/ChatWidgetPopup.vue'
import Icon from '@/components/Icon.vue'
import { chatBus } from '@/utils/chatBus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const messagesStore = useMessagesStore()

// Hide message button when on messages page
const showMessageButton = computed(() => {
  return !route.path.startsWith('/messages') && !route.path.startsWith('/chat/')
})

const searchQuery = ref('')
const showSearchSuggestions = ref(false)
const showChatPopup = ref(false)
const showUserMenu = ref(false)
const unreadMessagesCount = ref(0)
const notificationBellRef = ref(null)
const isDarkMode = ref(false)
const chatPopupRef = ref(null)
const chatButtonContainerRef = ref(null)
const userMenuContainerRef = ref(null)


const toggleChatPopup = (event) => {
  event?.stopPropagation()
  // Close notification popup if open
  if (notificationBellRef.value) {
    notificationBellRef.value.closeDropdown()
  }
  // Close user menu if open
  showUserMenu.value = false
  showChatPopup.value = !showChatPopup.value
}

const toggleUserMenu = (event) => {
  event?.stopPropagation()
  // Close chat popup if open
  showChatPopup.value = false
  // Close notification popup if open
  if (notificationBellRef.value) {
    notificationBellRef.value.closeDropdown()
  }
  showUserMenu.value = !showUserMenu.value
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  // Toggle dark mode class on html element
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('darkMode', 'true')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')
  }
}

const handleSettings = () => {
  showUserMenu.value = false
  // TODO: Navigate to settings page when implemented
  if (window.showToast) {
    window.showToast('Tính năng đang được phát triển', 'info', '', 2000)
  }
}

const handleLogout = async () => {
  showUserMenu.value = false
  
  if (window.showConfirm) {
    const confirmed = await window.showConfirm('Bạn có chắc chắn muốn đăng xuất?', {
      title: 'Đăng xuất',
      confirmText: 'Đăng xuất',
      cancelText: 'Hủy'
    })
    if (!confirmed) return
  }
  
  try {
    // Close chat popup before logout
    showChatPopup.value = false
    
    await authStore.logout()
    router.push('/login')
    if (window.showToast) {
      window.showToast('Đã đăng xuất thành công', 'success', '', 2000)
    }
  } catch (error) {
    console.error('Logout error:', error)
    if (window.showToast) {
      window.showToast('Đăng xuất thất bại', 'error', error.message || '', 3000)
    }
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
    searchQuery.value = ''
    showSearchSuggestions.value = false
  }
}

const handleOpenChat = (userId) => {
  showChatPopup.value = false
  // Use chatBus to open floating chat (works on all pages)
  chatBus.openChat(userId)
}

let conversationsUnsubscribe = null

const updateUnreadMessagesCount = () => {
  if (!authStore.user) return
  
  try {
    // Count unread messages from conversations
    const conversations = messagesStore.conversations
    let count = 0
    for (const conv of conversations) {
      if (conv.unreadCount && conv.unreadCount > 0) {
        count += conv.unreadCount
      }
    }
    unreadMessagesCount.value = count
  } catch (error) {
    console.error('Error updating unread messages count:', error)
  }
}

onMounted(() => {
  if (authStore.user) {
    conversationsUnsubscribe = messagesStore.subscribeToConversations(authStore.user.uid)
    
    // Watch conversations to calculate unread count
    watch(() => messagesStore.conversations, () => {
      updateUnreadMessagesCount()
    }, { deep: true, immediate: true })
  }
})

onUnmounted(() => {
  if (conversationsUnsubscribe) {
    conversationsUnsubscribe()
  }
})

// Close popups when clicking outside
const handleClickOutside = (event) => {
  // Close chat popup when clicking outside
  if (showChatPopup.value) {
    const clickedInsidePopup = chatPopupRef.value?.contains(event.target)
    const clickedInsideButton = chatButtonContainerRef.value?.contains(event.target)
    
    if (!clickedInsidePopup && !clickedInsideButton) {
      showChatPopup.value = false
    }
  }
  
  // Close user menu when clicking outside
  if (showUserMenu.value) {
    const clickedInsideMenu = userMenuContainerRef.value?.contains(event.target)
    
    if (!clickedInsideMenu) {
      showUserMenu.value = false
    }
  }
}

// Close chat popup when route changes to messages page
watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/messages') || newPath.startsWith('/chat/')) {
    showChatPopup.value = false
  }
}, { immediate: true })

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // Load dark mode preference from localStorage
  const darkModePreference = localStorage.getItem('darkMode')
  if (darkModePreference === 'true') {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

