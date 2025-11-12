<template>
  <!-- Wrapper để có single root element -->
  <div>
    <!-- Time Divider (shown when gap > 10 minutes) -->
    <div v-if="shouldShowTimeDivider" class="flex items-center justify-center my-3">
      <div class="px-3 py-1 bg-gray-200/80 rounded-full">
        <span class="text-xs text-gray-600 font-medium">
          {{ formatTimeDivider(message.createdAt) }}
        </span>
      </div>
    </div>
    
    <div
      ref="messageContainerRef"
      class="flex items-end gap-2 animate-fade-in relative group/message"
      :class="[
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
        shouldShowAvatar ? 'mb-2' : 'mb-0.5',
        isBeingEdited ? 'scale-105 z-50' : ''
      ]"
    >
      <!-- Message Menu Popup (for own messages only) -->
      <Transition name="slide-down">
        <div
          v-if="isOwnMessage && showMenu && props.otherUserId && !message.deleted"
          ref="menuPopupRef"
          class="absolute z-50 bg-white rounded-md shadow-apple border border-gray-200/60 py-1 min-w-[110px]"
          :class="[
            isOwnMessage ? 'right-0 top-0 mr-12' : 'left-0 top-0 ml-12'
          ]"
          @click.stop
        >
          <!-- Time display -->
          <div class="px-3 py-1.5 border-b border-gray-100/80">
            <p class="text-[10px] text-gray-400 font-medium">
              {{ formatTimeTooltip(message.createdAt) }}
            </p>
          </div>
          
          <!-- Actions -->
          <div class="py-0.5">
            <button
              @click="handleReply"
              class="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50/80 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="arrowLeft" :size="13" class="text-gray-500 rotate-180" />
              Trả lời
            </button>
            <button
              v-if="canEdit"
              @click="startEditing"
              class="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50/80 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="edit" :size="13" class="text-gray-500" />
              Sửa
            </button>
            <button
              @click="handleDelete"
              class="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50/80 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="trash" :size="13" class="text-red-500" />
              Xóa
            </button>
          </div>
        </div>
      </Transition>
      
      <!-- Time Popup (for other user's messages) -->
      <Transition name="slide-down">
        <div
          v-if="!isOwnMessage && showTimePopup && props.otherUserId"
          ref="timePopupRef"
          class="absolute z-50 bg-white rounded-md shadow-apple border border-gray-200/60 py-1 min-w-[110px]"
          :class="[
            'left-0 top-0 ml-12'
          ]"
          @click.stop
        >
          <!-- Time display -->
          <div class="px-3 py-1.5 border-b border-gray-100/80">
            <p class="text-[10px] text-gray-400 font-medium">
              {{ formatTimeTooltip(message.createdAt) }}
            </p>
          </div>
          
          <!-- Reply action -->
          <div class="py-0.5">
            <button
              @click="handleReply"
              class="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50/80 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="arrowLeft" :size="13" class="text-gray-500 rotate-180" />
              Trả lời
            </button>
          </div>
        </div>
      </Transition>
      <!-- Avatar (only for other user's messages and when not in a group) -->
      <div v-if="shouldShowAvatar && !isOwnMessage" class="flex-shrink-0">
        <img
          v-if="message.fromUserAvatar"
          :src="message.fromUserAvatar"
          :alt="message.fromUserName || 'User'"
          class="w-8 h-8 rounded-full object-cover"
        />
        <img
          v-else
          src="/user.png"
          alt="User"
          class="w-8 h-8 rounded-full object-cover"
        />
      </div>
      <div v-else-if="shouldShowAvatar && !isOwnMessage" class="flex-shrink-0 w-8"></div>
      
      <!-- Deleted Message -->
      <div
        v-if="message.deleted"
        class="max-w-xs lg:max-w-md overflow-visible relative"
        :class="[
          isOwnMessage ? 'ml-auto' : '',
          !shouldShowAvatar && !isOwnMessage ? 'ml-10' : ''
        ]"
      >
        <p class="text-xs text-gray-400 italic">
          Tin nhắn đã được gỡ
        </p>
      </div>
      
      <!-- Audio/Voice - No bubble, just the player -->
      <div
        v-else-if="message.fileType === 'audio'"
        class="max-w-xs lg:max-w-md overflow-visible relative group/bubble cursor-pointer"
        :class="[
          isOwnMessage ? 'ml-auto' : '',
          !shouldShowAvatar && !isOwnMessage ? 'ml-10' : ''
        ]"
        @click="handleMessageClick"
      >
        <div class="mb-2">
          <AudioPlayer 
            :src="message.fileData"
            :duration="message.duration || 0"
          />
        </div>
        <div v-if="message.content" class="mt-2">
          <p class="text-sm whitespace-pre-wrap break-words leading-relaxed text-gray-900">
            {{ message.content }}
          </p>
        </div>
        
      </div>

      <!-- Multiple Images - No bubble, just the grid -->
      <div
        v-else-if="message.fileType === 'images' && message.images && Array.isArray(message.images) && !message.deleted"
        class="max-w-xs lg:max-w-md overflow-visible relative group/bubble cursor-pointer"
        :class="[
          isOwnMessage ? 'ml-auto' : '',
          !shouldShowAvatar && !isOwnMessage ? 'ml-10' : ''
        ]"
        @click="handleMessageClick"
      >
        <div class="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
          <div
            v-for="(image, index) in displayedImages"
            :key="index"
            class="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer group flex items-center justify-center relative"
            @click.stop="openImagePreview(image, index)"
          >
            <img
              :src="image"
              :alt="`Image ${index + 1}`"
              class="w-[70%] h-[70%] object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <!-- Overlay for remaining images count -->
            <div
              v-if="index === 5 && remainingImagesCount > 0"
              class="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:bg-black/70 transition-colors rounded-lg"
              @click.stop="openImagePreview(message.images[5], 5)"
            >
              +{{ remainingImagesCount }}
            </div>
          </div>
        </div>
        <div v-if="message.content" class="mt-2">
          <p class="text-sm whitespace-pre-wrap break-words leading-relaxed text-gray-900">
            {{ message.content }}
          </p>
        </div>
        
      </div>

      <!-- Single Image - No bubble, just the image -->
      <div
        v-else-if="message.fileType === 'image' && !message.deleted"
        class="max-w-xs lg:max-w-md overflow-visible relative group/bubble cursor-pointer"
        :class="[
          isOwnMessage ? 'ml-auto' : '',
          !shouldShowAvatar && !isOwnMessage ? 'ml-10' : ''
        ]"
        @click="handleMessageClick"
      >
        <div class="flex justify-start items-start max-w-full relative">
          <img
            :src="message.fileData"
            alt="Image"
            class="max-w-full max-h-[86px] w-auto h-auto object-contain rounded-xl cursor-pointer"
            @click="openImagePreview(message.fileData)"
          />
        </div>
        <div v-if="message.content" class="mt-2">
          <p class="text-sm whitespace-pre-wrap break-words leading-relaxed text-gray-900">
            {{ message.content }}
          </p>
        </div>
        
      </div>

      <!-- Other message types - with bubble -->
      <div
        v-else-if="!message.deleted"
        class="max-w-xs lg:max-w-md rounded-2xl shadow-apple transition-all duration-200 hover:shadow-apple-lg overflow-visible relative group/bubble"
        :class="[
          isOwnMessage 
            ? 'bg-black text-white rounded-br-sm cursor-pointer' 
            : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100 cursor-pointer',
          !shouldShowAvatar && !isOwnMessage ? 'ml-10' : '',
          !shouldShowAvatar && isOwnMessage ? 'mr-0' : ''
        ]"
        @click="handleMessageClick"
      >
        <!-- Reply Preview -->
        <div v-if="message.replyTo && replyToMessage" class="px-3 pt-2 pb-1 border-l-4" :class="isOwnMessage ? 'border-white/30' : 'border-gray-300'">
          <p class="text-xs font-medium mb-0.5" :class="isOwnMessage ? 'text-white/80' : 'text-gray-600'">
            {{ replyToMessage.fromUserId === authStore.user?.uid ? 'Bạn' : replyToMessage.fromUserName }}
          </p>
          <p class="text-xs truncate" :class="isOwnMessage ? 'text-white/60' : 'text-gray-500'">
            {{ replyToMessage.content || (replyToMessage.fileType === 'image' ? '📷 Ảnh' : replyToMessage.fileType === 'audio' ? '🎤 Ghi âm' : replyToMessage.fileType === 'video' ? '🎥 Video' : replyToMessage.fileType === 'file' ? '📎 File' : 'Tin nhắn') }}
          </p>
        </div>
        <!-- Yellow dot indicator for edited messages -->
        <span 
          v-if="message.edited" 
          class="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
          :class="[
            isOwnMessage ? 'bottom-1 right-1' : 'bottom-1 left-1'
          ]"
        ></span>
        <!-- Video -->
        <div v-if="message.fileType === 'video'" class="w-full relative">
          <div class="flex justify-start items-start max-w-full relative">
            <video
              :src="message.fileData"
              controls
              class="max-w-full max-h-[86px] w-auto h-auto object-contain rounded-xl"
            ></video>
          </div>
          <div v-if="message.content" class="px-3 py-2 relative">
            <p 
              class="text-sm whitespace-pre-wrap break-words leading-relaxed"
              :class="isOwnMessage ? 'text-white' : 'text-gray-900'"
            >
              {{ message.content }}
            </p>
          </div>
        </div>

        <!-- File -->
        <div v-else-if="message.fileType === 'file'" class="px-3 py-2.5 relative">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">{{ getFileIcon(message.fileName, 'file') }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate" :class="isOwnMessage ? 'text-white' : 'text-gray-900'">
                {{ message.fileName || 'File' }}
              </p>
              <p v-if="message.fileSize" class="text-xs opacity-70" :class="isOwnMessage ? 'text-white/80' : 'text-gray-500'">
                {{ formatFileSize(message.fileSize) }}
              </p>
            </div>
            <a
              :href="message.fileData"
              :download="message.fileName"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="isOwnMessage 
                ? 'bg-white/20 text-white hover:bg-white/30' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            >
              Tải xuống
            </a>
          </div>
          <div v-if="message.content">
            <p class="text-sm whitespace-pre-wrap break-words leading-relaxed" :class="isOwnMessage ? 'text-white' : 'text-gray-900'">
              {{ message.content }}
            </p>
          </div>
        </div>

        <!-- Text only -->
        <div v-else class="px-3 py-2 relative">
          <p
            class="text-sm whitespace-pre-wrap break-words leading-relaxed"
            :class="isOwnMessage ? 'text-white' : 'text-gray-900'"
          >
            {{ message.content }}
          </p>
        </div>


      </div>
      
    </div>

    <!-- Image Preview Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showImagePreview"
          @click="showImagePreview = false"
          class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <Transition name="slide" mode="out-in">
            <img
              :key="previewImageIndex"
              :src="previewImageUrl"
              alt="Preview"
              class="max-w-full max-h-full object-contain rounded-lg"
              @click.stop
            />
          </Transition>
          <button
            @click="showImagePreview = false"
            class="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl transition-colors"
          >
            ✕
          </button>
          <!-- Image position indicator -->
          <div
            v-if="previewImages.length > 1"
            class="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium"
          >
            {{ previewImageIndex + 1 }}/{{ previewImages.length }}
          </div>
          <!-- Navigation arrows for multiple images -->
          <button
            v-if="previewImages.length > 1 && previewImageIndex > 0"
            @click.stop="prevImage"
            class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <Icon name="arrowLeft" :size="24" />
          </button>
          <button
            v-if="previewImages.length > 1 && previewImageIndex < previewImages.length - 1"
            @click.stop="nextImage"
            class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <Icon name="arrowLeft" :size="24" class="rotate-180" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject, provide } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { formatFileSize, getFileIcon } from '@/utils/fileUtils'
