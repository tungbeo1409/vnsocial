<template>
  <div class="flex flex-col h-full">
    <!-- Chat Header -->
    <div v-if="otherUser" class="p-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0 bg-white">
      <img
        v-if="otherUser.avatar"
        :src="otherUser.avatar"
        :alt="otherUser.displayName"
        class="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
      <img
        v-else
        src="/user.png"
        :alt="otherUser.displayName || 'User'"
        class="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm text-gray-900 truncate">
          {{ otherUser.displayName }}
        </p>
        <p class="text-xs text-gray-500 truncate">@{{ otherUser.username }}</p>
      </div>
    </div>

    <!-- Messages -->
    <div 
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 scrollbar-hide bg-gray-50"
      style="min-height: 0;"
    >
      <div v-if="messagesStore.loading && messagesStore.messages.length === 0" class="text-center py-8">
        <div class="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p class="text-xs text-gray-500">Đang tải...</p>
      </div>

      <div v-else-if="messagesStore.messages.length === 0" class="text-center py-8">
        <Icon name="message" :size="40" class="mx-auto mb-3 text-gray-400" />
        <p class="text-xs text-gray-500">Chưa có tin nhắn nào</p>
      </div>

      <TransitionGroup v-else name="list" tag="div" class="space-y-2">
        <ChatMessage
          v-for="message in messagesStore.messages"
          :key="message.id"
          :message="message"
          :is-own-message="message.fromUserId === authStore.user?.uid"
        />
      </TransitionGroup>
    </div>

    <!-- Message Input -->
    <div class="p-3 bg-white border-t border-gray-100 flex-shrink-0">
      <form @submit.prevent="handleSendMessage" class="flex gap-2">
        <input
          v-model="messageContent"
          type="text"
          placeholder="Nhập tin nhắn..."
          class="flex-1 px-4 py-2 bg-gray-100 rounded-full border-0 focus:outline-none focus:ring-0 focus:bg-gray-200 transition-colors text-sm"
          :disabled="messagesStore.loading"
        />
        <button
          type="submit"
          :disabled="!messageContent.trim() || messagesStore.loading"
          class="px-4 py-2 bg-black text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="send" :size="16" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { useFriendsStore } from '@/stores/friends'
import ChatMessage from '@/components/ChatMessage.vue'
import Icon from '@/components/Icon.vue'

const props = defineProps({
  otherUserId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['back'])

const authStore = useAuthStore()
const messagesStore = useMessagesStore()
const friendsStore = useFriendsStore()

const otherUser = ref(null)
const messageContent = ref('')
const messagesContainer = ref(null)
let messagesUnsubscribe = null

const loadUser = async () => {
  if (props.otherUserId) {
    otherUser.value = await friendsStore.getUserById(props.otherUserId)
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    })
  }
}

const handleSendMessage = async () => {
  if (!messageContent.value.trim() || !props.otherUserId) return

  const result = await messagesStore.sendMessage(
    authStore.user.uid,
    props.otherUserId,
    messageContent.value.trim()
  )

  if (result.success) {
    messageContent.value = ''
    scrollToBottom()
  }
}

onMounted(async () => {
  await loadUser()
  
  if (authStore.user && props.otherUserId) {
    messagesUnsubscribe = messagesStore.subscribeToMessages(authStore.user.uid, props.otherUserId)
    
    watch(() => messagesStore.messages.length, () => {
      scrollToBottom()
    }, { immediate: true })
  }
})

onUnmounted(() => {
  if (messagesUnsubscribe) {
    messagesUnsubscribe()
  }
})
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

