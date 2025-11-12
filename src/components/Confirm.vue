<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isVisible"
        class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
        @click.self="handleCancel"
      >
        <Transition name="scale">
          <div
            v-if="isVisible"
            class="bg-white rounded-2xl shadow-apple-xl max-w-md w-full overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ title }}
              </h3>
            </div>
            
            <!-- Content -->
            <div class="px-6 py-4">
              <p class="text-sm text-gray-600 leading-relaxed">
                {{ message }}
              </p>
            </div>
            
            <!-- Actions -->
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                @click="handleCancel"
                class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {{ cancelText }}
              </button>
              <button
                @click="handleConfirm"
                class="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isVisible = ref(false)
const title = ref('Xác nhận')
const message = ref('')
const confirmText = ref('Xác nhận')
const cancelText = ref('Hủy')
let resolvePromise = null

const show = (msg, options = {}) => {
  message.value = msg
  title.value = options.title || 'Xác nhận'
  confirmText.value = options.confirmText || 'Xác nhận'
  cancelText.value = options.cancelText || 'Hủy'
  isVisible.value = true
  
  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

const handleConfirm = () => {
  isVisible.value = false
  if (resolvePromise) {
    resolvePromise(true)
    resolvePromise = null
  }
}

const handleCancel = () => {
  isVisible.value = false
  if (resolvePromise) {
    resolvePromise(false)
    resolvePromise = null
  }
}

// Handle ESC key
const handleEscape = (e) => {
  if (e.key === 'Escape' && isVisible.value) {
    handleCancel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

// Export để có thể dùng từ bất kỳ đâu
if (typeof window !== 'undefined') {
  window.showConfirm = show
}

defineExpose({ show })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease-out;
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>

