<template>
  <!-- Chat Button (Floating) -->
  <div class="fixed bottom-6 right-6 z-50">
    <button
      v-if="!isOpen"
      @click="toggleChat"
      class="w-14 h-14 bg-system-blue text-white rounded-full shadow-apple-lg hover:shadow-apple-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      title="Tin nhắn"
    >
      <span class="text-2xl">💬</span>
      <span 
        v-if="unreadCount > 0" 
        class="absolute -top-1 -right-1 badge min-w-[20px] h-[20px] text-xs"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Chat Window -->
    <Transition name="slide-up">
      <div
        v-if="isOpen"
        class="w-96 h-[600px] bg-white rounded-2xl shadow-apple-xl border border-gray-100 flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="bg-white border-b border-gray-100 p-3 flex items-center justify-between flex-shrink-0">
          <h3 class="font-semibold text-gray-900 text-base">Tin nhắn</h3>
          <div class="flex items-center gap-1">
            <button
              v-if="viewMode === 'chat'"
              @click="viewMode = 'list'"
              class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
              title="Quay lại"
            >
              ←
            </button>
            <button
              @click="toggleChat"
              class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
              title="Đóng"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Conversations List -->
        <div v-if="viewMode === 'list'" class="flex-1 overflow-y-auto scrollbar-hide bg-white">
          <div v-if="messagesStore.loading" class="p-8 text-center">
            <div class="inline-block w-6 h-6 border-2 border-system-blue border-t-transparent rounded-full animate-spin mb-2"></div>
            <p class="text-sm text-gray-500">Đang tải...</p>
          </div>

          <div v-else-if="messagesStore.conversations.length === 0" class="p-8 text-center">
            <div class="text-4xl mb-2">💬</div>
            <p class="text-sm text-gray-500">Chưa có cuộc trò chuyện nào</p>
          </div>

          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="conversation in messagesStore.conversations"
              :key="conversation.id"
              @click="openChat(conversation.otherUser?.id || conversation.participants.find(id => id !== authStore.user?.uid))"
              class="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <img
                  v-if="conversation.otherUser?.avatar"
                  :src="conversation.otherUser.avatar"
                  :alt="conversation.otherUser.displayName"
                  class="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <img
                  v-else
                  src="/user.png"
                  :alt="conversation.otherUser?.displayName || 'User'"
                  class="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm text-gray-900 truncate">
                    {{ conversation.otherUser?.displayName || 'Người dùng' }}
                  </p>
                  <p class="text-xs text-gray-500 truncate mt-0.5">
                    {{ conversation.lastMessage || 'Chưa có tin nhắn' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat View -->
        <div v-else class="flex-1 flex flex-col min-h-0">
          <!-- Chat Header -->
          <div v-if="currentChatUser" class="p-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0 bg-white">
            <img
              v-if="currentChatUser.avatar"
              :src="currentChatUser.avatar"
              :alt="currentChatUser.displayName"
              class="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <img
              v-else
              src="/user.png"
              :alt="currentChatUser.displayName || 'User'"
              class="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-gray-900 truncate">
                {{ currentChatUser.displayName }}
              </p>
              <p class="text-xs text-gray-500 truncate">@{{ currentChatUser.username }}</p>
            </div>
          </div>

          <!-- Messages -->
          <div 
            ref="messagesContainer"
            class="flex-1 overflow-y-auto p-4 scrollbar-hide bg-gray-50"
            style="min-height: 0;"
          >
            <div v-if="messagesStore.loading && messagesStore.messages.length === 0" class="text-center py-8">
              <div class="inline-block w-6 h-6 border-2 border-system-blue border-t-transparent rounded-full animate-spin mb-2"></div>
              <p class="text-xs text-gray-500">Đang tải...</p>
            </div>

            <div v-else-if="messagesStore.messages.length === 0" class="text-center py-8">
              <div class="text-4xl mb-2">💭</div>
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
            <div v-if="selectedFiles.length > 0 && !showVoiceRecorder" class="p-2 border-t border-gray-100 bg-gray-50 flex-shrink-0">
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
                      class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm text-xs"
                      title="Xóa"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <!-- Video Preview -->
                  <div v-else-if="file.type === 'video' && file.preview" class="relative">
                    <video :src="file.preview" class="w-10 h-10 rounded object-cover border border-gray-200" muted></video>
                    <button
                      @click="removeFile(index)"
                      class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm text-xs"
                      title="Xóa"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <!-- Audio Preview -->
                  <div v-else-if="file.type === 'audio'" class="relative">
                    <div class="w-10 h-10 rounded bg-gray-200 flex items-center justify-center border border-gray-200">
                      <span class="text-lg">🎤</span>
                    </div>
                    <button
                      @click="removeFile(index)"
                      class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm text-xs"
                      title="Xóa"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <!-- File Preview -->
                  <div v-else-if="file.type === 'file'" class="relative">
                    <div class="w-10 h-10 rounded bg-gray-200 flex items-center justify-center border border-gray-200">
                      <span class="text-lg">📎</span>
                    </div>
                    <button
                      @click="removeFile(index)"
                      class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm text-xs"
                      title="Xóa"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Voice Recorder -->
          <Transition name="slide-down">
            <div v-if="showVoiceRecorder" class="p-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <VoiceRecorder @send="handleSendVoice" @cancel="showVoiceRecorder = false" />
            </div>
          </Transition>

          <!-- Message Input -->
          <div class="p-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div class="flex items-center gap-2 mb-2">
              <label class="cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Chọn ảnh">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  @change="handleFileSelect($event, 'image')"
                  class="hidden"
                />
                <span class="text-lg">📷</span>
              </label>
              <label class="cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Chọn video">
                <input
                  type="file"
                  accept="video/*"
                  @change="handleFileSelect($event, 'video')"
                  class="hidden"
                />
                <span class="text-lg">🎥</span>
              </label>
              <label class="cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Chọn file">
                <input
                  type="file"
                  @change="handleFileSelect($event, 'file')"
                  class="hidden"
                />
                <span class="text-lg">📎</span>
              </label>
              <button
                @click="showVoiceRecorder = !showVoiceRecorder"
                class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                :class="{ 'bg-gray-200': showVoiceRecorder }"
                title="Ghi âm"
              >
                <span class="text-lg">🎤</span>
              </button>
            </div>
            <form @submit.prevent="handleSendMessage" class="flex gap-2">
              <input
                v-model="messageContent"
                type="text"
                placeholder="Nhập tin nhắn..."
                class="input-field flex-1 text-sm py-2"
                :disabled="messagesStore.loading || uploading"
              />
              <button
                type="submit"
                :disabled="(!messageContent.trim() && selectedFiles.length === 0) || messagesStore.loading || uploading"
                class="btn-primary px-4 py-2 text-sm"
                :class="{ 'opacity-50 cursor-not-allowed': (!messageContent.trim() && selectedFiles.length === 0) || messagesStore.loading || uploading }"
              >
                <span v-if="messagesStore.loading || uploading" class="flex items-center gap-1">
                  <span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                </span>
                <span v-else>Gửi</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { useFriendsStore } from '@/stores/friends'
import { chatBus } from '@/utils/chatBus'
import { compressImage, compressVideo, fileToBase64, getFileType, formatFileSize, getFileIcon } from '@/utils/fileUtils'
import VoiceRecorder from '@/components/VoiceRecorder.vue'
import ChatMessage from '@/components/ChatMessage.vue'

const authStore = useAuthStore()
const messagesStore = useMessagesStore()
const friendsStore = useFriendsStore()

const isOpen = ref(false)
const viewMode = ref('list') // 'list' or 'chat'
const currentChatUserId = ref(null)
const currentChatUser = ref(null)
const messageContent = ref('')
const messagesContainer = ref(null)
const selectedFile = ref(null)
const showVoiceRecorder = ref(false)
let messagesUnsubscribe = null
let conversationsUnsubscribe = null

const unreadCount = computed(() => {
  // Count unread conversations (simplified - could be improved)
  return messagesStore.conversations.length
})

onMounted(() => {
  if (authStore.user) {
    conversationsUnsubscribe = messagesStore.subscribeToConversations(authStore.user.uid)
  }
  
  // Listen for open chat events
  chatBus.onOpenChat(handleOpenChatFromBus)
})

const handleOpenChatFromBus = (userId) => {
  isOpen.value = true
  openChat(userId)
}

onUnmounted(() => {
  if (messagesUnsubscribe) {
    messagesUnsubscribe()
  }
  if (conversationsUnsubscribe) {
    conversationsUnsubscribe()
  }
  
  // Remove chat bus listener
  chatBus.offOpenChat(handleOpenChatFromBus)
})

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    // Close chat when closing widget
    if (messagesUnsubscribe) {
      messagesUnsubscribe()
      messagesUnsubscribe = null
    }
    currentChatUserId.value = null
    currentChatUser.value = null
    viewMode.value = 'list'
  }
}

