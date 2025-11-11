<template>
  <div class="page-container pb-20 flex flex-col">
    <!-- Top Navigation Bar -->
    <TopNavBar />
    
    <!-- Chat Header -->
    <div class="sticky top-[73px] z-40 bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
        <router-link to="/messages" class="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
          <Icon name="arrowLeft" :size="20" class="text-gray-600" />
        </router-link>
        <div v-if="otherUser" class="flex items-center gap-3 flex-1">
          <img
            v-if="otherUser.avatar"
            :src="otherUser.avatar"
            :alt="otherUser.displayName"
            class="avatar w-10 h-10"
          />
          <img
            v-else
            src="/user.png"
            :alt="otherUser.displayName || 'User'"
            class="avatar w-10 h-10"
          />
          <div>
            <p class="font-semibold text-gray-900">{{ otherUser.displayName }}</p>
            <p class="text-xs text-gray-500">@{{ otherUser.username }}</p>
          </div>
        </div>
        <div v-else class="flex items-center gap-2 text-gray-500">
          <div class="loading-spinner w-4 h-4"></div>
          <span class="text-sm">Đang tải...</span>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div 
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-4 py-6 scroll-smooth scrollbar-hide bg-gray-50" 
      style="min-height: 0;"
    >
      <div class="max-w-4xl mx-auto">
        <div v-if="messagesStore.loading && messagesStore.messages.length === 0" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Đang tải tin nhắn...</p>
        </div>
        
        <div v-else-if="messagesStore.messages.length === 0" class="empty-state">
          <div class="empty-state-icon">💭</div>
          <p class="empty-state-title">Chưa có tin nhắn nào</p>
          <p class="empty-state-description">Hãy bắt đầu cuộc trò chuyện!</p>
        </div>
        
        <TransitionGroup v-else name="list" tag="div">
          <ChatMessage
            v-for="message in messagesStore.messages"
            :key="message.id"
            :message="message"
          />
        </TransitionGroup>
      </div>
    </div>

    <!-- File Preview -->
    <Transition name="slide-down">
      <div v-if="selectedFile" class="border-t border-gray-200 bg-white">
        <div class="max-w-4xl mx-auto px-4 py-3">
          <div class="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
            <!-- Image Preview -->
            <div v-if="selectedFile.type === 'image' && selectedFile.preview" class="flex-shrink-0">
              <img :src="selectedFile.preview" alt="Preview" class="w-16 h-16 rounded-lg object-cover" />
            </div>
            
            <!-- Video Preview -->
            <div v-else-if="selectedFile.type === 'video' && selectedFile.preview" class="flex-shrink-0">
              <video :src="selectedFile.preview" class="w-16 h-16 rounded-lg object-cover" muted></video>
            </div>
            
            <!-- Audio Preview -->
            <div v-else-if="selectedFile.type === 'audio'" class="flex-shrink-0">
              <div class="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                <span class="text-2xl">🎵</span>
              </div>
            </div>
            
            <!-- File Preview -->
            <div v-else-if="selectedFile.type === 'file'" class="flex-shrink-0">
              <div class="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                <span class="text-2xl">{{ getFileIcon(selectedFile.filename, selectedFile.type) }}</span>
              </div>
            </div>
            
            <!-- File Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ selectedFile.filename }}</p>
              <p v-if="selectedFile.size" class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            
            <!-- Remove Button -->
            <button
              @click="clearSelectedFile"
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              title="Xóa"
            >
              <Icon name="close" :size="18" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Voice Recorder -->
    <Transition name="slide-down">
      <div v-if="showVoiceRecorder" class="border-t border-gray-200 bg-white">
        <div class="max-w-4xl mx-auto px-4 py-3">
          <VoiceRecorder @send="handleSendVoice" @cancel="showVoiceRecorder = false" />
        </div>
      </div>
    </Transition>

    <!-- Message Input -->
    <div class="border-t border-gray-200 bg-white">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <!-- Action Buttons -->
        <div class="flex items-center gap-2 mb-2">
          <label class="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Chọn ảnh">
            <input
              type="file"
              accept="image/*"
              @change="handleFileSelect($event, 'image')"
              class="hidden"
            />
            <Icon name="photo" :size="20" class="text-gray-600" />
          </label>
          <label class="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Chọn video">
            <input
              type="file"
              accept="video/*"
              @change="handleFileSelect($event, 'video')"
              class="hidden"
            />
            <Icon name="video" :size="20" class="text-gray-600" />
          </label>
          <label class="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Chọn file">
            <input
              type="file"
              @change="handleFileSelect($event, 'file')"
              class="hidden"
            />
            <Icon name="attachment" :size="20" class="text-gray-600" />
          </label>
          <button
            @click="showVoiceRecorder = !showVoiceRecorder"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            :class="{ 'bg-gray-100': showVoiceRecorder }"
            title="Ghi âm"
          >
            <Icon name="microphone" :size="20" class="text-gray-600" />
          </button>
        </div>
        
        <form @submit.prevent="handleSendMessage" class="flex gap-3">
          <input
            v-model="messageContent"
            type="text"
            placeholder="Nhập tin nhắn..."
            class="input-field flex-1"
            :disabled="messagesStore.loading || uploading"
          />
          <button
            type="submit"
            :disabled="(!messageContent.trim() && !selectedFile) || messagesStore.loading || uploading"
            class="btn-primary px-6"
            :class="{ 'opacity-50 cursor-not-allowed': (!messageContent.trim() && !selectedFile) || messagesStore.loading || uploading }"
          >
            <span v-if="messagesStore.loading || uploading" class="flex items-center gap-2">
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            </span>
            <span v-else>Gửi</span>
          </button>
        </form>
      </div>
    </div>
    
    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { useFriendsStore } from '@/stores/friends'
