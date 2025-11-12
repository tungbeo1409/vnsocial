<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100 p-3 flex items-center justify-between flex-shrink-0">
      <h3 class="font-semibold text-gray-900 text-base">Tin nhắn</h3>
      <div class="flex items-center gap-1">
        <button
          @click.stop="showCreateGroupModal = true"
          class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          title="Tạo nhóm"
        >
          <Icon name="plus" :size="18" />
        </button>
        <div class="relative">
          <button
            @click.stop="showMenu = !showMenu"
            class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            title="Tùy chọn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        
          <!-- Menu Dropdown -->
          <Transition name="slide-down">
            <div
              v-if="showMenu"
              ref="menuDropdownRef"
              @click.stop
              class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
            >
              <button
                @click="handleOpenInWebChat"
                class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Icon name="message" :size="16" class="text-gray-500" />
                <span>Mở trong web chat</span>
              </button>
              <!-- More options can be added here in the future -->
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Conversations List -->
    <div class="flex-1 overflow-y-auto scrollbar-hide bg-white">
      <div v-if="messagesStore.loading || groupsLoading" class="p-8 text-center">
        <div class="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p class="text-sm text-gray-500">Đang tải...</p>
      </div>

      <div v-else-if="sortedItems.length === 0" class="p-8 text-center">
        <Icon name="message" :size="40" class="mx-auto mb-3 text-gray-400" />
        <p class="text-sm text-gray-500">Chưa có cuộc trò chuyện nào</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="item in sortedItems"
          :key="item.id"
          @click="item.type === 'group' ? openGroupChat(item.id) : openChat(item.otherUser?.id || item.participants.find(id => id !== authStore.user?.uid))"
          class="p-3 hover:bg-gray-50 transition-colors cursor-pointer relative"
        >
          <div class="flex items-center gap-3">
            <div class="relative flex-shrink-0">
              <!-- Group Avatar -->
              <div v-if="item.type === 'group'" class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Icon name="users" :size="20" class="text-white" />
              </div>
              <!-- User Avatar -->
              <template v-else>
                <img
                  v-if="item.otherUser?.avatar"
                  :src="item.otherUser.avatar"
                  :alt="item.otherUser.displayName"
                  class="w-12 h-12 rounded-full object-cover"
                />
                <img
                  v-else
                  src="/user.png"
                  :alt="item.otherUser?.displayName || 'User'"
                  class="w-12 h-12 rounded-full object-cover"
                />
                <span 
                  v-if="item.unreadCount && item.unreadCount > 0" 
                  class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-semibold"
                >
                  {{ item.unreadCount > 9 ? '9+' : item.unreadCount }}
                </span>
              </template>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="font-semibold text-sm text-gray-900 truncate">
                  {{ item.type === 'group' ? (item.name || 'Nhóm chat') : (item.otherUser?.displayName || 'Người dùng') }}
                </p>
              </div>
              <p class="text-xs text-gray-500 truncate mt-0.5">
                {{ item.type === 'group' ? `${item.members?.length || 0} thành viên` : (item.lastMessage || 'Chưa có tin nhắn') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat View - Removed, will open in floating window instead -->
    
    <!-- Create Group Modal -->
    <CreateGroupModal 
      :show="showCreateGroupModal" 
      @close="showCreateGroupModal = false"
      @created="handleGroupCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { useGroupsStore } from '@/stores/groups'
import Icon from '@/components/Icon.vue'
import CreateGroupModal from '@/components/CreateGroupModal.vue'

const emit = defineEmits(['close', 'openChat'])

const router = useRouter()
const authStore = useAuthStore()
const messagesStore = useMessagesStore()
const groupsStore = useGroupsStore()

const showMenu = ref(false)
const menuDropdownRef = ref(null)
const groups = ref([])
const groupsLoading = ref(false)
const showCreateGroupModal = ref(false)
let conversationsUnsubscribe = null

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

const openChat = async (userId) => {
  if (!userId) return
  
  // Mark messages as read when opening chat
  if (authStore.user && userId) {
    await messagesStore.markAsRead(authStore.user.uid, userId)
  }
  
  emit('openChat', userId)
  emit('close') // Close popup when opening chat
}

const openGroupChat = (groupId) => {
  if (!groupId) return
  emit('close')
  router.push(`/chat/group/${groupId}`)
}

const loadGroups = async () => {
  if (!authStore.user) return
  
  groupsLoading.value = true
  try {
    const userGroups = await groupsStore.loadUserGroups(authStore.user.uid)
    groups.value = userGroups || []
  } catch (error) {
    console.error('Error loading groups:', error)
    groups.value = []
  } finally {
    groupsLoading.value = false
  }
}

const handleOpenInWebChat = () => {
  showMenu.value = false
  emit('close')
  router.push('/messages')
}

const handleGroupCreated = () => {
  showCreateGroupModal.value = false
  loadGroups()
}

// Close menu when clicking outside
const handleClickOutside = (event) => {
  if (showMenu.value) {
    // Check if click is inside the menu dropdown or button
    const menuButton = event.target.closest('button[title="Tùy chọn"]')
    const menuDropdown = menuDropdownRef.value?.contains(event.target)
    
    // Close if clicking outside both the menu and button
    if (!menuDropdown && !menuButton) {
      showMenu.value = false
    }
  }
}

onMounted(() => {
  if (authStore.user) {
    conversationsUnsubscribe = messagesStore.subscribeToConversations(authStore.user.uid)
    loadGroups()
  }
  
  // Watch for auth changes
  watch(() => authStore.user, (newUser) => {
    if (newUser) {
      loadGroups()
    } else {
      groups.value = []
    }
  })
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (conversationsUnsubscribe) {
    conversationsUnsubscribe()
  }
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
</style>

