<template>
  <div class="page-container pb-20">
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
      class="overflow-y-auto px-4 py-6 scroll-smooth scrollbar-hide bg-gray-100 relative" 
      style="min-height: calc(100vh - 73px - 60px - 200px); padding-bottom: 200px;"
      @scroll="handleScroll"
    >
      <!-- Overlay when editing message -->
      <Transition name="fade">
        <div
          v-if="editingMessageId"
          class="absolute inset-0 bg-black/40 z-40"
          @click="cancelEditing"
        ></div>
      </Transition>
      
      <div class="max-w-4xl mx-auto relative" :class="editingMessageId ? 'z-50' : ''">
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
            v-for="(message, index) in messagesStore.messages"
            :key="message.id"
            :message="message"
            :previous-message="index > 0 ? messagesStore.messages[index - 1] : null"
            :next-message="index < messagesStore.messages.length - 1 ? messagesStore.messages[index + 1] : null"
            :other-user-id="otherUserId"
            :all-messages="messagesStore.messages"
            :class="editingMessageId && editingMessageId !== message.id ? 'opacity-30' : ''"
          />
        </TransitionGroup>
      </div>
    </div>

    <!-- Message Input - Fixed at bottom (above bottom nav bar) -->
    <div class="fixed bottom-20 left-0 right-0 flex justify-center px-4 py-3" :class="editingMessageId ? 'z-50' : 'z-30'">
      <div class="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        <!-- Voice Recorder -->
        <Transition name="slide-down">
          <div v-if="showVoiceRecorder" class="px-4 py-3 border-b border-gray-200 flex justify-end">
            <VoiceRecorder @send="handleSendVoice" @cancel="showVoiceRecorder = false" />
          </div>
        </Transition>

        <!-- File Preview -->
        <Transition name="slide-down">
          <div v-if="selectedFiles.length > 0 && !showVoiceRecorder" class="px-3 py-2 border-b border-gray-200">
            <div class="flex flex-wrap gap-2">
              <!-- Multiple Images -->
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

        <!-- Input Area -->
        <div v-if="!showVoiceRecorder" class="px-4 py-3">
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
          <div v-if="editingMessageId" class="space-y-3">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs text-gray-500 font-medium">Đang sửa tin nhắn</span>
            </div>
            <div class="flex gap-2 items-end">
              <textarea
                v-model="editingContent"
                class="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-300 text-sm resize-none transition-all duration-200"
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
                <Icon name="close" :size="18" />
              </button>
              <button
                @click="handleSaveEdit"
                class="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                title="Gửi"
              >
                <Icon name="send" :size="18" />
              </button>
            </div>
          </div>
          
          <!-- Normal Input Mode -->
          <div v-else>
            <!-- Action Buttons -->
            <div class="flex items-center gap-2 mb-2">
              <label class="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Chọn ảnh">
                <input
                  type="file"
                  accept="image/*"
                  multiple
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
            
            <form @submit.prevent="handleSendMessage" class="flex gap-2 items-center">
              <input
                v-model="messageContent"
                type="text"
                placeholder="Nhập tin nhắn..."
                class="input-field flex-1"
                :disabled="messagesStore.loading || uploading"
              />
              <button
                type="submit"
                :disabled="(!messageContent.trim() && selectedFiles.length === 0) || messagesStore.loading || uploading"
                class="p-2 rounded-lg transition-colors flex-shrink-0"
                :class="(!messageContent.trim() && selectedFiles.length === 0) || messagesStore.loading || uploading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-system-blue text-white hover:bg-blue-600'"
                title="Gửi"
              >
                <span v-if="messagesStore.loading || uploading" class="flex items-center">
                  <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                </span>
                <Icon v-else name="send" :size="20" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
const selectedFiles = ref([]) // Array to hold multiple files
const showVoiceRecorder = ref(false)
const uploading = ref(false)
const messagesContainer = ref(null)
let unsubscribe = null
let messagesWatcher = null
let routeWatcher = null
let isNearBottom = ref(true) // Track if user is near bottom of messages

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

const scrollToBottom = () => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      isNearBottom.value = true
    })
  }
}

// Handle scroll - mark as read when user scrolls to bottom (like popup chat)
const handleScroll = () => {
  if (messagesContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    
    // Track if user is near bottom (within 200px)
    isNearBottom.value = distanceFromBottom < 200
    
    // If scroll near bottom (within 100px), mark as read (fail silently)
    if (distanceFromBottom < 100) {
      if (authStore.user && otherUserId.value) {
        messagesStore.markAsRead(authStore.user.uid, otherUserId.value).catch(err => {
          // Silently handle - permissions issue will be handled in markAsRead function
          console.warn('Could not mark messages as read:', err.message)
        })
      }
    }
  }
}

