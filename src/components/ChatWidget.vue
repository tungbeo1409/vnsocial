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
            class="flex-1 overflow-y-auto p-4 scrollbar-hide bg-gray-100 relative"
            style="min-height: 0;"
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
                  :other-user-id="currentChatUserId"
                  :all-messages="messagesStore.messages"
                  :class="editingMessageId && editingMessageId !== message.id ? 'opacity-30' : ''"
                />
              </TransitionGroup>
            </div>
          </div>

          <!-- File Preview -->
          <Transition name="slide-down">
            <div v-if="selectedFiles.length > 0 && !showVoiceRecorder" class="p-2 border-t border-gray-100 bg-gray-50 flex-shrink-0">
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
              </TransitionGroup>
            </div>
          </Transition>

          <!-- Voice Recorder -->
          <Transition name="slide-down">
            <div v-if="showVoiceRecorder" class="p-3 border-t border-gray-100 bg-gray-50 flex-shrink-0 flex justify-end">
              <VoiceRecorder @send="handleSendVoice" @cancel="showVoiceRecorder = false" />
            </div>
          </Transition>

          <!-- Message Input -->
          <div v-if="!showVoiceRecorder" class="p-3 border-t border-gray-100 bg-white flex-shrink-0 relative" :class="editingMessageId ? 'z-50' : ''">
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
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, provide, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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

const handleSendVoice = async (voiceData) => {
  // Send voice message immediately
  if (!currentChatUserId.value) return
  
  showVoiceRecorder.value = false
  
  try {
    const result = await messagesStore.sendMessage(
      authStore.user.uid,
      currentChatUserId.value,
      '', // No text content for voice
      voiceData,
      null // No replyTo for voice messages
    )
    
    if (!result.success) {
      throw new Error(result.error || 'Gửi tin nhắn thất bại')
    }
    
    // Reopen chat to show new message
    // The chat will auto-update via subscription
  } catch (error) {
    alert(error.message || 'Gửi tin nhắn thất bại')
    // Reopen voice recorder on error
    showVoiceRecorder.value = true
  }
}

const handleSaveEdit = async () => {
  if (!editingMessageId.value || !editingContent.value.trim() || !currentChatUserId.value) {
    cancelEditing()
    return
  }
  
  const result = await messagesStore.editMessage(
    authStore.user.uid,
    currentChatUserId.value,
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
  if ((!messageContent.value.trim() && selectedFiles.value.length === 0) || !currentChatUserId.value) return

  const content = messageContent.value
  const filesToSend = [...selectedFiles.value]
  const replyToId = replyingToMessage.value?.id || null

  // Clear inputs
  messageContent.value = ''
  const previousFiles = [...selectedFiles.value]
  selectedFiles.value = []
  replyingToMessage.value = null // Clear reply after sending

  try {
    // If multiple images, group them into messages of 9 images each
    if (filesToSend.length > 1 && filesToSend.every(f => f.type === 'image')) {
      // If there's text content, send it as a separate message first
      if (content && content.trim()) {
        const textResult = await messagesStore.sendMessage(
          authStore.user.uid,
          currentChatUserId.value,
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
          currentChatUserId.value,
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
          currentChatUserId.value,
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
        currentChatUserId.value,
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
        currentChatUserId.value,
        content,
        fileData,
        replyToId
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

