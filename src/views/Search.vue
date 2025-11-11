<template>
  <div class="page-container pb-20">
    <!-- Top Navigation Bar -->
    <TopNavBar />

    <!-- Main Content -->
    <main class="page-main">
      <!-- Search Input -->
      <div class="mb-6">
        <div class="relative">
          <input
            v-model="searchTerm"
            @input="handleSearch"
            @keydown.enter="handleSearch"
            type="text"
            placeholder="Tìm theo tên hoặc username..."
            class="input-search"
          />
          <Icon name="search" :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="friendsStore.loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Đang tìm kiếm...</p>
      </div>

      <!-- Search Results -->
      <div v-else-if="searchResults.length > 0" class="space-y-3">
        <h2 class="section-title">
          Kết quả tìm kiếm ({{ searchResults.length }})
        </h2>
        <div
          v-for="user in searchResults"
          :key="user.id"
          class="flex items-center justify-between p-4 card-hover animate-fade-in"
        >
          <router-link :to="`/profile/${user.id}`" class="flex items-center gap-4 flex-1 group">
            <img
              v-if="user.avatar"
              :src="user.avatar"
              :alt="user.displayName"
              class="w-14 h-14 rounded-full object-cover group-hover:ring-2 group-hover:ring-blue-500 transition-all"
            />
            <img
              v-else
              src="/user.png"
              :alt="user.displayName"
              class="w-14 h-14 rounded-full object-cover group-hover:ring-2 group-hover:ring-blue-500 transition-all"
            />
            <div>
              <p class="font-semibold text-gray-900 group-hover:text-blue-500 transition-colors">
                {{ user.displayName }}
              </p>
              <p class="text-sm text-gray-500">@{{ user.username }}</p>
            </div>
          </router-link>
          
          <div class="flex items-center gap-2">
            <button
              v-if="user.id !== authStore.user?.uid"
              type="button"
              @click="handleFriendAction(user.id, $event)"
              :disabled="actionLoading[user.id]"
              class="px-4 py-2 rounded-full font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :class="{
                'bg-gray-100 text-gray-700 hover:bg-gray-200': friendshipStatus[user.id] === 'friends' || friendshipStatus[user.id] === 'sent',
                'bg-black text-white hover:bg-gray-800': !friendshipStatus[user.id] || friendshipStatus[user.id] === 'none' || friendshipStatus[user.id] === 'received'
              }"
            >
              <span v-if="actionLoading[user.id]" class="flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              </span>
              <span v-else-if="friendshipStatus[user.id] === 'friends'">Bạn bè</span>
              <span v-else-if="friendshipStatus[user.id] === 'sent'">Đã gửi</span>
              <span v-else-if="friendshipStatus[user.id] === 'received'">Chấp nhận</span>
              <span v-else>Kết bạn</span>
            </button>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="searchTerm.length >= 2" class="text-center py-16">
        <Icon name="search" :size="64" class="mx-auto mb-4 text-gray-300" />
        <p class="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy kết quả</p>
        <p class="text-sm text-gray-500">Thử tìm kiếm với từ khóa khác</p>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <Icon name="search" :size="64" class="mx-auto mb-4 text-gray-300" />
        <p class="text-lg font-semibold text-gray-900 mb-2">Tìm kiếm bạn bè</p>
        <p class="text-sm text-gray-500">Nhập tên hoặc username để tìm kiếm...</p>
      </div>
    </main>
    
    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFriendsStore } from '@/stores/friends'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const authStore = useAuthStore()
const friendsStore = useFriendsStore()

const searchTerm = ref('')
const searchResults = ref([])
const friendshipStatus = ref({})
const actionLoading = ref({})

// Read query from URL on mount
onMounted(() => {
  const query = route.query.q
  if (query && typeof query === 'string') {
    searchTerm.value = query
    handleSearch()
  }
})

// Watch for route query changes
watch(() => route.query.q, (newQuery) => {
  if (newQuery && typeof newQuery === 'string' && newQuery !== searchTerm.value) {
    searchTerm.value = newQuery
    handleSearch()
  }
})

const handleSearch = async () => {
  if (searchTerm.value.length < 2) {
    searchResults.value = []
    return
  }

  const results = await friendsStore.searchUsers(searchTerm.value)
  searchResults.value = results.filter(user => user.id !== authStore.user?.uid)

  // Load friendship status for each user
  for (const user of searchResults.value) {
    const status = await friendsStore.getFriendshipStatus(authStore.user.uid, user.id)
    friendshipStatus.value[user.id] = status
  }
}

const handleFriendAction = async (targetUserId, event) => {
  // Prevent default form submission
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  // Prevent double-click
  if (actionLoading.value[targetUserId]) {
    return
  }
  
  actionLoading.value[targetUserId] = true

  try {
    const status = friendshipStatus.value[targetUserId]
    let result

    if (status === 'none') {
      // Send friend request
      result = await friendsStore.sendFriendRequest(authStore.user.uid, targetUserId)
      if (result.success) {
        friendshipStatus.value[targetUserId] = 'sent'
      }
    } else if (status === 'received') {
      // Accept friend request
      result = await friendsStore.acceptFriendRequest(authStore.user.uid, targetUserId)
      if (result.success) {
        friendshipStatus.value[targetUserId] = 'friends'
      }
    } else if (status === 'sent') {
      // Cancel friend request
      result = await friendsStore.cancelFriendRequest(authStore.user.uid, targetUserId)
      if (result.success) {
        friendshipStatus.value[targetUserId] = 'none'
      }
    } else if (status === 'friends') {
      // Remove friend
      if (confirm('Bạn có chắc muốn hủy kết bạn?')) {
        result = await friendsStore.removeFriend(authStore.user.uid, targetUserId)
        if (result.success) {
          friendshipStatus.value[targetUserId] = 'none'
        }
      }
    }

    if (result && !result.success) {
      alert(result.error || 'Có lỗi xảy ra')
    }
  } catch (error) {
    console.error('Error handling friend action:', error)
    alert('Có lỗi xảy ra')
  } finally {
    actionLoading.value[targetUserId] = false
  }
}
</script>