import AudioPlayer from '@/components/AudioPlayer.vue'
import Icon from '@/components/Icon.vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  previousMessage: {
    type: Object,
    default: null
  },
  nextMessage: {
    type: Object,
    default: null
  },
  otherUserId: {
    type: String,
    default: null
  },
  allMessages: {
    type: Array,
    default: () => []
  }
})

const authStore = useAuthStore()
const messagesStore = useMessagesStore()
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const previewImageIndex = ref(0)
const previewImages = ref([])

// Use inject to get openMenuMessageId from parent
const openMenuMessageId = inject('openMenuMessageId', null)
const showMenu = ref(false)
const showTimePopup = ref(false) // For other user's messages
const isDeleting = ref(false)
const menuPopupRef = ref(null)
const timePopupRef = ref(null)
const messageContainerRef = ref(null)

// Use inject to get editing state from parent
const editingMessageId = inject('editingMessageId', null)
const setEditingMessage = inject('setEditingMessage', null)
const cancelEditing = inject('cancelEditing', null)

// Use inject to get reply state from parent
const setReplyingToMessage = inject('setReplyingToMessage', null)

// Check if this message is being edited
const isBeingEdited = computed(() => {
  return editingMessageId?.value === props.message.id
})

// Get replyTo message data
const replyToMessage = computed(() => {
  if (!props.message.replyTo || !props.allMessages || props.allMessages.length === 0) return null
  return props.allMessages.find(m => m.id === props.message.replyTo) || null
})

