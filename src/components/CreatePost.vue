<template>
  <div class="bg-white border border-gray-200 rounded-2xl p-4">
    <form @submit.prevent="handleSubmit" class="space-y-3">
      <div class="flex items-start gap-3">
        <img
          v-if="authStore.userProfile?.avatar"
          :src="authStore.userProfile.avatar"
          :alt="authStore.userProfile.displayName"
          class="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <img
          v-else
          src="/user.png"
          alt="User"
          class="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <textarea
          v-model="content"
          placeholder="Bạn đang nghĩ gì?"
          rows="2"
          class="flex-1 min-h-[60px] px-3 py-2 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-0 focus:bg-white transition-colors resize-none text-sm text-gray-900 placeholder:text-gray-400"
        ></textarea>
      </div>
      
      <!-- Multiple Images Preview Grid -->
      <Transition name="slide-down">
        <div v-if="images.length > 0" class="grid grid-cols-3 gap-2">
          <TransitionGroup name="image-item" tag="div" class="contents">
            <div
              v-for="(image, index) in images"
              :key="`image-${index}-${image.preview?.substring(0, 20)}`"
              class="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 group"
            >
              <img
                :src="image.preview"
                :alt="`Image ${index + 1}`"
                class="w-full h-full object-cover"
              />
              <button
                type="button"
                @click="removeImage(index)"
                class="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                title="Xóa ảnh"
              >
                <Icon name="close" :size="12" />
              </button>
            </div>
          </TransitionGroup>
        </div>
      </Transition>

      <!-- Video Preview -->
      <Transition name="slide-down">
        <div v-if="videoPreview" class="relative rounded-xl overflow-hidden border border-gray-200">
          <video 
            :src="videoPreview" 
            controls
            class="w-full h-48 object-cover"
          ></video>
          <button
            type="button"
            @click="removeVideo"
            class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-all"
            title="Xóa video"
          >
            <Icon name="close" :size="16" />
          </button>
        </div>
      </Transition>

      <!-- Audio Preview -->
      <Transition name="slide-down">
        <div v-if="audioPreview && audioData" class="relative">
          <AudioPlayer 
            :src="audioPreview.data" 
            :duration="audioPreview.duration"
            class="mb-2"
          />
          <button
            type="button"
            @click="removeAudio"
            class="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all flex items-center justify-center"
            title="Xóa ghi âm"
          >
            <Icon name="close" :size="12" />
          </button>
        </div>
      </Transition>

      <!-- Voice Recorder -->
      <Transition name="slide-down">
        <div v-if="showVoiceRecorder" class="pt-2 border-t border-gray-100">
          <VoiceRecorder 
            @send="handleVoiceSend" 
            @cancel="showVoiceRecorder = false" 
          />
        </div>
      </Transition>
      
      <div class="flex items-center justify-between pt-2 border-t border-gray-100">
        <div class="flex items-center gap-3">
          <!-- Image (Multiple) -->
          <label class="cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              @change="handleImageSelect"
              multiple
              class="hidden"
            />
            <span class="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 cursor-pointer transition-colors text-sm">
              <Icon name="photo" :size="18" />
              <span class="hidden sm:inline">Ảnh</span>
            </span>
          </label>

          <!-- Video -->
          <label class="cursor-pointer group">
            <input
              type="file"
              accept="video/*"
              @change="handleVideoSelect"
              class="hidden"
            />
            <span class="flex items-center gap-1.5 text-gray-600 hover:text-red-500 cursor-pointer transition-colors text-sm">
              <Icon name="video" :size="18" />
              <span class="hidden sm:inline">Video</span>
            </span>
          </label>

          <!-- Voice -->
          <button
            type="button"
            @click="showVoiceRecorder = !showVoiceRecorder"
            class="flex items-center gap-1.5 text-gray-600 hover:text-purple-500 cursor-pointer transition-colors text-sm"
            :class="{ 'text-purple-500': showVoiceRecorder }"
          >
            <Icon name="microphone" :size="18" />
            <span class="hidden sm:inline">Ghi âm</span>
          </button>
        </div>
        
        <button
          type="submit"
          :disabled="loading || (!content.trim() && images.length === 0 && !videoData && !audioData)"
          class="px-4 py-1.5 bg-black text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <span v-if="loading" class="flex items-center gap-1.5">
            <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span class="hidden sm:inline">Đang đăng...</span>
          </span>
          <span v-else class="flex items-center gap-1.5">
            <span class="hidden sm:inline">Đăng</span>
            <Icon name="send" :size="14" />
          </span>
        </button>
      </div>
      
      <Transition name="slide-down">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs">
          {{ error }}
        </div>
      </Transition>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePostsStore } from '@/stores/posts'
