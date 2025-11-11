<template>
  <div class="fixed z-50" :style="{ 
    bottom: '80px',
    right: `${16 + index * 340}px`
  }">
    <div class="w-80 h-[500px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden" style="max-width: calc(100vw - 32px);">
      <!-- Header -->
      <div class="bg-white border-b border-gray-100 p-3 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <img
            v-if="otherUser?.avatar"
            :src="otherUser.avatar"
            :alt="otherUser.displayName"
            class="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <img
            v-else
            src="/user.png"
            :alt="otherUser?.displayName || 'User'"
            class="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-gray-900 truncate">
              {{ otherUser?.displayName || 'Người dùng' }}
            </p>
            <p class="text-xs text-gray-500 truncate">@{{ otherUser?.username || '' }}</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 flex-shrink-0"
          title="Đóng"
        >
          <Icon name="close" :size="18" />
        </button>
      </div>

      <!-- Messages -->
      <div 
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-4 scrollbar-hide bg-gray-50"
        style="min-height: 0;"
        @scroll="handleScroll"
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

      <!-- File Preview -->
      <Transition name="slide-down">
        <div v-if="selectedFile" class="p-2 bg-white border-t border-gray-100">
          <div class="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
            <!-- Image Preview -->
            <div v-if="selectedFile.type === 'image' && selectedFile.preview" class="flex-shrink-0">
              <img :src="selectedFile.preview" alt="Preview" class="w-12 h-12 rounded object-cover" />
            </div>
            
            <!-- Video Preview -->
            <div v-else-if="selectedFile.type === 'video' && selectedFile.preview" class="flex-shrink-0">
              <video :src="selectedFile.preview" class="w-12 h-12 rounded object-cover" muted></video>
            </div>
            
            <!-- Audio Preview -->
            <div v-else-if="selectedFile.type === 'audio'" class="flex-shrink-0">
              <div class="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                <span class="text-lg">🎵</span>
              </div>
            </div>
            
            <!-- File Preview -->
            <div v-else-if="selectedFile.type === 'file'" class="flex-shrink-0">
              <div class="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                <span class="text-lg">{{ getFileIcon(selectedFile.filename, selectedFile.type) }}</span>
              </div>
            </div>
            
            <!-- File Info -->
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-900 truncate">{{ selectedFile.filename }}</p>
              <p v-if="selectedFile.size" class="text-[10px] text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            
            <!-- Remove Button -->
            <button
              @click="clearSelectedFile"
              class="p-1 rounded hover:bg-gray-200 transition-colors text-gray-600"
              title="Xóa"
            >
              <Icon name="close" :size="14" />
            </button>
          </div>
        </div>
      </Transition>

      <!-- Voice Recorder -->
      <Transition name="slide-down">
        <div v-if="showVoiceRecorder" class="p-2 bg-white border-t border-gray-100">
          <VoiceRecorder @send="handleSendVoice" @cancel="showVoiceRecorder = false" />
        </div>
      </Transition>

      <!-- Message Input -->
      <div class="p-2 bg-white border-t border-gray-100 flex-shrink-0">
        <!-- Action Buttons -->
        <div class="flex items-center gap-1 mb-1">
          <label class="cursor-pointer p-1.5 rounded hover:bg-gray-100 transition-colors" title="Chọn ảnh">
            <input
              type="file"
              accept="image/*"
              @change="handleFileSelect($event, 'image')"
              class="hidden"
            />
            <Icon name="photo" :size="16" class="text-gray-600" />
          </label>
          <label class="cursor-pointer p-1.5 rounded hover:bg-gray-100 transition-colors" title="Chọn video">
            <input
              type="file"
              accept="video/*"
              @change="handleFileSelect($event, 'video')"
              class="hidden"
            />
            <Icon name="video" :size="16" class="text-gray-600" />
          </label>
          <label class="cursor-pointer p-1.5 rounded hover:bg-gray-100 transition-colors" title="Chọn file">
            <input
              type="file"
              @change="handleFileSelect($event, 'file')"
              class="hidden"
            />
            <Icon name="attachment" :size="16" class="text-gray-600" />
          </label>
          <button
            @click="showVoiceRecorder = !showVoiceRecorder"
            class="p-1.5 rounded hover:bg-gray-100 transition-colors"
            :class="{ 'bg-gray-100': showVoiceRecorder }"
            title="Ghi âm"
          >
            <Icon name="microphone" :size="16" class="text-gray-600" />
          </button>
        </div>
        
        <form @submit.prevent="handleSendMessage" class="flex gap-2">
          <input
            v-model="messageContent"
            type="text"
            placeholder="Nhập tin nhắn..."
            class="flex-1 px-3 py-2 bg-gray-100 rounded-full border-0 focus:outline-none focus:ring-0 focus:bg-gray-200 transition-colors text-sm"
            :disabled="messagesStore.loading || uploading"
            @focus="markMessagesAsRead"
          />
          <button
            type="submit"
            :disabled="(!messageContent.trim() && !selectedFile) || messagesStore.loading || uploading"
            class="px-3 py-2 bg-black text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Icon v-if="!messagesStore.loading && !uploading" name="send" :size="14" />
            <span v-else class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { useFriendsStore } from '@/stores/friends'