onMounted(async () => {
  // Load other user info
  otherUser.value = await friendsStore.getUserById(otherUserId.value)
  
  // Mark messages as read when opening chat (don't wait for it, continue even if it fails)
  messagesStore.markAsRead(authStore.user.uid, otherUserId.value).catch(err => {
    // Silently handle - permissions issue will be handled in markAsRead function
    console.warn('Could not mark messages as read:', err.message)
  })
  
  // Subscribe to messages
  unsubscribe = messagesStore.subscribeToMessages(
    authStore.user.uid,
    otherUserId.value
  )
  
  // Watch for new messages to auto-scroll to bottom (like popup chat)
  // Only auto-scroll if user is near bottom or it's the first load
  messagesWatcher = watch(
    () => messagesStore.messages.length,
    (newLength, oldLength) => {
      // Add small delay to ensure DOM is updated
      setTimeout(() => {
        // Only auto-scroll if user is near bottom or this is the first load
        if (isNearBottom.value || oldLength === 0) {
          scrollToBottom()
        }
      }, 100)
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
        
        // Mark messages as read when switching to different chat (don't wait for it)
        messagesStore.markAsRead(authStore.user.uid, newUserId).catch(err => {
          console.warn('Could not mark messages as read:', err.message)
        })
        
        // Unsubscribe from previous messages
        if (unsubscribe) {
          unsubscribe()
        }
        
        // Cleanup previous watcher
        if (messagesWatcher) {
          messagesWatcher()
        }
        
        // Subscribe to new messages
        unsubscribe = messagesStore.subscribeToMessages(
          authStore.user.uid,
          newUserId
        )
        
        // Watch for new messages to auto-scroll
        // Reset isNearBottom when switching chats
        isNearBottom.value = true
        messagesWatcher = watch(
          () => messagesStore.messages.length,
          (newLength, oldLength) => {
            // Add small delay to ensure DOM is updated
            setTimeout(() => {
              // Only auto-scroll if user is near bottom or this is the first load
              if (isNearBottom.value || oldLength === 0) {
                scrollToBottom()
              }
            }, 100)
          },
          { immediate: true }
        )
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
  if (routeWatcher) {
    routeWatcher()
  }
})

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

const clearSelectedFiles = () => {
  selectedFiles.value = []
}

const handleSendVoice = async (voiceData) => {
  // Send voice message immediately
  if (!otherUserId.value) return
  
  showVoiceRecorder.value = false
  
  try {
    const result = await messagesStore.sendMessage(
      authStore.user.uid,
      otherUserId.value,
      '', // No text content for voice
      voiceData
    )
    
    if (!result.success) {
      throw new Error(result.error || 'Gửi tin nhắn thất bại')
    }
    
    // Show success notification
    if (window.showToast) {
      window.showToast('Đã gửi tin nhắn', 'success', '', 2000)
    }
    
    // Scroll to bottom after sending message
    scrollToBottom()
  } catch (error) {
    // Show error notification
    if (window.showToast) {
      window.showToast('Gửi tin nhắn thất bại', 'error', error.message || '', 4000)
    } else {
      alert(error.message || 'Gửi tin nhắn thất bại')
    }
    // Reopen voice recorder on error
    showVoiceRecorder.value = true
  }
}

const formatAudioDuration = (seconds) => {
  if (!seconds) return '0 giây'
  if (seconds < 60) {
    return `${seconds} giây`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (secs === 0) {
    return `${mins} phút`
  }
  return `${mins} phút ${secs} giây`
}

const handleSaveEdit = async () => {
  if (!editingMessageId.value || !editingContent.value.trim() || !otherUserId.value) {
    cancelEditing()
    return
  }
  
  const result = await messagesStore.editMessage(
    authStore.user.uid,
    otherUserId.value,
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
  if ((!messageContent.value.trim() && selectedFiles.value.length === 0)) return

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
          otherUserId.value,
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
          otherUserId.value,
          '', // No text, just images
          fileData,
          null // No replyTo for image-only messages
        )
        
        if (!result.success) {
          throw new Error(result.error || 'Gửi tin nhắn thất bại')
        }
      }
      
      // Show success notification
      if (window.showToast) {
        window.showToast(`Đã gửi ${filesToSend.length} hình`, 'success', '', 2000)
      }
    } else if (filesToSend.length === 1 && filesToSend[0].type === 'image') {
      // Single image - also separate text and image
      if (content && content.trim()) {
        const textResult = await messagesStore.sendMessage(
          authStore.user.uid,
          otherUserId.value,
          content,
          null // No file, just text
        )
        
        if (!textResult.success) {
          throw new Error(textResult.error || 'Gửi tin nhắn thất bại')
        }
      }
      
      // Send single image without text
      const fileData = filesToSend[0]
      const result = await messagesStore.sendMessage(
        authStore.user.uid,
        otherUserId.value,
        '', // No text, just image
        fileData,
        null // No replyTo for image-only messages
      )
      
      if (!result.success) {
        throw new Error(result.error || 'Gửi tin nhắn thất bại')
      }
      
      // Show success notification
      if (window.showToast) {
        window.showToast('Đã gửi tin nhắn', 'success', '', 2000)
      }
    } else {
      // Single file or non-image file
      const fileData = filesToSend[0] || null
      const result = await messagesStore.sendMessage(
        authStore.user.uid,
        otherUserId.value,
        content,
        fileData,
        replyToId
      )

      if (result.success) {
        // Show success notification
        if (window.showToast) {
          window.showToast('Đã gửi tin nhắn', 'success', '', 2000)
        }
      } else {
        throw new Error(result.error || 'Gửi tin nhắn thất bại')
      }
    }
    
    // Scroll to bottom after sending message
    scrollToBottom()
  } catch (error) {
    // Show error notification
    if (window.showToast) {
      window.showToast('Gửi tin nhắn thất bại', 'error', error.message || '', 4000)
    } else {
      alert(error.message || 'Gửi tin nhắn thất bại')
    }
    // Restore on error
    messageContent.value = content
    selectedFiles.value = previousFiles
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

.slide-down-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-down-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
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