import { useAuthStore } from '@/stores/auth'
import { compressImage, compressVideo } from '@/utils/fileUtils'
import Icon from '@/components/Icon.vue'
import VoiceRecorder from '@/components/VoiceRecorder.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'

const postsStore = usePostsStore()
const authStore = useAuthStore()

const content = ref('')
const images = ref([]) // Array of { data: base64, preview: base64 }
const videoData = ref(null)
const videoPreview = ref(null)
const audioData = ref(null)
const audioPreview = ref(null)
const showVoiceRecorder = ref(false)
const loading = ref(false)
const error = ref('')

const handleImageSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return

  error.value = ''
  loading.value = true

  try {
    for (const file of files) {
      // Check file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        error.value = `Ảnh "${file.name}" quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB.`
        continue
      }

      // Compress image
      const compressedBase64 = await compressImage(file, 800, 800, 0.8)
      
      // Check if base64 string is too large
      if (compressedBase64.length > 750 * 1024) {
        error.value = `Ảnh "${file.name}" quá lớn sau khi nén. Vui lòng chọn ảnh nhỏ hơn.`
        continue
      }

      images.value.push({
        data: compressedBase64,
        preview: compressedBase64
      })
    }
  } catch (err) {
    error.value = err.message || 'Không thể xử lý ảnh. Vui lòng thử lại.'
    console.error('Image processing error:', err)
  } finally {
    loading.value = false
    event.target.value = ''
  }
}

const removeImage = (index) => {
  images.value.splice(index, 1)
  error.value = ''
}

const handleVideoSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  error.value = ''
  loading.value = true

  try {
    // Firestore limit is ~1MB per field
    // Base64 is ~33% larger than original, so max ~750KB original = ~1MB base64
    // We'll limit to 700KB original to be safe
    const maxVideoSize = 700 * 1024 // 700KB
    
    if (file.size > maxVideoSize) {
      error.value = `Video quá lớn! Firestore chỉ cho phép video nhỏ hơn ${(maxVideoSize / 1024).toFixed(0)}KB. Video của bạn: ${(file.size / 1024).toFixed(0)}KB. Vui lòng chọn video ngắn hơn hoặc nén video trước khi upload.`
      loading.value = false
      event.target.value = ''
      return
    }

    const base64Data = await compressVideo(file, maxVideoSize / 1024 / 1024)
    
    // Double check base64 size (should be < 1MB)
    const maxBase64Size = 1024 * 1024 - 1000 // 1MB - 1KB buffer
    if (base64Data.length > maxBase64Size) {
      error.value = `Video quá lớn sau khi xử lý (${(base64Data.length / 1024).toFixed(0)}KB). Vui lòng chọn video nhỏ hơn.`
      loading.value = false
      event.target.value = ''
      return
    }
    
    console.log('Video processed:', {
      originalSize: (file.size / 1024).toFixed(0) + 'KB',
      base64Size: (base64Data.length / 1024).toFixed(0) + 'KB',
      ratio: ((base64Data.length / file.size) * 100).toFixed(1) + '%'
    })

    videoData.value = {
      type: 'video',
      data: base64Data,
      filename: file.name,
      size: file.size,
      mimeType: file.type
    }
    videoPreview.value = base64Data
  } catch (err) {
    error.value = err.message || 'Không thể xử lý video. Vui lòng thử lại.'
    console.error('Video processing error:', err)
  } finally {
    loading.value = false
    event.target.value = ''
  }
}

