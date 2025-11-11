<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100 p-3 flex items-center justify-between flex-shrink-0">
      <h3 class="font-semibold text-gray-900 text-base">Tin nhắn</h3>
      <button
        @click="$emit('close')"
        class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
        title="Đóng"
      >
        <Icon name="close" :size="18" />
      </button>
    </div>

    <!-- Conversations List -->
    <div class="flex-1 overflow-y-auto scrollbar-hide bg-white">
      <div v-if="messagesStore.loading" class="p-8 text-center">
        <div class="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p class="text-sm text-gray-500">Đang tải...</p>
      </div>

      <div v-else-if="messagesStore.conversations.length === 0" class="p-8 text-center">
        <Icon name="message" :size="40" class="mx-auto mb-3 text-gray-400" />
        <p class="text-sm text-gray-500">Chưa có cuộc trò chuyện nào</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="conv in messagesStore.conversations"
          :key="conv.id"
          @click="openChat(conv.otherUser?.id || conv.participants.find(id => id !== authStore.user?.uid))"
          class="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <img
              v-if="conv.otherUser?.avatar"
              :src="conv.otherUser.avatar"
              :alt="conv.otherUser.displayName"
              class="w-12 h-12 rounded-full object-cover"
            />
            <img
              v-else
              src="/user.png"
              :alt="conv.otherUser?.displayName || 'User'"
              class="w-12 h-12 rounded-full object-cover"
            />
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-gray-900 truncate">
                {{ conv.otherUser?.displayName || 'Người dùng' }}
              </p>
              <p class="text-xs text-gray-500 truncate">{{ conv.lastMessage || 'Chưa có tin nhắn' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat View - Removed, will open in floating window instead -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import Icon from '@/components/Icon.vue'
const emit = defineEmits(['close', 'openChat'])

const authStore = useAuthStore()
const messagesStore = useMessagesStore()

let conversationsUnsubscribe = null

const openChat = (userId) => {
  if (!userId) return
  emit('openChat', userId)
  emit('close') // Close popup when opening chat
}

onMounted(() => {
  if (authStore.user) {
    conversationsUnsubscribe = messagesStore.subscribeToConversations(authStore.user.uid)
  }
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