// Watch for other messages opening menu
watch(() => openMenuMessageId?.value, (newId) => {
  if (newId && newId !== props.message.id) {
    showMenu.value = false
  } else if (newId === props.message.id) {
    showMenu.value = true
  }
})

const isOwnMessage = computed(() => {
  return props.message.fromUserId === authStore.user?.uid
})

// Check if messages are from the same user and within 5 minutes
// But don't group image messages together - always show spacing between consecutive images
const isGroupedWithPrevious = computed(() => {
  if (!props.previousMessage) return false
  if (props.previousMessage.fromUserId !== props.message.fromUserId) return false
  
  // Don't group if current or previous message is an image
  const isCurrentImage = props.message.fileType === 'image' || props.message.fileType === 'images'
  const isPreviousImage = props.previousMessage.fileType === 'image' || props.previousMessage.fileType === 'images'
  if (isCurrentImage || isPreviousImage) return false
  
  const prevTime = props.previousMessage.createdAt?.toDate ? props.previousMessage.createdAt.toDate() : new Date(props.previousMessage.createdAt)
  const currentTime = props.message.createdAt?.toDate ? props.message.createdAt.toDate() : new Date(props.message.createdAt)
  const timeDiff = currentTime - prevTime
  const minutesDiff = timeDiff / (1000 * 60)
  
  return minutesDiff < 5
})

