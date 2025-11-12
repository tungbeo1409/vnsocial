<template>
  <div class="page-container pb-20">
    <!-- Top Navigation Bar -->
    <TopNavBar />
    
    <!-- Back Button (if viewing other user's profile) -->
    <div v-if="!isOwnProfile" class="px-4 pt-2 sticky top-[73px] z-30 bg-white border-b border-gray-200">
      <router-link to="/" class="inline-flex items-center gap-2 hover:opacity-80 transition-opacity py-2">
        <Icon name="arrowLeft" :size="20" class="text-gray-600" />
        <span class="text-sm text-gray-600">Quay lại</span>
      </router-link>
    </div>

    <!-- Profile Content -->
    <main class="page-main">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Đang tải...</p>
      </div>
      
      <div v-else-if="profile" class="animate-fade-in">
        <!-- Cover Photo -->
        <div class="relative h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
          <img
            v-if="profile.coverPhoto"
            :src="profile.coverPhoto"
            :alt="profile.displayName"
            class="w-full h-full object-cover"
          />
          
          <!-- Edit Cover Button (only for own profile) -->
          <label
            v-if="isOwnProfile"
            class="absolute top-4 right-4 cursor-pointer bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
          >
            <Icon name="photo" :size="18" />
            <span>{{ profile.coverPhoto ? 'Đổi ảnh bìa' : 'Thêm ảnh bìa' }}</span>
            <input
              type="file"
              accept="image/*"
              @change="handleCoverPhotoSelect"
              class="hidden"
            />
          </label>
        </div>

        <!-- Profile Info Section -->
        <div class="px-4 pb-6">
          <div class="flex items-start justify-between -mt-16 mb-4">
            <!-- Avatar -->
            <div class="relative">
              <div class="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                <img
                  v-if="profile.avatar"
                  :src="profile.avatar"
                  :alt="profile.displayName"
                  class="w-full h-full object-cover"
                />
                <img
                  v-else
                  src="/user.png"
                  :alt="profile.displayName"
                  class="w-full h-full object-cover"
                />
              </div>
              
              <!-- Edit Avatar Button (only for own profile) -->
              <label
                v-if="isOwnProfile"
                class="absolute bottom-0 right-0 cursor-pointer bg-black text-white rounded-full p-2.5 shadow-lg hover:bg-gray-800 transition-all"
                title="Đổi avatar"
              >
                <Icon name="photo" :size="18" />
                <input
                  type="file"
                  accept="image/*"
                  @change="handleAvatarSelect"
                  class="hidden"
                />
              </label>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 mt-20">
              <!-- Edit Profile Button (own profile) -->
              <button
                v-if="isOwnProfile"
                @click="showEditModal = true"
                class="btn-primary flex items-center gap-2"
              >
                <Icon name="user" :size="16" />
                <span>Chỉnh sửa trang cá nhân</span>
              </button>

              <!-- Friend Action Buttons (other user's profile) -->
              <template v-else>
                <button
                  v-if="friendshipStatus === 'friends'"
                  @click="openChat(userId)"
                  class="btn-primary flex items-center gap-2"
                >
                  <Icon name="message" :size="16" />
                  <span>Nhắn tin</span>
                </button>
                <button
                  type="button"
                  @click="handleFriendAction($event)"
                  :disabled="friendActionLoading"
                  class="flex items-center gap-2"
                  :class="{
                    'btn-secondary': friendshipStatus === 'friends' || friendshipStatus === 'sent',
                    'btn-primary': !friendshipStatus || friendshipStatus === 'none' || friendshipStatus === 'received'
                  }"
                >
                  <span v-if="friendActionLoading" class="flex items-center gap-2">
                    <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  </span>
                  <span v-else-if="friendshipStatus === 'friends'">Bạn bè</span>
                  <span v-else-if="friendshipStatus === 'sent'">Đã gửi</span>
                  <span v-else-if="friendshipStatus === 'received'">Chấp nhận</span>
                  <span v-else>Kết bạn</span>
                </button>
              </template>
            </div>
          </div>

          <!-- User Info -->
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ profile.displayName }}</h1>
            <p class="text-gray-500 mb-3">@{{ profile.username }}</p>
            <p v-if="profile.bio" class="text-gray-700 leading-relaxed">{{ profile.bio }}</p>
            <p v-else-if="isOwnProfile" class="text-gray-400 italic">Thêm tiểu sử để mọi người biết thêm về bạn</p>
          </div>

          <!-- Stats -->
          <div class="flex gap-8 pb-6 border-b border-gray-200">
            <div class="text-center">
              <div class="text-xl font-bold text-gray-900">{{ profile.friends?.length || 0 }}</div>
              <div class="text-sm text-gray-500">Bạn bè</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-gray-900">{{ profile.followers?.length || 0 }}</div>
              <div class="text-sm text-gray-500">Người theo dõi</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-gray-900">{{ profile.following?.length || 0 }}</div>
              <div class="text-sm text-gray-500">Đang theo dõi</div>
            </div>
          </div>
        </div>

        <!-- Create Post (only for own profile) -->
        <div v-if="isOwnProfile" class="px-4 pb-6">
          <CreatePost />
        </div>

        <!-- User Posts -->
        <div class="px-4 pb-6">
          <h2 class="text-xl font-bold mb-4 text-gray-900">Bài viết</h2>
          <div class="space-y-6">
            <TransitionGroup name="list" tag="div" class="space-y-6">
              <PostCard
                v-for="post in userPosts"
                :key="post.id"
                :post="post"
              />
            </TransitionGroup>
            
            <div v-if="userPosts.length === 0" class="empty-state card">
              <Icon name="home" :size="48" class="mx-auto mb-4 text-gray-400" />
              <p class="empty-state-title">Chưa có bài viết nào</p>
              <p class="empty-state-description">Hãy tạo bài viết đầu tiên để chia sẻ với mọi người!</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Profile Modal -->
    <Transition name="modal">
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="showEditModal = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <!-- Modal Header -->
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 class="text-xl font-bold text-gray-900">Chỉnh sửa trang cá nhân</h3>
            <button
              @click="showEditModal = false"
              class="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Icon name="close" :size="20" />
            </button>
          </div>

          <!-- Modal Content -->
          <form @submit.prevent="handleSaveProfile" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-900 mb-2">Tên hiển thị</label>
              <input
                v-model="editForm.displayName"
                type="text"
                placeholder="Tên hiển thị"
                class="input-field"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-900 mb-2">Username</label>
              <input
                v-model="editForm.username"
                type="text"
                placeholder="username"
                class="input-field"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-900 mb-2">Tiểu sử</label>
              <textarea
                v-model="editForm.bio"
                rows="4"
                placeholder="Giới thiệu về bản thân..."
                class="input-field resize-none"
                maxlength="160"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1 text-right">{{ editForm.bio?.length || 0 }}/160</p>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center gap-3 pt-4">
              <button
                type="button"
                @click="showEditModal = false"
                class="btn-secondary flex-1"
              >
                Hủy
              </button>
              <button
                type="submit"
                :disabled="savingProfile"
                class="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <span v-if="savingProfile" class="flex items-center gap-2">
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang lưu...
                </span>
                <span v-else>Lưu thay đổi</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
    
    <!-- Bottom Navigation Bar -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import { useFriendsStore } from '@/stores/friends'