import { compressImage, compressVideo, fileToBase64, formatFileSize, getFileIcon } from '@/utils/fileUtils'
import ChatMessage from '@/components/ChatMessage.vue'
import VoiceRecorder from '@/components/VoiceRecorder.vue'
import Icon from '@/components/Icon.vue'

const props = defineProps({
  otherUserId: {
    type: String,
    required: true
  },
  index: {
    type: Number,
    default: 0
  },
  autoOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const messagesStore = useMessagesStore()
const friendsStore = useFriendsStore()

const otherUser = ref(null)
const messageContent = ref('')
const selectedFile = ref(null)
const showVoiceRecorder = ref(false)
const uploading = ref(false)
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

// Handle scroll - mark as read when user scrolls to bottom
const handleScroll = () => {
  if (messagesContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    // Nếu scroll gần đến cuối (trong 100px), mark as read
    if (scrollHeight - scrollTop - clientHeight < 100) {
      markMessagesAsRead()
    }
  }
}

const handleFileSelect = async (event, fileType) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    uploading.value = true
    let base64Data = null
    let preview = null

    if (fileType === 'image') {
      base64Data = await compressImage(file)
      preview = base64Data
    } else if (fileType === 'video') {
      base64Data = await compressVideo(file)
      preview = base64Data
    } else {
      base64Data = await fileToBase64(file)
      preview = null
    }

    // Check size (Firestore limit ~1MB per field, base64 is ~33% larger)
    if (base64Data.length > 750 * 1024) {
      alert('File quá lớn sau khi nén. Vui lòng chọn file nhỏ hơn.')
      event.target.value = ''
      return
    }

    selectedFile.value = {
      type: fileType,
      data: base64Data,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      preview: preview
    }

    // Clear file input
    event.target.value = ''
  } catch (error) {
    console.error('Error processing file:', error)
    alert(error.message || 'Không thể xử lý file. Vui lòng thử lại.')
    event.target.value = ''
  } finally {
    uploading.value = false
  }
}

const clearSelectedFile = () => {
  selectedFile.value = null
}

const handleSendVoice = (voiceData) => {
  selectedFile.value = voiceData
  showVoiceRecorder.value = false
}

const handleSendMessage = async () => {
  if ((!messageContent.value.trim() && !selectedFile.value) || !props.otherUserId) return

  const content = messageContent.value
  const fileData = selectedFile.value

  // Clear inputs
  messageContent.value = ''
  selectedFile.value = null
  showVoiceRecorder.value = false

  const result = await messagesStore.sendMessage(
    authStore.user.uid,
    props.otherUserId,
    content,
    fileData
  )

  if (result.success) {
    scrollToBottom()
  } else {
    // Restore on error
    messageContent.value = content
    selectedFile.value = fileData
    alert(result.error || 'Gửi tin nhắn thất bại')
  }
}

// Ref để track xem đã mark as read chưa
const hasMarkedAsRead = ref(false)

// Mark as read khi user tương tác với chat
const markMessagesAsRead = async () => {
  if (!hasMarkedAsRead.value && authStore.user && props.otherUserId) {
    await messagesStore.markAsRead(authStore.user.uid, props.otherUserId)
    hasMarkedAsRead.value = true
  }
}

onMounted(async () => {
  await loadUser()
  
  if (authStore.user && props.otherUserId) {
    // Nếu KHÔNG phải auto-open (user click vào), mark as read ngay
    if (!props.autoOpen) {
      await markMessagesAsRead()
    } else {
      // Nếu auto-open, mark as read sau 3 giây (để user có thời gian thấy tin nhắn)
      setTimeout(() => {
        markMessagesAsRead()
      }, 3000)
    }
    
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

