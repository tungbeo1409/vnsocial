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
        <div v-if="group" class="flex items-center gap-3 flex-1">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Icon name="users" :size="20" class="text-white" />
          </div>
          <div>
            <p class="font-semibold text-gray-900">{{ group.name || 'Nhóm chat' }}</p>
            <p class="text-xs text-gray-500">{{ group.members?.length || 0 }} thành viên</p>
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
        <div v-if="loading && groupMessages.length === 0" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Đang tải tin nhắn...</p>
        </div>
        
        <div v-else-if="groupMessages.length === 0" class="empty-state">
          <div class="empty-state-icon">💭</div>
          <p class="empty-state-title">Chưa có tin nhắn nào</p>
          <p class="empty-state-description">Hãy bắt đầu cuộc trò chuyện!</p>
        </div>
        
        <TransitionGroup v-else name="list" tag="div">
          <ChatMessage
            v-for="(message, index) in groupMessages"
            :key="message.id"
            :message="message"
            :previous-message="index > 0 ? groupMessages[index - 1] : null"
            :next-message="index < groupMessages.length - 1 ? groupMessages[index + 1] : null"
            :other-user-id="null"
            :all-messages="groupMessages"
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
            <TransitionGroup name="file-item" tag="div" class="flex flex-wrap gap-2">
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

        <!-- Reply Preview -->
        <Transition name="slide-down">
          <div v-if="replyingToMessage" class="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-start justify-between gap-2">
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
        <div v-if="editingMessageId" class="px-4 py-3 space-y-2">
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
              <Icon name="check" :size="16" />
            </button>
          </div>
        </div>
        
        <!-- Normal Input Mode -->
        <div v-else>
          <!-- Action Buttons -->
          <div class="flex items-center gap-1 px-3 pt-2 pb-1">
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
          
          <form @submit.prevent="handleSendMessage" class="flex gap-2 items-center px-3 pb-3">
            <input
              v-model="messageContent"
              type="text"
              placeholder="Nhập tin nhắn..."
              class="input-field flex-1"
              :disabled="loading || uploading"
            />
            <button
              type="submit"
              :disabled="(!messageContent.trim() && selectedFiles.length === 0) || loading || uploading"
              class="p-2 rounded-lg transition-colors flex-shrink-0"
              :class="(!messageContent.trim() && selectedFiles.length === 0) || loading || uploading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-system-blue text-white hover:bg-blue-600'"
              title="Gửi"
            >
              <span v-if="loading || uploading" class="flex items-center">
                <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              </span>
              <Icon v-else name="send" :size="20" />
            </button>
          </form>
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
import { useGroupsStore } from '@/stores/groups'
import { compressImage, compressVideo, fileToBase64, formatFileSize, getFileIcon } from '@/utils/fileUtils'
import ChatMessage from '@/components/ChatMessage.vue'
import VoiceRecorder from '@/components/VoiceRecorder.vue'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'
import Icon from '@/components/Icon.vue'
import { 
  collection, 
  query, 
  orderBy, 
  limit,
  onSnapshot, 
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/config/firebase'

const route = useRoute()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()

const groupId = ref(route.params.groupId)
const group = ref(null)
const groupMessages = ref([])
const messageContent = ref('')
const selectedFiles = ref([])
const showVoiceRecorder = ref(false)
const uploading = ref(false)
const loading = ref(true)
const messagesContainer = ref(null)
let messagesUnsubscribe = null

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
    })
  }
}

const handleScroll = () => {
  // Auto-scroll logic can be added here if needed
}

const loadGroup = async () => {
  if (!groupId.value) return
  
  try {
    const groupData = await groupsStore.getGroupById(groupId.value)
    if (groupData) {
      group.value = groupData
    }
  } catch (error) {
    console.error('Error loading group:', error)
  }
}

const subscribeToGroupMessages = () => {
  if (!groupId.value) return
  
  const messagesRef = collection(db, 'groups', groupId.value, 'messages')
  const q = query(messagesRef, orderBy('createdAt', 'asc'))
  
  messagesUnsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))
    
    groupMessages.value = messages
    loading.value = false
    
    // Auto-scroll to bottom when new messages arrive
    nextTick(() => {
      scrollToBottom()
    })
  }, (error) => {
    console.error('Error subscribing to group messages:', error)
    loading.value = false
  })
}

