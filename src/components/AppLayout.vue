<template>
  <div class="page-container pb-20">
    <!-- Top Navigation Bar -->
    <TopNavBar />
    
    <!-- Main Content -->
    <slot />
    
    <!-- Floating Chat Windows (only on Home page) -->
    <TransitionGroup v-if="showFloatingChats" name="chat-window" tag="div">
      <FloatingChat
        v-for="(userId, index) in openChats"
        :key="userId"
        :other-user-id="userId"
        :index="index"
        @close="closeFloatingChat(userId)"
      />
    </TransitionGroup>

    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'
import FloatingChat from '@/components/FloatingChat.vue'
import { chatBus } from '@/utils/chatBus'

const route = useRoute()
const openChats = ref([])
const showFloatingChats = ref(false)

// Only show floating chats on home page
if (route.path === '/') {
  showFloatingChats.value = true
}

const openFloatingChat = (userId) => {
  if (!openChats.value.includes(userId)) {
    openChats.value.push(userId)
  }
}

const closeFloatingChat = (userId) => {
  openChats.value = openChats.value.filter(id => id !== userId)
}

// Provide chat functions to child components
provide('openFloatingChat', openFloatingChat)
provide('closeFloatingChat', closeFloatingChat)

// Listen to chat bus for opening chats
onMounted(() => {
  if (showFloatingChats.value) {
    chatBus.onOpenChat(openFloatingChat)
  }
})
</script>

