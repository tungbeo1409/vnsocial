<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4">
    <div class="card max-w-md w-full">
      <div class="flex flex-col items-center mb-6">
        <img 
          src="/logo.png" 
          alt="VN Social Logo" 
          class="w-16 h-16 object-contain mb-4"
        />
        <h1 class="text-3xl font-bold text-center text-primary-600">Đăng Nhập</h1>
        <p class="text-sm text-gray-500 mt-1">VN Social</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="input-field"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
          <input
            v-model="password"
            type="password"
            required
            class="input-field"
            placeholder="••••••••"
          />
        </div>
        
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>
        
        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full"
        >
          <span v-if="loading">Đang đăng nhập...</span>
          <span v-else>Đăng Nhập</span>
        </button>
      </form>
      
      <p class="mt-4 text-center text-sm text-gray-600">
        Chưa có tài khoản?
        <router-link to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
          Đăng ký ngay
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  const result = await authStore.login(email.value, password.value)
  
  if (result.success) {
    router.push('/')
  } else {
    error.value = result.error || 'Đăng nhập thất bại'
  }
  
  loading.value = false
}
</script>