const handleSendMessage = async () => {
  if ((!messageContent.value.trim() && selectedFiles.value.length === 0) || !groupId.value || !authStore.user) return

  const content = messageContent.value
  const filesToSend = [...selectedFiles.value]
  const replyToId = replyingToMessage.value?.id || null

  // Clear inputs
  messageContent.value = ''
  const previousFiles = [...selectedFiles.value]
  selectedFiles.value = []
  showVoiceRecorder.value = false
  replyingToMessage.value = null

  uploading.value = true
  try {
    // Get user info from cache
    const { useUserCacheStore } = await import('@/stores/userCache')
    const userCacheStore = useUserCacheStore()
    const fromUserData = await userCacheStore.getUser(authStore.user.uid) || {}

    // If multiple images, send them separately
    if (filesToSend.length > 1 && filesToSend.every(f => f.type === 'image')) {
      // Send text first if exists
      if (content && content.trim()) {
        const messagesRef = collection(db, 'groups', groupId.value, 'messages')
        await addDoc(messagesRef, {
          fromUserId: authStore.user.uid,
          fromUserName: fromUserData.displayName || 'Người dùng',
          fromUserAvatar: fromUserData.avatar || '',
          content: content.trim(),
          type: 'text',
          replyTo: replyToId,
          createdAt: serverTimestamp()
        })
      }
      
      // Send each image separately
      for (const file of filesToSend) {
        const messagesRef = collection(db, 'groups', groupId.value, 'messages')
        await addDoc(messagesRef, {
          fromUserId: authStore.user.uid,
          fromUserName: fromUserData.displayName || 'Người dùng',
          fromUserAvatar: fromUserData.avatar || '',
          content: '',
          type: 'file',
          fileType: file.type,
          fileData: file.data,
          filename: file.filename,
          size: file.size,
          mimeType: file.mimeType,
          preview: file.preview,
          replyTo: null, // Only first message has replyTo
          createdAt: serverTimestamp()
        })
      }
    } else if (filesToSend.length === 1) {
      // Single file
      const file = filesToSend[0]
      const messagesRef = collection(db, 'groups', groupId.value, 'messages')
      await addDoc(messagesRef, {
        fromUserId: authStore.user.uid,
        fromUserName: fromUserData.displayName || 'Người dùng',
        fromUserAvatar: fromUserData.avatar || '',
        content: content.trim(),
        type: 'file',
        fileType: file.type,
        fileData: file.data,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimeType,
        preview: file.preview,
        replyTo: replyToId,
        createdAt: serverTimestamp()
      })
    } else {
      // Text only
      const messagesRef = collection(db, 'groups', groupId.value, 'messages')
      await addDoc(messagesRef, {
        fromUserId: authStore.user.uid,
        fromUserName: fromUserData.displayName || 'Người dùng',
        fromUserAvatar: fromUserData.avatar || '',
        content: content.trim(),
        type: 'text',
        replyTo: replyToId,
        createdAt: serverTimestamp()
      })
    }

    // Update group's lastMessage
    const groupRef = doc(db, 'groups', groupId.value)
    let lastMessageText = content?.trim() || ''
    if (filesToSend.length > 0) {
      const file = filesToSend[0]
      if (file.type === 'image') lastMessageText = '📷 Ảnh'
      else if (file.type === 'video') lastMessageText = '🎥 Video'
      else if (file.type === 'audio') lastMessageText = '🎤 Ghi âm'
      else if (file.type === 'file') lastMessageText = `📎 ${file.filename || 'File'}`
      if (content?.trim()) lastMessageText = `${lastMessageText}: ${content.trim()}`
    }
    
    await updateDoc(groupRef, {
      lastMessage: lastMessageText,
      lastMessageTime: serverTimestamp()
    })

    scrollToBottom()
  } catch (error) {
    console.error('Error sending message:', error)
    // Restore on error
    messageContent.value = content
    selectedFiles.value = previousFiles
    if (window.showToast) {
      window.showToast('Gửi tin nhắn thất bại', 'error', error.message || '', 3000)
    }
  } finally {
    uploading.value = false
  }
}

