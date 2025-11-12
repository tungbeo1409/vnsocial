<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 px-4 py-8 relative overflow-hidden">
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center relative z-10">
      <!-- Welcome Section -->
      <div class="hidden md:block text-white space-y-6 animate-fade-in">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="VN Social Logo" 
              class="w-16 h-16 object-contain bg-white/20 rounded-2xl p-2 backdrop-blur-sm"
            />
            <h1 class="text-4xl font-bold">VN Social</h1>
          </div>
          <p class="text-xl text-white/90 font-medium">Tham gia cộng đồng ngay hôm nay!</p>
          <p class="text-white/80 leading-relaxed">
            Tạo tài khoản miễn phí và bắt đầu hành trình kết nối với bạn bè, 
            chia sẻ những khoảnh khắc đáng nhớ và khám phá thế giới xung quanh.
          </p>
        </div>
        
        <!-- Features List -->
        <div class="space-y-3 pt-4">
          <div class="flex items-center gap-3 text-white/90">
            <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <span class="text-lg">🚀</span>
            </div>
            <span>Đăng ký miễn phí và dễ dàng</span>
          </div>
          <div class="flex items-center gap-3 text-white/90">
            <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <span class="text-lg">🔐</span>
            </div>
            <span>Bảo mật thông tin cá nhân</span>
          </div>
          <div class="flex items-center gap-3 text-white/90">
            <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <span class="text-lg">✨</span>
            </div>
            <span>Trải nghiệm giao diện hiện đại</span>
          </div>
        </div>
      </div>

      <!-- Register Form -->
      <div class="w-full max-w-md mx-auto">
        <Transition name="slide-up">
          <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-6 animate-fade-in">
            <div class="text-center space-y-2">
              <div class="flex justify-center mb-4">
                <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <img 
                    src="/logo.png" 
                    alt="VN Social Logo" 
                    class="w-12 h-12 object-contain"
                  />
                </div>
              </div>
              <h2 class="text-3xl font-bold text-gray-900">Đăng Ký</h2>
              <p class="text-sm text-gray-500">Tạo tài khoản mới để bắt đầu</p>
            </div>
            
            <form @submit.prevent="handleRegister" class="space-y-4">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Tên hiển thị</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-gray-400 text-sm">👤</span>
                  </div>
                  <input
                    v-model="displayName"
                    type="text"
                    required
                    class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Tên người dùng</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-gray-400 text-sm">@</span>
                  </div>
                  <input
                    v-model="username"
                    type="text"
                    required
                    class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="username"
                  />
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Email</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-gray-400 text-sm">✉️</span>
                  </div>
                  <input
                    v-model="email"
                    type="email"
                    required
                    class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Mật khẩu</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-gray-400 text-sm">🔒</span>
                  </div>
                  <input
                    v-model="password"
                    type="password"
                    required
                    minlength="6"
                    class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <p class="text-xs text-gray-500">Tối thiểu 6 ký tự</p>
              </div>
              
              <Transition name="fade">
                <div v-if="error" class="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{{ error }}</span>
                </div>
              </Transition>
              
              <button
                type="submit"
                :disabled="loading"
                class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span v-if="loading" class="flex items-center justify-center gap-2">
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Đang đăng ký...</span>
                </span>
                <span v-else class="flex items-center justify-center gap-2">
                  <span>Đăng Ký</span>
                  <span>→</span>
                </span>
              </button>
            </form>
            
            <div class="pt-4 border-t border-gray-200">
              <p class="text-center text-sm text-gray-600">
                Đã có tài khoản?
                <router-link to="/login" class="text-purple-600 hover:text-purple-700 font-semibold ml-1 transition-colors">
                  Đăng nhập
                </router-link>
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const displayName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''
  loading.value = true
  
  const result = await authStore.register(
    email.value,
    password.value,
    displayName.value,
    username.value
  )
  
  if (result.success) {
    router.push('/')
  } else {
    error.value = result.error || 'Đăng ký thất bại'
  }
  
  loading.value = false
}
</script>

