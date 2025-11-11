<template>
  <!-- Wrapper để có single root element -->
  <div>
    <div
      class="flex items-end gap-2 mb-3 animate-fade-in"
      :class="isOwnMessage ? 'flex-row-reverse' : 'flex-row'"
    >
      <!-- Avatar (only for other user's messages) -->
      <div v-if="!isOwnMessage && message.fromUserAvatar" class="flex-shrink-0">
        <img
          :src="message.fromUserAvatar"
          :alt="message.fromUserName || 'User'"
          class="w-8 h-8 rounded-full object-cover"
        />
      </div>
      <div v-else-if="!isOwnMessage" class="flex-shrink-0">
        <img
          src="/user.png"
          alt="User"
          class="w-8 h-8 rounded-full object-cover"
        />
      </div>
      
      <div
        class="max-w-xs lg:max-w-md rounded-2xl shadow-apple transition-all duration-200 hover:shadow-apple-lg overflow-hidden"
        :class="isOwnMessage 
          ? 'bg-system-blue text-white rounded-br-sm' 
          : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'"
      >
        <!-- Image -->
        <div v-if="message.fileType === 'image'" class="w-full">
          <div class="flex justify-start items-start max-w-full">
            <img
              :src="message.fileData"
              alt="Image"
              class="max-w-full max-h-[86px] w-auto h-auto object-contain rounded-xl cursor-pointer"
              @click="openImagePreview(message.fileData)"
            />
          </div>
          <div v-if="message.content" class="px-4 py-2">
            <p class="text-sm whitespace-pre-wrap break-words leading-relaxed" :class="isOwnMessage ? 'text-white' : 'text-gray-900'">
{{ message.content }}
            </p>
          </div>
        </div>

        <!-- Video -->
        <div v-else-if="message.fileType === 'video'" class="w-full">
          <div class="flex justify-start items-start max-w-full">
            <video
              :src="message.fileData"
              controls
              class="max-w-full max-h-[86px] w-auto h-auto object-contain rounded-xl"
            ></video>
          </div>
          <div v-if="message.content" class="px-4 py-2">
            <p class="text-sm whitespace-pre-wrap break-words leading-relaxed" :class="isOwnMessage ? 'text-white' : 'text-gray-900'">
              {{ message.content }}
            </p>
          </div>
        </div>

        <!-- Audio/Voice -->
        <div v-else-if="message.fileType === 'audio'" class="px-4 py-3">
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
        <div v-else-if="message.fileType === 'file'" class="px-4 py-3">
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
        <div v-else class="px-4 py-2.5">
          <p class="text-sm whitespace-pre-wrap break-words leading-relaxed">{{ message.content }}</p>
        </div>

        <!-- Timestamp -->
        <div class="px-4 pb-2">
          <p
            class="text-xs opacity-70"
            :class="isOwnMessage ? 'text-right text-white/80' : 'text-left text-gray-500'"
          >
            {{ formatTime(message.createdAt) }}
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
  }
})

const authStore = useAuthStore()
const showImagePreview = ref(false)
const previewImageUrl = ref('')

const isOwnMessage = computed(() => {
  return props.message.fromUserId === authStore.user?.uid
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