const removeVideo = () => {
  videoData.value = null
  videoPreview.value = null
  error.value = ''
}

const handleVoiceSend = (voiceData) => {
  console.log('handleVoiceSend called with:', { 
    type: voiceData?.type, 
    hasData: !!voiceData?.data, 
    duration: voiceData?.duration,
    filename: voiceData?.filename 
  })
  audioData.value = voiceData
  audioPreview.value = {
    data: voiceData.data,
    duration: voiceData.duration
  }
  showVoiceRecorder.value = false
  console.log('audioData.value after set:', { 
    type: audioData.value?.type, 
    hasData: !!audioData.value?.data 
  })
}

const removeAudio = () => {
  audioData.value = null
  audioPreview.value = null
  showVoiceRecorder.value = false
  error.value = ''
}

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleSubmit = async () => {
  if (!content.value.trim() && images.value.length === 0 && !videoData.value && !audioData.value) {
    error.value = 'Vui lòng nhập nội dung hoặc chọn file.'
    return
  }

  error.value = ''
  loading.value = true
  
  try {
    // Prepare file data for post - allow multiple types together
    let fileData = null
    
    console.log('Submit - images:', images.value.length, 'video:', !!videoData.value, 'audio:', !!audioData.value)
    
    // Can have images + audio/video together
    if (images.value.length > 0) {
      // Multiple images - store as array
      fileData = {
        type: 'images',
        images: images.value.map(img => img.data), // Array of base64 images
        count: images.value.length
      }
      
      // Add audio if exists (can combine with images)
      if (audioData.value) {
        console.log('Adding audio to images post')
        fileData.audio = {
          type: 'audio',
          data: audioData.value.data,
          duration: audioData.value.duration,
          filename: audioData.value.filename,
          size: audioData.value.size,
          mimeType: audioData.value.mimeType
        }
      }
      
      // Add video if exists (can combine with images)
      if (videoData.value) {
        fileData.video = {
          type: 'video',
          data: videoData.value.data,
          filename: videoData.value.filename,
          size: videoData.value.size,
          mimeType: videoData.value.mimeType
        }
      }
    } else if (videoData.value) {
      // Video only, but can have audio too
      fileData = { ...videoData.value }
      if (audioData.value) {
        console.log('Adding audio to video post')
        fileData.audio = {
          type: 'audio',
          data: audioData.value.data,
          duration: audioData.value.duration,
          filename: audioData.value.filename,
          size: audioData.value.size,
          mimeType: audioData.value.mimeType
        }
      }
    } else if (audioData.value) {
      // Audio only
      console.log('Audio only post:', audioData.value)
      fileData = audioData.value
    }
    
    console.log('Final fileData:', fileData ? { type: fileData.type, hasAudio: !!fileData.audio, hasVideo: !!fileData.video } : null)
    
    // Create post
    const result = await postsStore.createPost(
      content.value.trim(),
      images.value.length > 0 ? images.value[0].data : null, // First image for backward compatibility
      authStore.user.uid,
      authStore.userProfile?.displayName || 'User',
      authStore.userProfile?.avatar || '',
      fileData
    )
    
    if (result.success) {
      content.value = ''
      images.value = []
      removeVideo()
      removeAudio()
      if (window.showToast) {
        window.showToast('Đăng bài thành công!', 'success', '', 2000)
      }
    } else {
      error.value = result.error || 'Đăng bài thất bại'
      if (window.showToast) {
        window.showToast('Đăng bài thất bại', 'error', result.error || '', 3000)
      }
    }
  } catch (err) {
    error.value = err.message || 'Có lỗi xảy ra'
    console.error('Submit error:', err)
    if (window.showToast) {
      window.showToast('Đăng bài thất bại', 'error', err.message || '', 3000)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
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