import { chatBus } from '@/utils/chatBus'
import { compressImage } from '@/utils/fileUtils'
import PostCard from '@/components/PostCard.vue'
import CreatePost from '@/components/CreatePost.vue'
import TopNavBar from '@/components/TopNavBar.vue'
import BottomNavBar from '@/components/BottomNavBar.vue'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const authStore = useAuthStore()
const postsStore = usePostsStore()
const friendsStore = useFriendsStore()

const profile = ref(null)
const loading = ref(true)
const friendshipStatus = ref('none')
const friendActionLoading = ref(false)
const showEditModal = ref(false)
const savingProfile = ref(false)
const editForm = ref({
  displayName: '',
  username: '',
  bio: ''
})
let unsubscribe = null

const userId = computed(() => route.params.userId || authStore.user?.uid)
const isOwnProfile = computed(() => userId.value === authStore.user?.uid)

const userPosts = computed(() => {
  return postsStore.posts.filter(post => post.userId === userId.value)
})

onMounted(async () => {
  await loadProfile()
  unsubscribe = postsStore.subscribeToPosts()
  
  // Load friendship status if viewing other user's profile
  if (!isOwnProfile.value) {
    await loadFriendshipStatus()
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// Watch for userId changes to reload profile
watch(userId, async (newUserId, oldUserId) => {
  if (newUserId && newUserId !== oldUserId) {
    // Reset profile and loading state
    profile.value = null
    loading.value = true
    friendshipStatus.value = 'none'
    
    // Reload profile and friendship status with new userId
    await loadProfile(newUserId)
    const isOwn = newUserId === authStore.user?.uid
    if (!isOwn && authStore.user) {
      await loadFriendshipStatus(newUserId)
    }
  }
}, { immediate: false })

const loadProfile = async (targetUserId = null) => {
  try {
    loading.value = true
    const idToLoad = targetUserId || userId.value
    if (!idToLoad) {
      loading.value = false
      return
    }
    
    const userDoc = await getDoc(doc(db, 'users', idToLoad))
    if (userDoc.exists()) {
      profile.value = { id: userDoc.id, ...userDoc.data() }
    } else {
      profile.value = null
    }
  } catch (error) {
    console.error('Error loading profile:', error)
    profile.value = null
  } finally {
    loading.value = false
  }
}

const loadFriendshipStatus = async (targetUserId = null) => {
  const idToCheck = targetUserId || userId.value
  if (!authStore.user || !idToCheck || idToCheck === authStore.user.uid) {
    friendshipStatus.value = 'none'
    return
  }
  
  try {
    const status = await friendsStore.getFriendshipStatus(authStore.user.uid, idToCheck)
    friendshipStatus.value = status
  } catch (error) {
    console.error('Error loading friendship status:', error)
    friendshipStatus.value = 'none'
  }
}

const handleAvatarSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const compressedBase64 = await compressImage(file, 400, 400, 0.8)
    
    const result = await authStore.updateProfile({
      avatar: compressedBase64
    })

    if (result.success) {
      profile.value.avatar = compressedBase64
      if (window.showToast) {
        window.showToast('Đã cập nhật avatar', 'success', '', 2000)
      }
    } else {
      if (window.showToast) {
        window.showToast('Cập nhật avatar thất bại', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    if (window.showToast) {
      window.showToast('Cập nhật avatar thất bại', 'error', error.message || '', 3000)
    }
  }
  
  // Reset input
  event.target.value = ''
}

const handleCoverPhotoSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const compressedBase64 = await compressImage(file, 1920, 600, 0.8)
    
    const result = await authStore.updateProfile({
      coverPhoto: compressedBase64
    })

    if (result.success) {
      profile.value.coverPhoto = compressedBase64
      if (window.showToast) {
        window.showToast('Đã cập nhật ảnh bìa', 'success', '', 2000)
      }
    } else {
      if (window.showToast) {
        window.showToast('Cập nhật ảnh bìa thất bại', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error uploading cover photo:', error)
    if (window.showToast) {
      window.showToast('Cập nhật ảnh bìa thất bại', 'error', error.message || '', 3000)
    }
  }
  
  // Reset input
  event.target.value = ''
}

const handleSaveProfile = async () => {
  savingProfile.value = true
  try {
    const result = await authStore.updateProfile({
      displayName: editForm.value.displayName,
      username: editForm.value.username,
      bio: editForm.value.bio || ''
    })

    if (result.success) {
      profile.value.displayName = editForm.value.displayName
      profile.value.username = editForm.value.username
      profile.value.bio = editForm.value.bio
      showEditModal.value = false
      if (window.showToast) {
        window.showToast('Đã cập nhật thông tin', 'success', '', 2000)
      }
    } else {
      if (window.showToast) {
        window.showToast('Cập nhật thất bại', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error saving profile:', error)
    if (window.showToast) {
      window.showToast('Cập nhật thất bại', 'error', error.message || '', 3000)
    }
  } finally {
    savingProfile.value = false
  }
}

const handleFriendAction = async (event) => {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  if (!authStore.user) return
  
  if (friendActionLoading.value) {
    return
  }
  
  friendActionLoading.value = true
  try {
    const status = friendshipStatus.value
    let result

    if (status === 'none') {
      result = await friendsStore.sendFriendRequest(authStore.user.uid, userId.value)
      if (result.success) {
        friendshipStatus.value = 'sent'
        await loadProfile()
      }
    } else if (status === 'received') {
      result = await friendsStore.acceptFriendRequest(authStore.user.uid, userId.value)
      if (result.success) {
        friendshipStatus.value = 'friends'
        await loadProfile()
      }
    } else if (status === 'sent') {
      result = await friendsStore.cancelFriendRequest(authStore.user.uid, userId.value)
      if (result.success) {
        friendshipStatus.value = 'none'
      }
    } else if (status === 'friends') {
      let confirmed = false
      if (window.showConfirm) {
        confirmed = await window.showConfirm('Bạn có chắc muốn hủy kết bạn?', {
          title: 'Hủy kết bạn',
          confirmText: 'Hủy kết bạn',
          cancelText: 'Đóng'
        })
      } else {
        confirmed = confirm('Bạn có chắc muốn hủy kết bạn?')
      }
      
      if (confirmed) {
        result = await friendsStore.removeFriend(authStore.user.uid, userId.value)
        if (result.success) {
          friendshipStatus.value = 'none'
          await loadProfile()
        }
      }
    }

    if (result && !result.success) {
      if (window.showToast) {
        window.showToast('Có lỗi xảy ra', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error handling friend action:', error)
    if (window.showToast) {
      window.showToast('Có lỗi xảy ra', 'error', error.message || '', 3000)
    }
  } finally {
    friendActionLoading.value = false
  }
}

const openChat = (userId) => {
  chatBus.openChat(userId)
}

// Watch for edit modal to populate form
watch(showEditModal, (isOpen) => {
  if (isOpen && profile.value) {
    editForm.value = {
      displayName: profile.value.displayName || '',
      username: profile.value.username || '',
      bio: profile.value.bio || ''
    }
  }
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease-out;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease-out;
}
</style>
