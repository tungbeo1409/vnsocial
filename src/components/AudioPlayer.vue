<template>
  <div class="audio-player">
    <button
      @click="togglePlay"
      class="play-button"
      :class="{ 'playing': isPlaying }"
      :title="isPlaying ? 'Tạm dừng' : 'Phát'"
    >
      <Icon v-if="isPlaying" name="pause" :size="12" />
      <Icon v-else name="play" :size="12" />
    </button>
    
    <div class="audio-content">
      <div class="waveform-container">
        <div
          v-for="i in 20"
          :key="i"
          class="waveform-bar"
          :class="{ 'active': isPlaying && isBarActive(i) }"
          :style="getBarStyle(i)"
        ></div>
      </div>
      <div class="audio-info">
        <span class="duration">{{ formatDuration(currentTime) }}</span>
        <span v-if="totalDuration > 0" class="separator">/</span>
        <span v-if="totalDuration > 0" class="total-duration">{{ formatDuration(totalDuration) }}</span>
        <span v-else class="total-duration text-gray-400">--:--</span>
      </div>
    </div>
    
    <audio
      ref="audioElement"
      :src="src"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      class="hidden"
    ></audio>
  </div>
</template>

<script setup>
import { ref, onUnmounted, onMounted, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  }
})

const audioElement = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const totalDuration = ref(0)

const onLoadedMetadata = () => {
  if (audioElement.value) {
    const audioDuration = audioElement.value.duration
    if (audioDuration && isFinite(audioDuration) && !isNaN(audioDuration)) {
      totalDuration.value = audioDuration
    } else if (props.duration && props.duration > 0) {
      totalDuration.value = props.duration
    } else {
      totalDuration.value = 0
    }
  }
}

// Also try to get duration when component mounts
onMounted(() => {
  if (props.duration && props.duration > 0) {
    totalDuration.value = props.duration
  }
  
  // Try to load metadata if audio element exists
  if (audioElement.value) {
    audioElement.value.load()
  }
})

// Watch for src changes
watch(() => props.src, () => {
  if (audioElement.value) {
    audioElement.value.load()
  }
})

const onTimeUpdate = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
  }
}

const onEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
  if (audioElement.value) {
    audioElement.value.currentTime = 0
  }
}

const togglePlay = () => {
  if (!audioElement.value) return
  
  if (isPlaying.value) {
    audioElement.value.pause()
    isPlaying.value = false
  } else {
    audioElement.value.play()
    isPlaying.value = true
  }
}

const isBarActive = (index) => {
  if (!isPlaying.value || totalDuration.value === 0) return false
  const progress = (currentTime.value / totalDuration.value) * 20
  return index < progress
}

const getBarStyle = (index) => {
  const baseHeight = 20 + (index % 3) * 10
  return {
    height: `${baseHeight}%`
  }
}

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }
})
</script>

<style scoped>
.audio-player {
  @apply flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200 w-fit max-w-xs;
}

.play-button {
  @apply w-7 h-7 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-all flex-shrink-0;
}

.play-button.playing {
  @apply bg-gray-600;
}

.audio-content {
  @apply min-w-0;
}

.waveform-container {
  @apply flex items-end gap-0.5 h-5 mb-1;
}

.waveform-bar {
  @apply w-0.5 bg-gray-300 rounded-full transition-all duration-200;
}

.waveform-bar.active {
  @apply bg-black;
  animation: waveform-play 0.4s ease-in-out;
}

@keyframes waveform-play {
  0%, 100% {
    transform: scaleY(0.8);
  }
  50% {
    transform: scaleY(1.3);
  }
}

.audio-info {
  @apply flex items-center gap-1 text-[10px] text-gray-500;
}

.duration {
  @apply font-mono;
}

.separator {
  @apply text-gray-400;
}

.total-duration {
  @apply font-mono text-gray-400;
}
</style>