import { compressImage, compressVideo, fileToBase64, formatFileSize, getFileIcon } from '@/utils/fileUtils'
import ChatMessage from '@/components/ChatMessage.vue'
import VoiceRecorder from '@/components/VoiceRecorder.vue'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const authStore = useAuthStore()
const messagesStore = useMessagesStore()
const friendsStore = useFriendsStore()

const otherUserId = ref(route.params.userId)
const otherUser = ref(null)
const messageContent = ref('')
const selectedFile = ref(null)
const showVoiceRecorder = ref(false)
const uploading = ref(false)
const messagesContainer = ref(null)
let unsubscribe = null
let messagesWatcher = null
let loadingWatcher = null
let routeWatcher = null
let previousMessagesLength = 0

const scrollToBottom = (smooth = false) => {
  if (messagesContainer.value) {
    nextTick(() => {
      if (smooth) {
        messagesContainer.value.scrollTo({
          top: messagesContainer.value.scrollHeight,
          behavior: 'smooth'
        })
      } else {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
}

const setupMessagesWatcher = () => {
  // Reset previous length when switching chats
  previousMessagesLength = 0
  
  // Cleanup previous watcher if exists
  if (messagesWatcher) {
    messagesWatcher()
  }
  
  // Watch for new messages (when length increases) and auto-scroll
  messagesWatcher = watch(
    () => messagesStore.messages.length,
    (newLength) => {
      // Only scroll if a new message was added (length increased)
      if (newLength > previousMessagesLength) {
        previousMessagesLength = newLength
        // Use setTimeout to ensure DOM is fully updated
        setTimeout(() => {
          scrollToBottom(true)
        }, 100)
      } else if (newLength < previousMessagesLength) {
        // Update previous length if messages were deleted
        previousMessagesLength = newLength
      }
    },
    { immediate: false }
  )
  
  // Initial scroll after messages load for this chat
  if (!messagesStore.loading && messagesStore.messages.length > 0) {
    previousMessagesLength = messagesStore.messages.length
    setTimeout(() => {
      scrollToBottom()
    }, 200)
  }
}

onMounted(async () => {
  // Load other user info
  otherUser.value = await friendsStore.getUserById(otherUserId.value)
  
  // Mark messages as read when opening chat
  await messagesStore.markAsRead(authStore.user.uid, otherUserId.value)
  
  // Subscribe to messages
  unsubscribe = messagesStore.subscribeToMessages(
    authStore.user.uid,
    otherUserId.value
  )
  
  // Setup messages watcher
  setupMessagesWatcher()
  
  // Watch for initial messages load
  loadingWatcher = watch(
    () => messagesStore.loading,
    (isLoading) => {
      if (!isLoading && messagesStore.messages.length > 0 && previousMessagesLength === 0) {
        previousMessagesLength = messagesStore.messages.length
        setTimeout(() => {
          scrollToBottom()
        }, 200)
      }
    },
    { immediate: true }
  )
  
  // Watch for route changes (when switching to different chat)
  routeWatcher = watch(
    () => route.params.userId,
    async (newUserId) => {
      if (newUserId && newUserId !== otherUserId.value) {
        otherUserId.value = newUserId
        otherUser.value = await friendsStore.getUserById(newUserId)
        
        // Mark messages as read when switching to different chat
        await messagesStore.markAsRead(authStore.user.uid, newUserId)
        
        // Unsubscribe from previous messages
        if (unsubscribe) {
          unsubscribe()
        }
        
        // Subscribe to new messages
        unsubscribe = messagesStore.subscribeToMessages(
          authStore.user.uid,
          newUserId
        )
        
        // Setup watcher for new chat
        setupMessagesWatcher()
      }
    }
  )
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  if (messagesWatcher) {
    messagesWatcher()
  }
  if (loadingWatcher) {
    loadingWatcher()
  }
  if (routeWatcher) {
    routeWatcher()
  }
})

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
  if ((!messageContent.value.trim() && !selectedFile.value)) return

  const content = messageContent.value
  const fileData = selectedFile.value

  // Clear inputs
  messageContent.value = ''
  selectedFile.value = null
  showVoiceRecorder.value = false

  const result = await messagesStore.sendMessage(
    authStore.user.uid,
    otherUserId.value,
    content,
    fileData
  )

  if (result.success) {
    // Show success notification
    if (window.showToast) {
      window.showToast('Đã gửi tin nhắn', 'success', '', 2000)
    }
    
    // Scroll to bottom after sending message
    setTimeout(() => {
      scrollToBottom(true)
    }, 150)
  } else {
    // Show error notification
    if (window.showToast) {
      window.showToast('Gửi tin nhắn thất bại', 'error', result.error || '', 4000)
    } else {
      alert(result.error || 'Gửi tin nhắn thất bại')
    }
    // Restore on error
    messageContent.value = content
    selectedFile.value = fileData
  }
}
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
