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
        class="flex-1 overflow-y-auto p-4 scrollbar-hide bg-gray-100 relative"
        style="min-height: 0;"
        @scroll="handleScroll"
      >
        <!-- Overlay when editing message -->
        <Transition name="fade">
          <div
            v-if="editingMessageId"
            class="absolute inset-0 bg-black/40 z-40 rounded-2xl"
            @click="cancelEditing"
          ></div>
        </Transition>
        
        <div class="relative z-50">
          <div v-if="loadingMessages && localMessages.length === 0" class="text-center py-8">
            <div class="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p class="text-xs text-gray-500">Đang tải...</p>
          </div>

          <div v-else-if="localMessages.length === 0" class="text-center py-8">
            <Icon name="message" :size="40" class="mx-auto mb-3 text-gray-400" />
            <p class="text-xs text-gray-500">Chưa có tin nhắn nào</p>
          </div>

          <TransitionGroup v-else name="list" tag="div">
            <ChatMessage
              v-for="(message, index) in localMessages"
              :key="message.id"
              :message="message"
              :previous-message="index > 0 ? localMessages[index - 1] : null"
              :next-message="index < localMessages.length - 1 ? localMessages[index + 1] : null"
              :other-user-id="props.otherUserId"
              :all-messages="localMessages"
              :class="editingMessageId && editingMessageId !== message.id ? 'opacity-30' : ''"
            />
          </TransitionGroup>
        </div>
      </div>

      <!-- File Preview -->
      <Transition name="slide-down">
        <div v-if="selectedFiles.length > 0 && !showVoiceRecorder" class="p-2 bg-white border-t border-gray-100">
          <TransitionGroup name="file-item" tag="div" class="flex flex-wrap gap-2">
            <!-- Multiple Files -->
            <div 
              v-for="(file, index) in selectedFiles" 
              :key="`file-${index}-${file.preview?.substring(0, 20) || file.type || Date.now()}`"
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
          </TransitionGroup>
        </div>
      </Transition>

      <!-- Voice Recorder -->
      <Transition name="slide-down">
        <div v-if="showVoiceRecorder" class="p-2 bg-white border-t border-gray-100 flex justify-end" @click.stop>
          <VoiceRecorder @send="handleSendVoice" @cancel="showVoiceRecorder = false" />
        </div>
      </Transition>

      <!-- Message Input -->
      <div v-if="!showVoiceRecorder" class="p-2 bg-white border-t border-gray-100 flex-shrink-0 relative" :class="editingMessageId ? 'z-50' : ''">
        <!-- Reply Preview -->
        <Transition name="slide-down">
          <div v-if="replyingToMessage" class="mb-2 p-2 bg-gray-50 rounded-lg border-l-4 border-blue-500 flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-700 mb-1">
                Trả lời {{ replyingToMessage.fromUserId === authStore.user?.uid ? 'bạn' : replyingToMessage.fromUserName }}
              </p>
              <p class="text-xs text-gray-500 truncate">
                {{ replyingToMessage.content || (replyingToMessage.fileType === 'image' ? '📷 Ảnh' : replyingToMessage.fileType === 'audio' ? '🎤 Ghi âm' : replyingToMessage.fileType === 'video' ? '🎥 Video' : replyingToMessage.fileType === 'file' ? '📎 File' : 'Tin nhắn') }}
              </p>
            </div>
            <button
              @click="replyingToMessage = null"
              class="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
              title="Hủy"
            >
              <Icon name="close" :size="14" class="text-gray-500" />
            </button>
          </div>
        </Transition>
        
        <!-- Editing Mode -->
        <div v-if="editingMessageId" class="space-y-2">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-gray-500 font-medium">Đang sửa tin nhắn</span>
          </div>
          <div class="flex gap-2 items-end">
            <textarea
              v-model="editingContent"
              class="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-300 text-sm resize-none transition-all duration-200"
              rows="3"
              @keydown.ctrl.enter="handleSaveEdit"
              @keydown.esc="cancelEditing"
              autofocus
            ></textarea>
            <button
              @click="cancelEditing"
              class="p-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              title="Hủy"
            >
              <Icon name="close" :size="16" />
            </button>
            <button
              @click="handleSaveEdit"
              class="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
              title="Gửi"
            >
              <Icon name="send" :size="16" />
            </button>
          </div>
        </div>
        
        <!-- Normal Input Mode -->
        <div v-else>
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
              type="button"
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
              :disabled="loadingMessages || uploading"
              @focus="markMessagesAsRead"
            />
            <button
              type="submit"
              :disabled="(!messageContent.trim() && selectedFiles.length === 0) || loadingMessages || uploading"
              class="px-3 py-2 bg-black text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Icon v-if="!loadingMessages && !uploading" name="send" :size="14" />
              <span v-else class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted, watch, nextTick } from 'vue'
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

// Provide openMenuMessageId to manage which message menu is open
const openMenuMessageId = ref(null)
provide('openMenuMessageId', openMenuMessageId)

// Provide editingMessageId and editingContent for message editing
const editingMessageId = ref(null)
const editingContent = ref('')
provide('editingMessageId', editingMessageId)
provide('editingContent', editingContent)
provide('setEditingMessage', (messageId, content) => {
  editingMessageId.value = messageId
  editingContent.value = content
})
const cancelEditing = () => {
  editingMessageId.value = null
  editingContent.value = ''
}
provide('cancelEditing', cancelEditing)

