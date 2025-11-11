<template>
  <TransitionGroup name="toast" tag="div" class="fixed top-4 right-4 z-50 space-y-2">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="min-w-[300px] max-w-md p-4 rounded-lg shadow-lg flex items-start gap-3"
      :class="getToastClass(toast.type)"
    >
      <span class="text-xl">{{ getIcon(toast.type) }}</span>
      <div class="flex-1">
        <p class="font-medium">{{ toast.message }}</p>
        <p v-if="toast.description" class="text-sm opacity-90 mt-1">{{ toast.description }}</p>
      </div>
      <button
        @click="removeToast(toast.id)"
        class="text-current opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  </TransitionGroup>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const toasts = ref([])

const getToastClass = (type) => {
  const classes = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white'
  }
  return classes[type] || classes.info
}

const getIcon = (type) => {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  }
  return icons[type] || icons.info
}

const addToast = (message, type = 'info', description = '', duration = 3000) => {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type, description })
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
  
  return id
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

// Export để có thể dùng từ bất kỳ đâu
if (typeof window !== 'undefined') {
  window.showToast = addToast
}

defineExpose({ addToast, removeToast })
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