const isGroupedWithNext = computed(() => {
  if (!props.nextMessage) return false
  if (props.nextMessage.fromUserId !== props.message.fromUserId) return false
  
  const currentTime = props.message.createdAt?.toDate ? props.message.createdAt.toDate() : new Date(props.message.createdAt)
  const nextTime = props.nextMessage.createdAt?.toDate ? props.nextMessage.createdAt.toDate() : new Date(props.nextMessage.createdAt)
  const timeDiff = nextTime - currentTime
  const minutesDiff = timeDiff / (1000 * 60)
  
  return minutesDiff < 5
})

// Show avatar only if not grouped with previous message
const shouldShowAvatar = computed(() => {
  return !isGroupedWithPrevious.value
})

// Computed for multiple images display
const displayedImages = computed(() => {
  if (!props.message.images || !Array.isArray(props.message.images)) {
    // Debug log
    if (props.message.fileType === 'images') {
      console.warn('[ChatMessage] Message has fileType=images but no images array:', {
        messageId: props.message.id,
        fileType: props.message.fileType,
        hasImages: !!props.message.images,
        imagesType: typeof props.message.images,
        messageKeys: Object.keys(props.message)
      })
    }
    return []
  }
  // Chỉ hiển thị tối đa 6 hình (2x3 grid)
  const images = props.message.images.slice(0, 6)
  console.log('[ChatMessage] Displaying images:', {
    messageId: props.message.id,
    totalImages: props.message.images.length,
    displayedCount: images.length
  })
  return images
})

