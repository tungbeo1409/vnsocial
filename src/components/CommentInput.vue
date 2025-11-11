<template>
  <div class="comment-input bg-white border-b border-gray-200 pb-3">
    <!-- File Preview -->
    <Transition name="slide-down">
      <div v-if="selectedFile" class="mb-3 p-3 bg-gray-50 rounded-xl">
        <div class="flex items-center gap-3">
          <div v-if="selectedFile.type === 'image'" class="flex-shrink-0">
            <img :src="selectedFile.preview" alt="Preview" class="w-16 h-16 object-cover rounded-lg" />
          </div>
          <div v-else-if="selectedFile.type === 'video'" class="flex-shrink-0">
            <video :src="selectedFile.preview" class="w-16 h-16 object-cover rounded-lg" muted></video>
          </div>
          <div v-else-if="selectedFile.type === 'sticker'" class="flex-shrink-0">
            <div class="w-16 h-16 text-4xl flex items-center justify-center bg-white rounded-lg">
              {{ selectedFile.data }}
            </div>
          </div>
          <div v-else class="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            <span class="text-2xl">{{ getFileIcon(selectedFile.filename) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ selectedFile.filename || 'File' }}</p>
            <p v-if="selectedFile.size" class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          <button
            @click="clearSelectedFile"
            class="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
            title="Xóa"
          >
            <Icon name="close" :size="18" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Voice Recorder -->
    <Transition name="slide-down">
      <div v-if="showVoiceRecorder" class="mb-3">
        <VoiceRecorder @send="handleSendVoice" @cancel="showVoiceRecorder = false" />
      </div>
    </Transition>

    <!-- Sticker Picker -->
    <Transition name="slide-down">
      <div v-if="showStickerPicker" class="mb-3 p-3 bg-white rounded-xl border border-gray-200 shadow-apple">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-semibold text-gray-700">Chọn sticker</p>
          <button
            @click="showStickerPicker = false"
            class="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Icon name="close" :size="18" />
          </button>
        </div>
        <div class="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto scrollbar-hide">
          <button
            v-for="sticker in stickers"
            :key="sticker"
            @click="selectSticker(sticker)"
            class="text-3xl hover:scale-110 transition-transform p-2 rounded-lg hover:bg-gray-100"
          >
            {{ sticker }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Input Area -->
    <div class="flex items-start gap-2">
      <input
        v-model="commentText"
        type="text"
        :placeholder="placeholder"
        class="input-field flex-1 text-sm py-2"
        @keydown.enter.exact.prevent="handleSubmit"
        @keydown.enter.shift.exact="commentText += '\n'"
      />
      <div class="flex items-center gap-1">
        <!-- File Buttons -->
        <label class="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Chọn ảnh">
          <input
            type="file"
            accept="image/*"
            @change="handleFileSelect($event, 'image')"
            class="hidden"
          />
          <Icon name="photo" :size="20" />
        </label>
        <label class="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Chọn video">
          <input
            type="file"
            accept="video/*"
            @change="handleFileSelect($event, 'video')"
            class="hidden"
          />
          <Icon name="video" :size="20" />
        </label>
        <label class="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Chọn file">
          <input
            type="file"
            @change="handleFileSelect($event, 'file')"
            class="hidden"
          />
          <Icon name="attachment" :size="20" />
        </label>
        <button
          @click="showVoiceRecorder = !showVoiceRecorder"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          :class="{ 'bg-gray-200': showVoiceRecorder }"
          title="Ghi âm"
        >
          <Icon name="microphone" :size="20" />
        </button>
        <button
          @click="showStickerPicker = !showStickerPicker"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          :class="{ 'bg-gray-200': showStickerPicker }"
          title="Sticker"
        >
          <Icon name="emoji" :size="20" />
        </button>
        <button
          @click="handleSubmit"
          :disabled="(!commentText.trim() && !selectedFile) || loading"
          class="px-4 py-2 bg-black text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span v-if="loading">...</span>
          <span v-else class="flex items-center gap-1">
            <span>Gửi</span>
            <Icon name="send" :size="14" />
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { compressImage, compressVideo, fileToBase64, formatFileSize, getFileIcon } from '@/utils/fileUtils'
import VoiceRecorder from '@/components/VoiceRecorder.vue'
import Icon from '@/components/Icon.vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Viết bình luận...'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit'])

const commentText = ref('')
const selectedFile = ref(null)
const showVoiceRecorder = ref(false)
const showStickerPicker = ref(false)

// Popular emoji stickers
const stickers = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
  '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
  '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '🤯',
  '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁',
  '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
  '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
  '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
  '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽',
  '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽',
  '🙀', '😿', '😾', '❤️', '🧡', '💛', '💚', '💙',
  '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
  '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️',
  '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️',
  '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍',
  '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️',
  '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸',
  '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️',
  '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑',
  '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫',
  '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞',
  '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️',
  '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰',
  '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐',
  '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️',
  '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺',
  '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️',
  '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕',
  '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣',
  '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '▶️', '⏸️', '⏯️',
  '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬',
  '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️',
  '↖️', '↘️', '↙️', '↔️', '↕️', '🔄', '↪️', '↩️',
  '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵',
  '🎶', '➕', '➖', '➗', '✖️', '💲', '💱', '™️',
  '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛',
  '🔜', '🔝', '✔️', '☑️', '🔘', '⚪', '⚫', '🔴',
  '🔵', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳',
  '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥',
  '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫',
  '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢',
  '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏',
  '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕',
  '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝',
  '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥',
  '🕦', '🕧'
]

const handleFileSelect = async (event, fileType) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    let base64Data = null
    let preview = null

    if (fileType === 'image') {
      base64Data = await compressImage(file)
      preview = base64Data
    } else if (fileType === 'video') {
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

    selectedFile.value = {
      type: fileType,
      data: base64Data,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      preview: preview
    }

    event.target.value = ''
  } catch (error) {
    console.error('Error processing file:', error)
    alert(error.message || 'Không thể xử lý file. Vui lòng thử lại.')
    event.target.value = ''
  }
}

const clearSelectedFile = () => {
  selectedFile.value = null
}

const handleSendVoice = (voiceData) => {
  selectedFile.value = voiceData
  showVoiceRecorder.value = false
}

const selectSticker = (sticker) => {
  selectedFile.value = {
    type: 'sticker',
    data: sticker,
    filename: 'sticker',
    preview: null
  }
  showStickerPicker.value = false
}

const handleSubmit = () => {
  if ((!commentText.value.trim() && !selectedFile.value)) return

  const fileData = selectedFile.value
  const content = commentText.value.trim()

  // Clear inputs
  commentText.value = ''
  selectedFile.value = null
  showVoiceRecorder.value = false
  showStickerPicker.value = false

  emit('submit', {
    content,
    fileData
  })
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

