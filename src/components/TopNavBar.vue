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
        <div class="relative">
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
        <NotificationBell />
        <router-link
          :to="`/profile/${authStore.user?.uid}`"
          class="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors group"
        >
          <img
            v-if="authStore.userProfile?.avatar"
            :src="authStore.userProfile.avatar"
            :alt="authStore.userProfile.displayName"
            class="w-8 h-8 rounded-full object-cover"
          />
          <img
            v-else
            src="/user.png"
            alt="User"
            class="w-8 h-8 rounded-full object-cover"
          />
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import NotificationBell from '@/components/NotificationBell.vue'
import ChatWidgetPopup from '@/components/ChatWidgetPopup.vue'
import Icon from '@/components/Icon.vue'
import { chatBus } from '@/utils/chatBus'

const router = useRouter()
const authStore = useAuthStore()
const messagesStore = useMessagesStore()

const searchQuery = ref('')
const showSearchSuggestions = ref(false)
const showChatPopup = ref(false)
const unreadMessagesCount = ref(0)

const toggleChatPopup = (event) => {
  event?.stopPropagation()
  showChatPopup.value = !showChatPopup.value
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

onMounted(() => {
  if (authStore.user) {
    conversationsUnsubscribe = messagesStore.subscribeToConversations(authStore.user.uid)
    
    // Watch for unreadMessagesCount changes from store
    watch(() => messagesStore.unreadMessagesCount, (newCount) => {
      unreadMessagesCount.value = newCount
    }, { immediate: true })
  }
})

onUnmounted(() => {
  if (conversationsUnsubscribe) {
    conversationsUnsubscribe()
  }
})

// Close chat popup when clicking outside
const handleClickOutside = (event) => {
  if (showChatPopup.value) {
    const popup = document.querySelector('.chat-popup-container')
    const button = event.target.closest('button[title="Tin nhắn"]')
    if (popup && !popup.contains(event.target) && !button) {
      showChatPopup.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

