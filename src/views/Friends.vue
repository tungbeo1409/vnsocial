<template>
  <div class="page-container pb-20">
    <!-- Top Navigation Bar -->
    <TopNavBar />

    <!-- Main Content -->
    <main class="page-main">
      <div class="card">
        <h1 class="section-title">Bạn bè & Lời mời kết bạn</h1>
        
        <!-- Tabs -->
        <div class="flex gap-4 mb-6 border-b border-gray-200">
          <button
            @click="activeTab = 'friends'"
            class="px-4 py-2 font-medium text-sm transition-colors"
            :class="activeTab === 'friends' 
              ? 'text-system-blue border-b-2 border-system-blue' 
              : 'text-gray-600 hover:text-system-blue'"
          >
            Bạn bè
          </button>
          <button
            @click="activeTab = 'requests'"
            class="px-4 py-2 font-medium text-sm transition-colors"
            :class="activeTab === 'requests' 
              ? 'text-system-blue border-b-2 border-system-blue' 
              : 'text-gray-600 hover:text-system-blue'"
          >
            Lời mời kết bạn
            <span v-if="friendRequests.length > 0" class="ml-2 bg-system-blue text-white text-xs px-2 py-0.5 rounded-full">
              {{ friendRequests.length }}
            </span>
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Đang tải...</p>
        </div>

        <!-- Friends Tab -->
        <div v-else-if="activeTab === 'friends'">
          <div v-if="friends.length === 0" class="empty-state">
            <div class="empty-state-icon">👥</div>
            <p class="empty-state-title">Bạn chưa có bạn bè nào</p>
            <p class="empty-state-description">Hãy tìm kiếm và kết bạn với mọi người!</p>
            <router-link to="/search" class="btn-primary inline-block mt-4">
              Tìm kiếm bạn bè
            </router-link>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="friend in friends"
              :key="friend.id"
              class="flex items-center justify-between p-4 card-hover animate-fade-in"
            >
              <router-link :to="`/profile/${friend.id}`" class="flex items-center gap-4 flex-1 group">
                <img
                  v-if="friend.avatar"
                  :src="friend.avatar"
                  :alt="friend.displayName"
                  class="avatar-hover w-12 h-12"
                />
                <img
                  v-else
                  src="/user.png"
                  :alt="friend.displayName"
                  class="avatar-hover w-12 h-12"
                />
                <div>
                  <p class="font-semibold text-gray-900">{{ friend.displayName }}</p>
                  <p class="text-sm text-gray-500">@{{ friend.username }}</p>
                </div>
              </router-link>
              
              <button
                @click.stop="handleRemoveFriend(friend.id)"
                :disabled="actionLoading[friend.id]"
                class="text-system-red hover:text-red-700 text-sm font-medium transition-colors flex-shrink-0 px-3 py-2"
              >
                <span v-if="actionLoading[friend.id]">...</span>
                <span v-else>Hủy kết bạn</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Friend Requests Tab -->
        <div v-else-if="activeTab === 'requests'">
          <div v-if="friendRequests.length === 0" class="empty-state">
            <div class="empty-state-icon">👥</div>
            <p class="empty-state-title">Không có lời mời kết bạn nào</p>
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="request in friendRequests"
              :key="request.id"
              class="flex items-center justify-between p-4 card-hover animate-fade-in"
            >
              <router-link :to="`/profile/${request.id}`" class="flex items-center gap-4 flex-1 group">
                <img
                  v-if="request.avatar"
                  :src="request.avatar"
                  :alt="request.displayName"
                  class="avatar-hover w-12 h-12"
                />
                <img
                  v-else
                  src="/user.png"
                  :alt="request.displayName"
                  class="avatar-hover w-12 h-12"
                />
                <div>
                  <p class="font-semibold text-gray-900">{{ request.displayName }}</p>
                  <p class="text-sm text-gray-500">@{{ request.username }}</p>
                </div>
              </router-link>
              
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  @click.stop="handleAccept(request.id)"
                  :disabled="actionLoading[request.id]"
                  class="btn-primary text-sm px-4 py-2"
                >
                  <span v-if="actionLoading[request.id]">...</span>
                  <span v-else>Chấp nhận</span>
                </button>
                <button
                  @click.stop="handleReject(request.id)"
                  :disabled="actionLoading[request.id]"
                  class="btn-secondary text-sm px-4 py-2"
                >
                  <span v-if="actionLoading[request.id]">...</span>
                  <span v-else>Từ chối</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFriendsStore } from '@/stores/friends'
import { useNotificationsStore } from '@/stores/notifications'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'
import Icon from '@/components/Icon.vue'

const authStore = useAuthStore()
const friendsStore = useFriendsStore()
const notificationsStore = useNotificationsStore()

const activeTab = ref('friends')
const loading = ref(true)
const friendRequests = ref([])
const friends = ref([])
const actionLoading = ref({})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  if (!authStore.user) return
  
  loading.value = true
  try {
    // Load friend requests
    const requests = await friendsStore.loadFriendRequests(authStore.user.uid)
    friendRequests.value = requests || []
    
    // Load friends
    const userFriends = await friendsStore.loadFriends(authStore.user.uid)
    friends.value = userFriends || []
  } catch (error) {
    console.error('Error loading friends data:', error)
  } finally {
    loading.value = false
  }
}

const handleAccept = async (userId) => {
  actionLoading.value[userId] = true
  try {
    await friendsStore.acceptFriendRequest(authStore.user.uid, userId)
    await loadData()
  } catch (error) {
    console.error('Error accepting friend request:', error)
  } finally {
    actionLoading.value[userId] = false
  }
}

const handleReject = async (userId) => {
  actionLoading.value[userId] = true
  try {
    await friendsStore.rejectFriendRequest(authStore.user.uid, userId)
    await loadData()
  } catch (error) {
    console.error('Error rejecting friend request:', error)
  } finally {
    actionLoading.value[userId] = false
  }
}

const handleRemoveFriend = async (userId) => {
  if (window.showConfirm) {
    const confirmed = await window.showConfirm('Bạn có chắc chắn muốn hủy kết bạn?', {
      title: 'Hủy kết bạn',
      confirmText: 'Hủy kết bạn',
      cancelText: 'Đóng'
    })
    if (!confirmed) return
  } else {
    if (!confirm('Bạn có chắc chắn muốn hủy kết bạn?')) return
  }
  
  actionLoading.value[userId] = true
  try {
    await friendsStore.removeFriend(authStore.user.uid, userId)
    await loadData()
  } catch (error) {
    console.error('Error removing friend:', error)
  } finally {
    actionLoading.value[userId] = false
  }
}
</script>
