<template>
  <div class="page-container pb-20">
    <!-- Top Navigation Bar -->
    <TopNavBar />

    <!-- Main Content -->
    <main class="page-main space-y-6">
      <!-- Create Post -->
      <div class="animate-fade-in">
        <CreatePost />
      </div>

      <!-- Posts Feed -->
      <div class="space-y-8">
        <TransitionGroup name="list" tag="div" class="space-y-8">
          <PostCard
            v-for="(post, index) in postsStore.posts"
            :key="post.id"
            :post="post"
            :style="{ 'animation-delay': `${index * 50}ms` }"
            class="animate-slide-up"
          />
        </TransitionGroup>
        
        <div v-if="postsStore.posts.length === 0" class="empty-state card">
          <Icon name="home" :size="48" class="mx-auto mb-4 text-gray-400" />
          <p class="empty-state-title">Chưa có bài viết nào</p>
          <p class="empty-state-description">Hãy tạo bài viết đầu tiên để chia sẻ với mọi người!</p>
        </div>
      </div>
    </main>

    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import { useNotificationsStore } from '@/stores/notifications'
import CreatePost from '@/components/CreatePost.vue'
import PostCard from '@/components/PostCard.vue'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'
import Icon from '@/components/Icon.vue'

const authStore = useAuthStore()
const postsStore = usePostsStore()
const notificationsStore = useNotificationsStore()

let unsubscribe = null
let notificationsUnsubscribe = null

onMounted(async () => {
  unsubscribe = postsStore.subscribeToPosts()
  
  // Subscribe to notifications realtime
  if (authStore.user) {
    notificationsUnsubscribe = notificationsStore.subscribeToNotifications(authStore.user.uid)
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  if (notificationsUnsubscribe) {
    notificationsUnsubscribe()
  }
})
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>

