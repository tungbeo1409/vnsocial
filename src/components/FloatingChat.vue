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

        <TransitionGroup v-else name="list" tag="div">
          <ChatMessage
            v-for="(message, index) in messagesStore.messages"
            :key="message.id"
            :message="message"
            :previous-message="index > 0 ? messagesStore.messages[index - 1] : null"
            :next-message="index < messagesStore.messages.length - 1 ? messagesStore.messages[index + 1] : null"
          />
        </TransitionGroup>
      </div>

      <!-- File Preview -->
      <Transition name="slide-down">
        <div v-if="selectedFiles.length > 0 && !showVoiceRecorder" class="p-2 bg-white border-t border-gray-100">
          <div class="flex flex-wrap gap-2">
            <!-- Multiple Files -->
            <div 
              v-for="(file, index) in selectedFiles" 
              :key="index"
              class="relative group"
            >
              <div v-if="file.type === 'image' && file.preview" class="relative">
                <img :src="file.preview" alt="Preview" class="w-10 h-10 rounded object-cover border border-gray-200" />
                <button
                  @click="removeFile(index)"
                  class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                  title="Xóa"
                >
                  <Icon name="close" :size="8" />
                </button>
              </div>
              
              <!-- Video Preview -->
              <div v-else-if="file.type === 'video' && file.preview" class="relative">
                <video :src="file.preview" class="w-10 h-10 rounded object-cover border border-gray-200" muted></video>
                <button
                  @click="removeFile(index)"
                  class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                  title="Xóa"
                >
                  <Icon name="close" :size="8" />
                </button>
              </div>
              
              <!-- Audio Preview -->
              <div v-else-if="file.type === 'audio'" class="relative">
                <div class="w-10 h-10 rounded bg-gray-200 flex items-center justify-center border border-gray-200">
                  <Icon name="microphone" :size="14" class="text-gray-600" />
                </div>
                <button
                  @click="removeFile(index)"
                  class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                  title="Xóa"
                >
                  <Icon name="close" :size="8" />
                </button>
              </div>
              
              <!-- File Preview -->
              <div v-else-if="file.type === 'file'" class="relative">
                <div class="w-10 h-10 rounded bg-gray-200 flex items-center justify-center border border-gray-200">
                  <Icon name="attachment" :size="14" class="text-gray-600" />
                </div>
                <button
                  @click="removeFile(index)"
                  class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                  title="Xóa"
                >
                  <Icon name="close" :size="8" />
                </button>
              </div>
            </div>
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
              multiple
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
            :disabled="(!messageContent.trim() && selectedFiles.length === 0) || messagesStore.loading || uploading"
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
const selectedFiles = ref([]) // Array to hold multiple files
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
  const files = Array.from(event.target.files)
  if (!files || files.length === 0) return

  try {
    uploading.value = true
    
    // Only allow multiple images
    if (fileType === 'image') {
      for (const file of files) {
        let base64Data = null
        let preview = null

        base64Data = await compressImage(file)
        preview = base64Data

        // Check size (Firestore limit ~1MB per field, base64 is ~33% larger)
        if (base64Data.length > 750 * 1024) {
          alert(`File "${file.name}" quá lớn sau khi nén. Vui lòng chọn file nhỏ hơn.`)
          continue
        }

        selectedFiles.value.push({
          type: fileType,
          data: base64Data,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          preview: preview
        })
      }
    } else {
      // For video, audio, file - only allow single file
      const file = files[0]
      let base64Data = null
      let preview = null

      if (fileType === 'video') {
        base64Data = await compressVideo(file)
        preview = base64Data
      } else {
        base64Data = await fileToBase64(file)
        preview = null
      }

      // Check size
      if (base64Data.length > 750 * 1024) {
        alert('File quá lớn sau khi nén. Vui lòng chọn file nhỏ hơn.')
        event.target.value = ''
        return
      }

      // Clear other files and add this one
      selectedFiles.value = [{
        type: fileType,
        data: base64Data,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        preview: preview
      }]
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

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const handleSendVoice = (voiceData) => {
  // Clear other files and add voice recording
  selectedFiles.value = [voiceData]
  showVoiceRecorder.value = false
}

const handleSendMessage = async () => {
  if ((!messageContent.value.trim() && selectedFiles.value.length === 0) || !props.otherUserId) return

  const content = messageContent.value
  const filesToSend = [...selectedFiles.value]

  // Clear inputs
  messageContent.value = ''
  const previousFiles = [...selectedFiles.value]
  selectedFiles.value = []
  showVoiceRecorder.value = false

  try {
    // If multiple images, send each as a separate message
    if (filesToSend.length > 1 && filesToSend.every(f => f.type === 'image')) {
      // Send all images
      for (let i = 0; i < filesToSend.length; i++) {
        const fileData = filesToSend[i]
        const messageText = i === 0 ? content : '' // Only include text with first image
        
        const result = await messagesStore.sendMessage(
          authStore.user.uid,
          props.otherUserId,
          messageText,
          fileData
        )
        
        if (!result.success) {
          throw new Error(result.error || 'Gửi tin nhắn thất bại')
        }
      }
    } else {
      // Single file or non-image file
      const fileData = filesToSend[0] || null
      const result = await messagesStore.sendMessage(
        authStore.user.uid,
        props.otherUserId,
        content,
        fileData
      )

      if (!result.success) {
        throw new Error(result.error || 'Gửi tin nhắn thất bại')
      }
    }
    
    scrollToBottom()
  } catch (error) {
    // Restore on error
    messageContent.value = content
    selectedFiles.value = previousFiles
    alert(error.message || 'Gửi tin nhắn thất bại')
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
    // Mark as read immediately when opening chat (if not auto-open)
    if (!props.autoOpen) {
      await messagesStore.markAsRead(authStore.user.uid, props.otherUserId)
      hasMarkedAsRead.value = true
    } else {
      // Nếu auto-open, mark as read sau 3 giây (để user có thời gian thấy tin nhắn)
      setTimeout(async () => {
        await messagesStore.markAsRead(authStore.user.uid, props.otherUserId)
        hasMarkedAsRead.value = true
      }, 3000)
    }
    
    // Subscribe to messages
    messagesUnsubscribe = messagesStore.subscribeToMessages(
      authStore.user.uid,
      props.otherUserId
    )
    
    // Watch for new messages to auto-scroll
    watch(() => messagesStore.messages.length, () => {
      scrollToBottom()
    }, { immediate: true })
  }
})

onUnmounted(async () => {
  // Mark as read when closing chat (if not already marked)
  if (authStore.user && props.otherUserId && !hasMarkedAsRead.value) {
    await messagesStore.markAsRead(authStore.user.uid, props.otherUserId)
  }
  
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

