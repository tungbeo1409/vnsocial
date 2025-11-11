<template>
  <div class="min-h-screen bg-black pb-20">
    <!-- Top Navigation Bar -->
    <TopNavBar />

    <!-- Video Feed (TikTok Style) -->
    <main class="relative h-[calc(100vh-80px)] overflow-hidden">
      <!-- Placeholder for video feed -->
      <div class="h-full flex items-center justify-center text-white">
        <div class="text-center">
          <Icon name="video" :size="64" class="mx-auto mb-4 text-gray-500" />
          <h2 class="text-2xl font-bold mb-2">Video Ngắn</h2>
          <p class="text-gray-400">Tính năng đang được phát triển</p>
        </div>
      </div>

      <!-- Video Controls (Right Side) -->
      <div class="absolute right-4 bottom-20 flex flex-col items-center gap-6">
        <!-- Avatar -->
        <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-white">
          <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            U
          </div>
        </div>
        
        <!-- Like -->
        <button class="flex flex-col items-center gap-1 text-white">
          <div class="w-12 h-12 rounded-full bg-gray-800/50 backdrop-blur-sm flex items-center justify-center hover:bg-gray-700/50 transition-colors">
            <Icon name="heart" :size="24" />
          </div>
          <span class="text-xs font-medium">0</span>
        </button>
        
        <!-- Comment -->
        <button class="flex flex-col items-center gap-1 text-white">
          <div class="w-12 h-12 rounded-full bg-gray-800/50 backdrop-blur-sm flex items-center justify-center hover:bg-gray-700/50 transition-colors">
            <Icon name="message" :size="24" />
          </div>
          <span class="text-xs font-medium">0</span>
        </button>
        
        <!-- Share -->
        <button class="flex flex-col items-center gap-1 text-white">
          <div class="w-12 h-12 rounded-full bg-gray-800/50 backdrop-blur-sm flex items-center justify-center hover:bg-gray-700/50 transition-colors">
            <Icon name="share" :size="24" />
          </div>
          <span class="text-xs font-medium">Chia sẻ</span>
        </button>
      </div>

      <!-- Video Info (Bottom) -->
      <div class="absolute bottom-20 left-4 right-20 text-white">
        <div class="flex items-center gap-2 mb-2">
          <span class="font-semibold">@username</span>
          <button class="px-4 py-1 bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
            Theo dõi
          </button>
        </div>
        <p class="text-sm mb-2">Video description goes here...</p>
        <div class="flex items-center gap-4 text-xs text-gray-300">
          <span>🎵 Original sound</span>
        </div>
      </div>
    </main>
    
    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'
import Icon from '@/components/Icon.vue'

const authStore = useAuthStore()
</script>

<style scoped>
/* TikTok-style vertical scroll */
main {
  scroll-snap-type: y mandatory;
}

/* Video items would snap */
.video-item {
  scroll-snap-align: start;
}
</style>

