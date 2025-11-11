<template>
  <div class="voice-recorder-container">
    <!-- Recording State -->
    <div v-if="recording" class="recording-state">
      <div class="flex items-center gap-2">
        <button
          @click="stopRecording"
          class="record-button recording"
          title="Dừng ghi âm"
        >
          <Icon name="stop" :size="14" />
        </button>
        <div class="flex-1">
          <div class="recording-indicator">
            <div class="pulse-dot"></div>
            <span class="recording-text">Đang ghi âm...</span>
            <span class="recording-duration">{{ formatDuration(recordingDuration) }}</span>
          </div>
          <div class="waveform-container">
            <div class="waveform-bar" v-for="i in 15" :key="i" :style="getWaveformStyle(i)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview State -->
    <div v-else-if="audioBlob" class="preview-state">
      <div class="flex items-center gap-2">
        <button
          @click="playPreview"
          :disabled="playing"
          class="play-button"
          :class="{ 'playing': playing }"
          title="Phát thử"
        >
          <Icon v-if="playing" name="pause" :size="12" />
          <Icon v-else name="play" :size="12" />
        </button>
        
        <div class="flex-1 audio-preview">
          <div class="audio-waveform">
            <div 
              class="waveform-bar-static" 
              v-for="i in 20" 
              :key="i"
              :class="{ 'active': playing && isBarActive(i) }"
            ></div>
          </div>
          <div class="audio-info">
            <span class="audio-duration">{{ formatDuration(recordingDuration) }}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            @click="sendVoice"
            :disabled="sending"
            class="send-button"
            title="Gửi"
          >
            <Icon v-if="sending" name="loading" :size="12" class="animate-spin" />
            <Icon v-else name="send" :size="12" />
          </button>
          <button
            @click="cancelVoice"
            class="cancel-button"
            title="Hủy"
          >
            <Icon name="close" :size="12" />
          </button>
        </div>
      </div>
      
      <audio ref="audioPlayer" :src="audioUrl" @ended="playing = false" @timeupdate="updateProgress" class="hidden"></audio>
    </div>

    <!-- Idle State -->
    <div v-else class="idle-state">
      <button
        @mousedown="startRecording"
        @mouseup="stopRecording"
        @mouseleave="stopRecording"
        @touchstart="startRecording"
        @touchend="stopRecording"
        class="record-button idle"
        title="Giữ để ghi âm"
      >
        <Icon name="microphone" :size="16" />
      </button>
      <span class="idle-text">Giữ để ghi âm</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed } from 'vue'
import Icon from './Icon.vue'

const emit = defineEmits(['send', 'cancel'])

const recording = ref(false)
const mediaRecorder = ref(null)
const audioStream = ref(null)
const audioChunks = ref([])
const audioBlob = ref(null)
const audioUrl = ref('')
const recordingDuration = ref(0)
const durationInterval = ref(null)
const sending = ref(false)
const audioPlayer = ref(null)
const playing = ref(false)
const currentTime = ref(0)
const waveformInterval = ref(null)

const startRecording = async () => {
  try {
    if (mediaRecorder.value && recording.value) {
      stopRecording()
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioStream.value = stream
    
    let mimeType = 'audio/webm'
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus'
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      mimeType = 'audio/webm'
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4'
    }
    
    mediaRecorder.value = new MediaRecorder(stream, { mimeType })
    audioChunks.value = []
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }
    
    mediaRecorder.value.onstop = () => {
      if (audioChunks.value.length > 0) {
        audioBlob.value = new Blob(audioChunks.value, { type: mimeType })
        audioUrl.value = URL.createObjectURL(audioBlob.value)
      }
      
      if (audioStream.value) {
        audioStream.value.getTracks().forEach(track => track.stop())
        audioStream.value = null
      }
    }
    
    mediaRecorder.value.onerror = (event) => {
      console.error('MediaRecorder error:', event.error)
      alert('Lỗi khi ghi âm: ' + (event.error?.message || 'Unknown error'))
      stopRecording()
    }
    
    mediaRecorder.value.start(100)
    recording.value = true
    recordingDuration.value = 0
    
    durationInterval.value = setInterval(() => {
      recordingDuration.value++
    }, 1000)
  } catch (error) {
    console.error('Error starting recording:', error)
    alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.')
    recording.value = false
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && recording.value) {
    try {
      if (mediaRecorder.value.state === 'recording') {
        mediaRecorder.value.stop()
      }
    } catch (error) {
      console.error('Error stopping recorder:', error)
    }
    recording.value = false
    
    if (durationInterval.value) {
      clearInterval(durationInterval.value)
      durationInterval.value = null
    }
    
    if (audioStream.value) {
      audioStream.value.getTracks().forEach(track => {
        if (track.state !== 'ended') {
          track.stop()
        }
      })
    }
  }
}

const playPreview = () => {
  if (!audioPlayer.value) return
  
  if (playing.value) {
    audioPlayer.value.pause()
    playing.value = false
    if (waveformInterval.value) {
      clearInterval(waveformInterval.value)
      waveformInterval.value = null
    }
  } else {
    audioPlayer.value.play()
    playing.value = true
    // Animate waveform
    waveformInterval.value = setInterval(() => {
      // Animation handled by CSS
    }, 100)
  }
}

const updateProgress = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime
  }
}

const isBarActive = (index) => {
  if (!playing.value || !audioPlayer.value) return false
  const progress = (audioPlayer.value.currentTime / audioPlayer.value.duration) * 20
  return index < progress
}

