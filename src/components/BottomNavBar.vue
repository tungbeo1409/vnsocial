<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
    <div class="max-w-4xl mx-auto px-1 py-1.5 flex items-center justify-around">
      <router-link 
        to="/" 
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 relative"
        :class="{ 'text-system-blue': route.path === '/' }"
      >
        <Icon name="home" :size="22" />
        <span class="text-[10px] font-medium">Trang chủ</span>
      </router-link>
      
      <router-link 
        to="/shorts" 
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        :class="{ 'text-system-blue': route.path === '/shorts' }"
      >
        <Icon name="play" :size="22" />
        <span class="text-[10px] font-medium">Video</span>
      </router-link>
      
      <router-link 
        to="/friends" 
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 relative"
        :class="{ 'text-system-blue': route.path === '/friends' }"
      >
        <Icon name="users" :size="22" />
        <span class="text-[10px] font-medium">Bạn bè</span>
        <span v-if="friendRequestsCount > 0" class="absolute top-0.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-semibold">
          {{ friendRequestsCount > 9 ? '9+' : friendRequestsCount }}
        </span>
      </router-link>
      
      <router-link 
        to="/messages" 
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 relative"
        :class="{ 'text-system-blue': route.path === '/messages' || route.path.startsWith('/chat/') }"
      >
        <Icon name="message" :size="22" />
        <span class="text-[10px] font-medium">Tin nhắn</span>
        <span v-if="unreadMessagesCount > 0" class="absolute top-0.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-semibold">
          {{ unreadMessagesCount > 9 ? '9+' : unreadMessagesCount }}
        </span>
      </router-link>
      
      <router-link
        :to="`/profile/${authStore.user?.uid}`"
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        :class="{ 'text-system-blue': route.path.startsWith('/profile') }"
      >
        <div class="w-5 h-5 rounded-full overflow-hidden">
          <img
            v-if="authStore.userProfile?.avatar"
            :src="authStore.userProfile.avatar"
            :alt="authStore.userProfile.displayName"
            class="w-full h-full object-cover"
          />
          <img
            v-else
            src="/user.png"
            alt="User"
            class="w-full h-full object-cover"
          />
        </div>
        <span class="text-[10px] font-medium">Cá nhân</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFriendsStore } from '@/stores/friends'
import { useMessagesStore } from '@/stores/messages'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const authStore = useAuthStore()
const friendsStore = useFriendsStore()
const messagesStore = useMessagesStore()

const friendRequestsCount = ref(0)
const unreadMessagesCount = ref(0)

const loadFriendRequestsCount = async () => {
  if (!authStore.user) return
  
  try {
    await friendsStore.loadFriendRequests()
    friendRequestsCount.value = friendsStore.friendRequests.length
  } catch (error) {
    console.error('Error loading friend requests:', error)
  }
}

let conversationsUnsubscribe = null

onMounted(() => {
  if (authStore.user) {
    loadFriendRequestsCount()
    
    conversationsUnsubscribe = messagesStore.subscribeToConversations(authStore.user.uid)
    
    // Watch for unreadMessagesCount changes from store
    watch(() => messagesStore.unreadMessagesCount, (newCount) => {
      unreadMessagesCount.value = newCount
    }, { immediate: true })
    
    // Watch for friend requests changes
    watch(() => friendsStore.friendRequests, () => {
      friendRequestsCount.value = friendsStore.friendRequests.length
    }, { deep: true })
  }
})

onUnmounted(() => {
  if (conversationsUnsubscribe) {
    conversationsUnsubscribe()
  }
})
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>