const remainingImagesCount = computed(() => {
  if (!props.message.images || !Array.isArray(props.message.images)) return 0
  return Math.max(0, props.message.images.length - 6)
})

// Show timestamp in bubble only if next message is > 5 minutes away or from different user
const shouldShowTimestamp = computed(() => {
  if (!props.nextMessage) return true // Last message in conversation
  
  // If next message is from different user, show timestamp
  if (props.nextMessage.fromUserId !== props.message.fromUserId) return true
  
  // Calculate time difference
  const currentTime = props.message.createdAt?.toDate ? props.message.createdAt.toDate() : new Date(props.message.createdAt)
  const nextTime = props.nextMessage.createdAt?.toDate ? props.nextMessage.createdAt.toDate() : new Date(props.nextMessage.createdAt)
  const timeDiff = nextTime - currentTime
  const minutesDiff = timeDiff / (1000 * 60)
  
  // Show timestamp if > 5 minutes
  return minutesDiff > 5
})

// Show time divider BEFORE this message if gap from previous message is > 10 minutes
const shouldShowTimeDivider = computed(() => {
  if (!props.previousMessage) return false
  
  // Calculate time difference with previous message
  const prevTime = props.previousMessage.createdAt?.toDate ? props.previousMessage.createdAt.toDate() : new Date(props.previousMessage.createdAt)
  const currentTime = props.message.createdAt?.toDate ? props.message.createdAt.toDate() : new Date(props.message.createdAt)
  const timeDiff = currentTime - prevTime
  const minutesDiff = timeDiff / (1000 * 60)
  
  // Show divider if > 10 minutes
  return minutesDiff > 10
})