// Provide replyingToMessage for message reply
const replyingToMessage = ref(null)
provide('replyingToMessage', replyingToMessage)
provide('setReplyingToMessage', (message) => {
  replyingToMessage.value = message
})
provide('cancelReplying', () => {
  replyingToMessage.value = null
})

const otherUser = ref(null)
const messageContent = ref('')
const selectedFiles = ref([]) // Array to hold multiple files
const showVoiceRecorder = ref(false)
const uploading = ref(false)
const messagesContainer = ref(null)
const localMessages = ref([]) // Local messages state for this chat window
const loadingMessages = ref(false)
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

const handleSendVoice = async (voiceData) => {
  // Send voice message immediately
  if (!props.otherUserId) return
  
  showVoiceRecorder.value = false
  
  try {
    const result = await messagesStore.sendMessage(
      authStore.user.uid,
      props.otherUserId,
      '', // No text content for voice
      voiceData,
      null // No replyTo for voice messages
    )
    
    if (!result.success) {
      throw new Error(result.error || 'Gửi tin nhắn thất bại')
    }
    
    scrollToBottom()
  } catch (error) {
    alert(error.message || 'Gửi tin nhắn thất bại')
    // Reopen voice recorder on error
    showVoiceRecorder.value = true
  }
}

const handleSaveEdit = async () => {
  if (!editingMessageId.value || !editingContent.value.trim() || !props.otherUserId) {
    cancelEditing()
    return
  }
  
  const result = await messagesStore.editMessage(
    authStore.user.uid,
    props.otherUserId,
    editingMessageId.value,
    editingContent.value.trim()
  )
  
  if (result.success) {
    cancelEditing()
    if (window.showToast) {
      window.showToast('Đã sửa tin nhắn', 'success', '', 2000)
    }
  } else {
    alert(result.error || 'Không thể sửa tin nhắn')
  }
}

const handleSendMessage = async () => {
  if ((!messageContent.value.trim() && selectedFiles.value.length === 0) || !props.otherUserId) return

  const content = messageContent.value
  const filesToSend = [...selectedFiles.value]
  const replyToId = replyingToMessage.value?.id || null

  // Clear inputs
  messageContent.value = ''
  const previousFiles = [...selectedFiles.value]
  selectedFiles.value = []
  showVoiceRecorder.value = false
  replyingToMessage.value = null // Clear reply after sending

  try {
    // If multiple images, group them into messages of 9 images each
    if (filesToSend.length > 1 && filesToSend.every(f => f.type === 'image')) {
      // If there's text content, send it as a separate message first
      if (content && content.trim()) {
        const textResult = await messagesStore.sendMessage(
          authStore.user.uid,
          props.otherUserId,
          content,
          null, // No file, just text
          replyToId // Pass replyToId only for the first message
        )
        
        if (!textResult.success) {
          throw new Error(textResult.error || 'Gửi tin nhắn thất bại')
        }
      }
      
      // Group images into batches of 6
      const batchSize = 6
      for (let i = 0; i < filesToSend.length; i += batchSize) {
        const batch = filesToSend.slice(i, i + batchSize)
        const images = batch.map(f => f.data) // Extract base64 data
        
        const fileData = {
          type: 'images',
          images: images,
          count: images.length
        }
        
        // Send images without text (no replyTo for image-only messages)
        const result = await messagesStore.sendMessage(
          authStore.user.uid,
          props.otherUserId,
          '', // No text, just images
          fileData,
          null // No replyTo for image-only messages
        )
        
        if (!result.success) {
          throw new Error(result.error || 'Gửi tin nhắn thất bại')
        }
      }
    } else if (filesToSend.length === 1 && filesToSend[0].type === 'image') {
      // Single image - also separate text and image
      if (content && content.trim()) {
        const textResult = await messagesStore.sendMessage(
          authStore.user.uid,
          props.otherUserId,
          content,
          null, // No file, just text
          replyToId // Pass replyToId only for the first message
        )
        
        if (!textResult.success) {
          throw new Error(textResult.error || 'Gửi tin nhắn thất bại')
        }
      }
      
      // Send single image without text
      const fileData = filesToSend[0]
      const result = await messagesStore.sendMessage(
        authStore.user.uid,
        props.otherUserId,
        '', // No text, just image
        fileData,
        null // No replyTo for image-only messages
      )
      
      if (!result.success) {
        throw new Error(result.error || 'Gửi tin nhắn thất bại')
      }
    } else {
      // Single file or non-image file
      const fileData = filesToSend[0] || null
      const result = await messagesStore.sendMessage(
        authStore.user.uid,
        props.otherUserId,
        content,
        fileData,
        replyToId
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
    
    // Subscribe to messages and store in local state
    loadingMessages.value = true
    messagesUnsubscribe = messagesStore.subscribeToMessages(
      authStore.user.uid,
      props.otherUserId,
      (messages) => {
        // Callback to update local messages
        localMessages.value = messages
        loadingMessages.value = false
        scrollToBottom()
      }
    )
    
    // Watch for new messages to auto-scroll
    watch(() => localMessages.value.length, () => {
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

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

