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
      class="flex items-end gap-2 animate-fade-in relative"
      :class="[
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
        shouldShowAvatar ? 'mb-2' : 'mb-0.5'
      ]"
    >
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
      
      <div
        class="max-w-xs lg:max-w-md rounded-2xl shadow-apple transition-all duration-200 hover:shadow-apple-lg overflow-visible relative group"
        :class="[
          isOwnMessage 
            ? 'bg-system-blue text-white rounded-br-sm' 
            : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100',
          !shouldShowAvatar && !isOwnMessage ? 'ml-10' : '',
          !shouldShowAvatar && isOwnMessage ? 'mr-0' : ''
        ]"
      >
        <!-- Image -->
        <div v-if="message.fileType === 'image'" class="w-full relative">
          <div class="flex justify-start items-start max-w-full relative">
            <img
              :src="message.fileData"
              alt="Image"
              class="max-w-full max-h-[86px] w-auto h-auto object-contain rounded-xl cursor-pointer"
              @click="openImagePreview(message.fileData)"
            />
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

        <!-- Video -->
        <div v-else-if="message.fileType === 'video'" class="w-full relative">
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

        <!-- Audio/Voice -->
        <div v-else-if="message.fileType === 'audio'" class="px-3 py-2.5 relative">
          <div class="mb-2">
            <AudioPlayer 
              :src="message.fileData"
              :duration="message.duration || 0"
              :class="isOwnMessage ? 'bg-white/20 border-white/30' : ''"
            />
          </div>
          <div v-if="message.content">
            <p class="text-sm whitespace-pre-wrap break-words leading-relaxed" :class="isOwnMessage ? 'text-white' : 'text-gray-900'">
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
          <p class="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {{ message.content }}
          </p>
        </div>

        <!-- Timestamp tooltip (shown on hover) -->
        <div
          class="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50"
          :class="[
            isOwnMessage 
              ? 'right-full mr-2' 
              : 'left-full ml-2',
            'top-1/2 -translate-y-1/2'
          ]"
        >
          <div
            class="px-2 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-xl whitespace-nowrap"
          >
            {{ formatTimeTooltip(message.createdAt) }}
            <div
              class="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-[6px] border-transparent"
              :class="[
                isOwnMessage 
                  ? 'left-full border-l-gray-900' 
                  : 'right-full border-r-gray-900'
              ]"
            ></div>
          </div>
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
          <img
            :src="previewImageUrl"
            alt="Preview"
            class="max-w-full max-h-full object-contain rounded-lg"
            @click.stop
          />
          <button
            @click="showImagePreview = false"
            class="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { formatFileSize, getFileIcon } from '@/utils/fileUtils'
import AudioPlayer from '@/components/AudioPlayer.vue'

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
  }
})

const authStore = useAuthStore()
const showImagePreview = ref(false)
const previewImageUrl = ref('')

const isOwnMessage = computed(() => {
  return props.message.fromUserId === authStore.user?.uid
})

// Check if messages are from the same user and within 5 minutes
const isGroupedWithPrevious = computed(() => {
  if (!props.previousMessage) return false
  if (props.previousMessage.fromUserId !== props.message.fromUserId) return false
  
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

const openImagePreview = (imageUrl) => {
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
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
</style>

