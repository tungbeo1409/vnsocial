<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="handleClose"
    >
      <div class="bg-white rounded-2xl shadow-apple-lg w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 class="text-lg font-semibold text-gray-900">Tạo nhóm chat</h2>
          <button
            @click="handleClose"
            class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Đóng"
          >
            <Icon name="close" :size="18" class="text-gray-500" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- Group Name Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tên nhóm (tùy chọn)
            </label>
            <input
              v-model="groupName"
              type="text"
              placeholder="Nhập tên nhóm..."
              class="input-field"
              maxlength="50"
            />
          </div>

          <!-- Friends List -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Chọn bạn bè (tối thiểu 2 người)
            </label>
            <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
              <div
                v-for="friend in friends"
                :key="friend.id"
                @click="toggleFriend(friend.id)"
                class="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
                :class="selectedFriends.includes(friend.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'"
              >
                <div class="flex-shrink-0">
                  <img
                    v-if="friend.avatar"
                    :src="friend.avatar"
                    :alt="friend.displayName"
                    class="w-10 h-10 rounded-full object-cover"
                  />
                  <img
                    v-else
                    src="/user.png"
                    :alt="friend.displayName"
                    class="w-10 h-10 rounded-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ friend.displayName }}
                  </p>
                  <p class="text-xs text-gray-500 truncate">
                    @{{ friend.username }}
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <div
                    v-if="selectedFriends.includes(friend.id)"
                    class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                  >
                    <Icon name="check" :size="14" class="text-white" />
                  </div>
                  <div
                    v-else
                    class="w-5 h-5 rounded-full border-2 border-gray-300"
                  ></div>
                </div>
              </div>

              <div v-if="friends.length === 0" class="text-center py-8 text-gray-500">
                <p class="text-sm">Bạn chưa có bạn bè nào</p>
              </div>
            </div>
          </div>

          <!-- Selected Count -->
          <div class="text-sm text-gray-600">
            Đã chọn: <span class="font-semibold">{{ selectedFriends.length }}</span> người
          </div>

          <!-- Error Message -->
          <Transition name="slide-down">
            <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {{ error }}
            </div>
          </Transition>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
          <button
            @click="handleClose"
            class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            @click="handleCreate"
            :disabled="selectedFriends.length < 2 || loading"
            class="flex-1 px-4 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else>Tạo nhóm</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useGroupsStore } from '@/stores/groups'
import { useFriendsStore } from '@/stores/friends'
import { useAuthStore } from '@/stores/auth'
import Icon from '@/components/Icon.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'created'])

const groupsStore = useGroupsStore()
const friendsStore = useFriendsStore()
const authStore = useAuthStore()

const groupName = ref('')
const selectedFriends = ref([])
const friends = ref([])
const loading = ref(false)
const error = ref('')

const loadFriends = async () => {
  if (!authStore.user) return
  
  try {
    const friendsList = await friendsStore.loadFriends(authStore.user.uid)
    friends.value = friendsList || []
  } catch (err) {
    console.error('Error loading friends:', err)
    friends.value = []
  }
}

const toggleFriend = (friendId) => {
  const index = selectedFriends.value.indexOf(friendId)
  if (index > -1) {
    selectedFriends.value.splice(index, 1)
  } else {
    selectedFriends.value.push(friendId)
  }
  error.value = ''
}

const handleCreate = async () => {
  if (selectedFriends.value.length < 2) {
    error.value = 'Vui lòng chọn ít nhất 2 người để tạo nhóm'
    return
  }

  if (!authStore.user) return

  loading.value = true
  error.value = ''

  try {
    const result = await groupsStore.createGroup(
      authStore.user.uid,
      groupName.value.trim() || 'Nhóm chat',
      selectedFriends.value
    )

    if (result.success) {
      if (window.showToast) {
        window.showToast('Đã gửi lời mời tham gia nhóm', 'success', '', 2000)
      }
      emit('created', result.groupId)
      handleClose()
    } else {
      error.value = result.error || 'Không thể tạo nhóm'
    }
  } catch (err) {
    console.error('Error creating group:', err)
    error.value = err.message || 'Có lỗi xảy ra khi tạo nhóm'
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  groupName.value = ''
  selectedFriends.value = []
  error.value = ''
  emit('close')
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadFriends()
  }
})

onMounted(() => {
  if (props.show) {
    loadFriends()
  }
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