const handleSendVoice = async (voiceData) => {
  if (!groupId.value || !authStore.user) return
  
  showVoiceRecorder.value = false
  uploading.value = true
  
  try {
    // Get user info from cache
    const { useUserCacheStore } = await import('@/stores/userCache')
    const userCacheStore = useUserCacheStore()
    const fromUserData = await userCacheStore.getUser(authStore.user.uid) || {}

    const messagesRef = collection(db, 'groups', groupId.value, 'messages')
    await addDoc(messagesRef, {
      fromUserId: authStore.user.uid,
      fromUserName: fromUserData.displayName || 'Người dùng',
      fromUserAvatar: fromUserData.avatar || '',
      content: '',
      type: 'file',
      fileType: 'audio',
      fileData: voiceData.data,
      filename: voiceData.filename,
      size: voiceData.size,
      mimeType: voiceData.mimeType,
      duration: voiceData.duration,
      createdAt: serverTimestamp()
    })

    // Update group's lastMessage
    const groupRef = doc(db, 'groups', groupId.value)
    await updateDoc(groupRef, {
      lastMessage: '🎤 Ghi âm',
      lastMessageTime: serverTimestamp()
    })

    scrollToBottom()
  } catch (error) {
    console.error('Error sending voice:', error)
    if (window.showToast) {
      window.showToast('Gửi ghi âm thất bại', 'error', error.message || '', 3000)
    }
    showVoiceRecorder.value = true
  } finally {
    uploading.value = false
  }
}

const handleFileSelect = async (event, fileType) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return

  uploading.value = true
  try {
    if (fileType === 'image' && files.length > 1) {
      // Multiple images
      for (const file of files) {
        const compressedBase64 = await compressImage(file, 800, 800, 0.8)
        
        if (compressedBase64.length > 750 * 1024) {
          alert(`File "${file.name}" quá lớn sau khi nén. Vui lòng chọn file nhỏ hơn.`)
          continue
        }

        selectedFiles.value.push({
          type: 'image',
          data: compressedBase64,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          preview: compressedBase64
        })
      }
    } else {
      // Single file
      const file = files[0]
      let base64Data = null
      let preview = null

      if (fileType === 'image') {
        base64Data = await compressImage(file, 800, 800, 0.8)
        preview = base64Data
      } else if (fileType === 'video') {
        base64Data = await compressVideo(file)
        preview = base64Data
      } else {
        base64Data = await fileToBase64(file)
        preview = null
      }

      if (base64Data.length > 750 * 1024) {
        alert('File quá lớn sau khi nén. Vui lòng chọn file nhỏ hơn.')
        event.target.value = ''
        return
      }

      selectedFiles.value = [{
        type: fileType,
        data: base64Data,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        preview: preview
      }]
    }

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

const handleSaveEdit = async () => {
  if (!editingMessageId.value || !editingContent.value.trim() || !groupId.value || !authStore.user) {
    cancelEditing()
    return
  }
  
  try {
    const messageRef = doc(db, 'groups', groupId.value, 'messages', editingMessageId.value)
    await updateDoc(messageRef, {
      content: editingContent.value.trim(),
      edited: true,
      editedAt: serverTimestamp()
    })
    
    cancelEditing()
    if (window.showToast) {
      window.showToast('Đã sửa tin nhắn', 'success', '', 2000)
    }
  } catch (error) {
    console.error('Error editing message:', error)
    if (window.showToast) {
      window.showToast('Không thể sửa tin nhắn', 'error', error.message || '', 3000)
    }
  }
}

onMounted(async () => {
  await loadGroup()
  subscribeToGroupMessages()
  
  // Watch for route changes
  watch(
    () => route.params.groupId,
    async (newGroupId) => {
      if (newGroupId && newGroupId !== groupId.value) {
        groupId.value = newGroupId
        groupMessages.value = []
        loading.value = true
        
        if (messagesUnsubscribe) {
          messagesUnsubscribe()
        }
        
        await loadGroup()
        subscribeToGroupMessages()
      }
    }
  )
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

