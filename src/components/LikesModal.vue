<template>
  <Transition name="modal">
    <div
      v-if="show"
      @click.self="close"
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <div @click.stop class="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 class="text-xl font-bold text-gray-900">Người đã thích</h3>
          <button
            @click="close"
            class="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Icon name="close" :size="20" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="loading" class="text-center py-8">
            <div class="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
            <p class="text-sm text-gray-500 mt-2">Đang tải...</p>
          </div>
          
          <div v-else-if="likedUsers.length === 0" class="text-center py-8">
            <Icon name="heart" :size="48" class="mx-auto mb-4 text-gray-300" />
            <p class="text-gray-500">Chưa có ai thích bài viết này</p>
          </div>
          
          <div v-else class="space-y-2">
            <router-link
              v-for="user in displayedUsers"
              :key="user.id"
              :to="`/profile/${user.id}`"
              @click="close"
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <img
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.displayName"
                class="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
              <img
                v-else
                src="/user.png"
                :alt="user.displayName"
                class="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 group-hover:text-blue-500 transition-colors truncate">
                  {{ user.displayName || 'Người dùng' }}
                </p>
                <p class="text-sm text-gray-500 truncate">@{{ user.username || 'user' }}</p>
              </div>
              <span
                v-if="user.isFriend"
                class="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium"
              >
                Bạn bè
              </span>
            </router-link>
            
            <div v-if="hasMore" class="text-center py-4">
              <p class="text-sm text-gray-500">
                Và {{ totalCount - displayedUsers.length }} người khác
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import Icon from './Icon.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Array,
    default: () => []
  },
  isOwner: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const likedUsers = ref([])
const loading = ref(false)
const authStore = useAuthStore()

const displayedUsers = computed(() => {
  if (props.isOwner) {
    // Owner sees all
    return likedUsers.value
  } else {
    // Others see max 10, friends first
    return likedUsers.value.slice(0, 10)
  }
})

const totalCount = computed(() => likedUsers.value.length)

const hasMore = computed(() => {
  if (props.isOwner) return false
  return likedUsers.value.length > 10
})

const loadLikedUsers = async () => {
  if (!props.likes || props.likes.length === 0) {
    likedUsers.value = []
    return
  }

  loading.value = true
  try {
    // Get all user data
    const userPromises = props.likes.map(async (userId) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          // Check if friend - get friends list from current user's profile
          const currentUserFriends = authStore.userProfile?.friends || []
          const isFriend = currentUserFriends.includes(userId)
          
          return {
            id: userId,
            displayName: userData.displayName || 'Người dùng',
            username: userData.username || 'user',
            avatar: userData.avatar || '',
            isFriend
          }
        }
        return null
      } catch (error) {
        console.error('Error loading user:', userId, error)
        return null
      }
    })

    const users = await Promise.all(userPromises)
    const validUsers = users.filter(u => u !== null)
    
    // Sort: friends first, then others
    validUsers.sort((a, b) => {
      if (a.isFriend && !b.isFriend) return -1
      if (!a.isFriend && b.isFriend) return 1
      return 0
    })
    
    likedUsers.value = validUsers
  } catch (error) {
    console.error('Error loading liked users:', error)
  } finally {
    loading.value = false
  }
}

const close = () => {
  emit('close')
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadLikedUsers()
  } else {
    likedUsers.value = []
  }
})

watch(() => props.likes, () => {
  if (props.show) {
    loadLikedUsers()
  }
}, { deep: true })
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