const getWaveformStyle = (index) => {
  if (!recording.value) return {}
  const height = Math.random() * 40 + 10
  return {
    height: `${height}%`,
    animationDelay: `${index * 0.05}s`
  }
}

const sendVoice = async () => {
  if (!audioBlob.value) {
    alert('Không có file ghi âm để gửi')
    return
  }
  
  sending.value = true
  try {
    const reader = new FileReader()
    
    reader.onload = () => {
      try {
        const base64Audio = reader.result
        
        if (base64Audio.length > 750 * 1024) {
          alert('File ghi âm quá lớn. Vui lòng ghi âm ngắn hơn.')
          sending.value = false
          return
        }
        
        const mimeType = audioBlob.value.type || 'audio/webm'
        
        const voiceData = {
          type: 'audio',
          data: base64Audio,
          duration: recordingDuration.value,
          mimeType: mimeType,
          filename: `voice_${Date.now()}.${mimeType.includes('webm') ? 'webm' : 'mp4'}`,
          size: audioBlob.value.size
        }
        
        emit('send', voiceData)
        
        audioBlob.value = null
        if (audioUrl.value) {
          URL.revokeObjectURL(audioUrl.value)
        }
        audioUrl.value = ''
        audioChunks.value = []
        recordingDuration.value = 0
        sending.value = false
        playing.value = false
        mediaRecorder.value = null
      } catch (error) {
        console.error('Error processing voice data:', error)
        alert('Lỗi khi xử lý file ghi âm: ' + error.message)
        sending.value = false
      }
    }
    
    reader.onerror = () => {
      console.error('FileReader error')
      alert('Lỗi khi xử lý file ghi âm')
      sending.value = false
    }
    
    reader.readAsDataURL(audioBlob.value)
  } catch (error) {
    console.error('Error sending voice:', error)
    alert('Lỗi khi gửi ghi âm: ' + error.message)
    sending.value = false
  }
}

const cancelVoice = () => {
  if (mediaRecorder.value && recording.value) {
    stopRecording()
  }
  
  if (audioStream.value) {
    audioStream.value.getTracks().forEach(track => {
      if (track.state !== 'ended') {
        track.stop()
      }
    })
    audioStream.value = null
  }
  
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
  
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value.currentTime = 0
  }
  
  audioBlob.value = null
  audioUrl.value = ''
  audioChunks.value = []
  recordingDuration.value = 0
  sending.value = false
  playing.value = false
  currentTime.value = 0
  mediaRecorder.value = null
  
  if (waveformInterval.value) {
    clearInterval(waveformInterval.value)
    waveformInterval.value = null
  }
  
  emit('cancel')
}

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onUnmounted(() => {
  if (durationInterval.value) {
    clearInterval(durationInterval.value)
  }
  
  if (waveformInterval.value) {
    clearInterval(waveformInterval.value)
  }
  
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
  
  if (mediaRecorder.value && recording.value) {
    stopRecording()
  }
  
  if (audioStream.value) {
    audioStream.value.getTracks().forEach(track => {
      if (track.state !== 'ended') {
        track.stop()
      }
    })
  }
})
</script>

<style scoped>
.voice-recorder-container {
  @apply w-fit max-w-xs;
}

/* Recording State */
.recording-state {
  @apply p-2 bg-red-50 rounded-xl border border-red-200 w-fit max-w-xs;
}

.record-button {
  @apply w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0;
}

.record-button.idle {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95;
}

.record-button.recording {
  @apply bg-red-500 text-white hover:bg-red-600 active:scale-95;
}

.recording-indicator {
  @apply flex items-center gap-1.5 mb-1;
}

.pulse-dot {
  @apply w-1.5 h-1.5 bg-red-500 rounded-full;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.recording-text {
  @apply text-xs font-medium text-red-700;
}

.recording-duration {
  @apply text-xs font-mono text-red-600 ml-auto;
}

.waveform-container {
  @apply flex items-end gap-0.5 h-5;
}

.waveform-bar {
  @apply w-0.5 bg-red-400 rounded-full;
  animation: waveform 0.8s ease-in-out infinite;
}

@keyframes waveform {
  0%, 100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}

/* Preview State */
.preview-state {
  @apply p-2 bg-gray-50 rounded-xl border border-gray-200 w-fit;
}

.play-button {
  @apply w-7 h-7 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-all flex-shrink-0;
}

.play-button.playing {
  @apply bg-gray-600;
}

.audio-preview {
  @apply flex-1 min-w-0;
}

.audio-waveform {
  @apply flex items-end gap-0.5 h-5 mb-0.5;
}

.waveform-bar-static {
  @apply w-0.5 bg-gray-300 rounded-full transition-all duration-150;
  height: 20%;
}

.waveform-bar-static.active {
  @apply bg-black;
  height: 100%;
  animation: waveform-play 0.3s ease-in-out;
}

@keyframes waveform-play {
  0%, 100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1.2);
  }
}

.audio-info {
  @apply flex items-center justify-between;
}

.audio-duration {
  @apply text-[10px] text-gray-500 font-mono;
}

.send-button {
  @apply w-7 h-7 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-all;
}

.cancel-button {
  @apply w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-all;
}

/* Idle State */
.idle-state {
  @apply flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200 w-fit;
}

.idle-text {
  @apply text-xs text-gray-600;
}
</style>