const formatTime = (date) => {
  if (!date) return ''
  
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date))
  const now = new Date()
  const diff = now - d
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Compact time format for inside bubble (like WhatsApp: HH:MM)
const formatTimeCompact = (date) => {
  if (!date) return ''
  
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date))
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// Format time for divider (shows date/time when gap is large)
const formatTimeDivider = (date) => {
  if (!date) return ''
  
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date))
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24))
  
  // Today - just show time
  if (diffDays === 0) {
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
  
  // Yesterday
  if (diffDays === 1) {
    return `Hôm qua ${d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`
  }
  
  // This week
  if (diffDays < 7) {
    const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
    return `${dayNames[d.getDay()]}, ${d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`
  }
  
  // This year
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
  
  // Older - show full date
  return d.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// Format time for tooltip (shows full date and time on hover)
const formatTimeTooltip = (date) => {
  if (!date) return ''
  
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date))
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24))
  
  const timeStr = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  // Today - just show time
  if (diffDays === 0) {
    return timeStr
  }
  
  // Yesterday
  if (diffDays === 1) {
    return `Hôm qua, ${timeStr}`
  }
  
  // This week
  if (diffDays < 7) {
    const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
    return `${dayNames[d.getDay()]}, ${timeStr}`
  }
  
  // This year
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}, ${timeStr}`
  }
  
  // Older - show full date
  return `${d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${timeStr}`
}

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const openImagePreview = (imageUrl, index = 0) => {
  // If message has multiple images, set up image array for navigation
  if (props.message.images && Array.isArray(props.message.images) && props.message.images.length > 1) {
    previewImages.value = props.message.images
    previewImageIndex.value = index
  } else {
    previewImages.value = [imageUrl]
    previewImageIndex.value = 0
  }
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
}

const nextImage = () => {
  if (previewImages.value.length > 0 && previewImageIndex.value < previewImages.value.length - 1) {
    previewImageIndex.value++
    previewImageUrl.value = previewImages.value[previewImageIndex.value]
  }
}

const prevImage = () => {
  if (previewImages.value.length > 0 && previewImageIndex.value > 0) {
    previewImageIndex.value--
    previewImageUrl.value = previewImages.value[previewImageIndex.value]
  }
}

// Check if message can be edited (has text content)
const canEdit = computed(() => {
  return props.message.content && props.message.content.trim()
})

// Handle click on message to toggle menu
const handleMessageClick = () => {
  if (!props.otherUserId || props.message.deleted) return
  
  // For own messages - show menu with actions
  if (isOwnMessage.value) {
    // Close other menus by setting openMenuMessageId
    if (openMenuMessageId) {
      if (showMenu.value) {
        // If this menu is open, close it
        openMenuMessageId.value = null
        showMenu.value = false
      } else {
        // Open this menu and close others
        openMenuMessageId.value = props.message.id
        showMenu.value = true
      }
    } else {
      // Fallback if inject is not available
      showMenu.value = !showMenu.value
    }
  } else {
    // For other user's messages - show time popup only
    showTimePopup.value = !showTimePopup.value
  }
}

// Start editing (can be called from external button if needed)
const startEditing = () => {
  if (!canEdit.value || !props.otherUserId || !setEditingMessage) return
  setEditingMessage(props.message.id, props.message.content)
  showMenu.value = false
  if (openMenuMessageId) {
    openMenuMessageId.value = null
  }
}

// Handle reply
const handleReply = () => {
  console.log('handleReply called', { otherUserId: props.otherUserId, setReplyingToMessage: !!setReplyingToMessage })
  if (!props.otherUserId || !setReplyingToMessage) {
    console.warn('Cannot reply: missing otherUserId or setReplyingToMessage')
    return
  }
  setReplyingToMessage(props.message)
  showMenu.value = false
  showTimePopup.value = false
  if (openMenuMessageId) {
    openMenuMessageId.value = null
  }
}

// Close menu when clicking outside
const handleClickOutside = (event) => {
  // Close menu popup when clicking outside
  if (showMenu.value) {
    const clickedInsideMenu = menuPopupRef.value?.contains(event.target)
    const clickedInsideMessage = messageContainerRef.value?.contains(event.target)
    
    if (!clickedInsideMenu && !clickedInsideMessage) {
      showMenu.value = false
      if (openMenuMessageId) {
        openMenuMessageId.value = null
      }
    }
  }
  
  // Close time popup when clicking outside
  if (showTimePopup.value) {
    const clickedInsidePopup = timePopupRef.value?.contains(event.target)
    const clickedInsideMessage = messageContainerRef.value?.contains(event.target)
    
    if (!clickedInsidePopup && !clickedInsideMessage) {
      showTimePopup.value = false
    }
  }
}

// Watch for clicks outside to close menu
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})


// Handle delete
const handleDelete = async () => {
  if (!props.otherUserId) return
  
  if (window.showConfirm) {
    const confirmed = await window.showConfirm('Bạn có chắc chắn muốn xóa tin nhắn này?', {
      title: 'Xóa tin nhắn',
      confirmText: 'Xóa',
      cancelText: 'Hủy'
    })
    if (!confirmed) {
      showMenu.value = false
      return
    }
  } else {
    // Fallback to browser confirm
    if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
      showMenu.value = false
      return
    }
  }
  
  isDeleting.value = true
  showMenu.value = false
  
  const result = await messagesStore.deleteMessage(
    authStore.user.uid,
    props.otherUserId,
    props.message.id
  )
  
  isDeleting.value = false
  
  if (result.success) {
    if (window.showToast) {
      window.showToast('Đã xóa tin nhắn', 'success', '', 2000)
    }
  } else {
    alert(result.error || 'Không thể xóa tin nhắn')
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

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