const openChat = async (userId) => {
  currentChatUserId.value = userId
  
  // Load user info
  currentChatUser.value = await friendsStore.getUserById(userId)
  
  // Mark messages as read when opening chat
  if (authStore.user && userId) {
    await messagesStore.markAsRead(authStore.user.uid, userId)
  }
  
  // Unsubscribe from previous messages
  if (messagesUnsubscribe) {
    messagesUnsubscribe()
  }
  
  // Subscribe to messages
  if (authStore.user && userId) {
    messagesUnsubscribe = messagesStore.subscribeToMessages(authStore.user.uid, userId)
    
    // Scroll to bottom after messages load
    watch(() => messagesStore.messages.length, () => {
      nextTick(() => {
        scrollToBottom()
      })
    }, { immediate: true })
  }
  
  viewMode.value = 'chat'
  messageContent.value = ''
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
  if ((!messageContent.value.trim() && selectedFiles.value.length === 0) || !currentChatUserId.value) return

  const content = messageContent.value
  const filesToSend = [...selectedFiles.value]

  // Clear inputs
  messageContent.value = ''
  const previousFiles = [...selectedFiles.value]
  selectedFiles.value = []

  try {
    // If multiple images, send each as a separate message
    if (filesToSend.length > 1 && filesToSend.every(f => f.type === 'image')) {
      // Send all images
      for (let i = 0; i < filesToSend.length; i++) {
        const fileData = filesToSend[i]
        const messageText = i === 0 ? content : '' // Only include text with first image
        
        const result = await messagesStore.sendMessage(
          authStore.user.uid,
          currentChatUserId.value,
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
        currentChatUserId.value,
        content,
        fileData
      )

      if (!result.success) {
        throw new Error(result.error || 'Gửi tin nhắn thất bại')
      }
    }
    
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error) {
    // Restore on error
    messageContent.value = content
    selectedFiles.value = previousFiles
    if (window.showToast) {
      window.showToast('Gửi tin nhắn thất bại', 'error', error.message || '', 3000)
    }
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}


// Watch for viewMode changes to reset chat
watch(() => viewMode.value, (newMode) => {
  if (newMode === 'list') {
    if (messagesUnsubscribe) {
      messagesUnsubscribe()
      messagesUnsubscribe = null
    }
    currentChatUserId.value = null
    currentChatUser.value = null
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(5px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>

