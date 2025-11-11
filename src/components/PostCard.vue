<template>
  <article class="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
    <!-- Post Header -->
    <div class="flex items-center gap-3 mb-4">
      <router-link :to="`/profile/${post.userId}`" class="flex-shrink-0 group">
        <img
          v-if="post.userAvatar"
          :src="post.userAvatar"
          :alt="post.userDisplayName"
          class="avatar w-12 h-12 group-hover:ring-system-blue/50"
        />
        <img
          v-else
          src="/user.png"
          :alt="post.userDisplayName"
          class="avatar w-12 h-12 group-hover:ring-system-blue/50"
        />
      </router-link>
      
      <div class="flex-1 min-w-0">
        <router-link 
          :to="`/profile/${post.userId}`" 
          class="font-semibold text-gray-900 hover:text-system-blue transition-colors block truncate"
        >
          {{ post.userDisplayName }}
        </router-link>
        <p class="text-xs text-gray-500 mt-0.5">{{ formatDate(post.createdAt) }}</p>
      </div>
      
      <!-- Post Options Menu -->
      <div class="relative">
        <button
          @click.stop="showMenu = !showMenu"
          class="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          :title="isOwner ? 'Tùy chọn bài viết' : 'Tùy chọn'"
        >
          <Icon name="more" :size="18" />
        </button>
        
        <!-- Dropdown Menu -->
        <Transition name="fade">
          <div
            v-if="showMenu"
            class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
          >
            <!-- Owner Options -->
            <template v-if="isOwner">
              <button
                @click="handleEdit"
                class="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <Icon name="edit" :size="18" />
                <span>Sửa bài viết</span>
              </button>
              <button
                @click="handleDelete"
                class="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <Icon name="trash" :size="18" />
                <span>Xóa bài viết</span>
              </button>
              <div class="border-t border-gray-100 my-1"></div>
              <div class="px-4 py-2">
                <p class="text-xs text-gray-500 mb-2">Quyền xem</p>
                <div class="space-y-1">
                  <button
                    @click="updatePrivacy('public')"
                    class="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
                    :class="{ 'bg-gray-100': post.privacy === 'public' || !post.privacy }"
                  >
                    <Icon name="eye" :size="16" />
                    <span>Công khai</span>
                    <Icon v-if="post.privacy === 'public' || !post.privacy" name="check" :size="14" class="ml-auto text-blue-500" />
                  </button>
                  <button
                    @click="updatePrivacy('friends')"
                    class="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
                    :class="{ 'bg-gray-100': post.privacy === 'friends' }"
                  >
                    <Icon name="users" :size="16" />
                    <span>Bạn bè</span>
                    <Icon v-if="post.privacy === 'friends'" name="check" :size="14" class="ml-auto text-blue-500" />
                  </button>
                  <button
                    @click="updatePrivacy('onlyMe')"
                    class="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
                    :class="{ 'bg-gray-100': post.privacy === 'onlyMe' }"
                  >
                    <Icon name="lock" :size="16" />
                    <span>Chỉ mình tôi</span>
                    <Icon v-if="post.privacy === 'onlyMe'" name="check" :size="14" class="ml-auto text-blue-500" />
                  </button>
                </div>
              </div>
            </template>
            
            <!-- Non-owner Options -->
            <template v-else>
              <button
                @click="handleReport"
                class="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <Icon name="flag" :size="18" />
                <span>Báo cáo bài viết</span>
              </button>
            </template>
          </div>
        </Transition>
      </div>
    </div>
    
    <!-- Post Content -->
    <p class="text-gray-900 mb-4 whitespace-pre-wrap leading-relaxed">{{ post.content }}</p>
    
    <!-- Post Media (Multiple Images, Single Image, Video, Audio) -->
    <div v-if="post.images || post.imageUrl || post.fileData || post.audioData || post.videoData" class="mb-4 space-y-3">
      <!-- Multiple Images Grid -->
      <div v-if="post.images && Array.isArray(post.images) && post.images.length > 1" class="grid grid-cols-3 gap-2 rounded-xl overflow-hidden">
        <div
          v-for="(image, index) in displayedImages"
          :key="index"
          class="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer group flex items-center justify-center relative"
          @click="openImageModal(image, index)"
        >
          <img
            :src="image"
            :alt="`Image ${index + 1}`"
            class="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <!-- Overlay for remaining images count -->
          <div
            v-if="index === 5 && remainingImagesCount > 0"
            class="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:bg-black/70 transition-colors rounded-lg"
            @click.stop="openImageModalFromRemaining"
          >
            +{{ remainingImagesCount }}
          </div>
        </div>
      </div>
      <!-- Single Image (only if not audio-only) -->
      <div v-else-if="(post.imageUrl || (post.fileType === 'image' && post.fileData)) && post.fileType !== 'audio'" class="flex justify-start items-start">
        <img
          :src="post.imageUrl || post.fileData"
          alt="Post image"
          class="max-w-full max-h-[200px] w-auto h-auto object-contain rounded-xl transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
          @click="openImageModal(post.imageUrl || post.fileData, 0)"
        />
      </div>
      
      <!-- Video (can be with images) -->
      <div v-if="post.videoData || (post.fileType === 'video' && post.fileData)" class="flex justify-start items-start">
        <video
          :src="post.videoData || post.fileData"
          controls
          class="max-w-full max-h-[200px] w-auto h-auto object-contain rounded-xl"
        ></video>
      </div>
      
      <!-- Audio (can be with images or video, or standalone) -->
      <div
        v-if="post.audioData || (post.fileType === 'audio' && post.fileData)"
        class="rounded-xl"
      >
        <AudioPlayer 
          :src="post.audioData || post.fileData"
          :duration="post.audioDuration || post.duration || 0"
        />
      </div>
    </div>

    <!-- Image Modal -->
    <Transition name="modal">
      <div
        v-if="showImageModal"
        @click="closeImageModal"
        class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      >
        <Transition name="slide" mode="out-in">
          <img
            :key="modalImageIndex"
            :src="post.images ? post.images[modalImageIndex] : modalImageUrl"
            :alt="`Image ${modalImageIndex + 1}`"
            class="max-w-full max-h-full object-contain rounded-lg"
            @click.stop
          />
        </Transition>
        <button
          @click="closeImageModal"
          class="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <Icon name="close" :size="24" />
        </button>
        <!-- Image position indicator -->
        <div
          v-if="post.images && post.images.length > 1"
          class="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium"
        >
          {{ modalImageIndex + 1 }}/{{ post.images.length }}
        </div>
        <!-- Navigation arrows for multiple images -->
        <button
          v-if="post.images && post.images.length > 1 && modalImageIndex > 0"
          @click.stop="prevImage"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <Icon name="arrowLeft" :size="24" />
        </button>
        <button
          v-if="post.images && post.images.length > 1 && modalImageIndex < post.images.length - 1"
          @click.stop="nextImage"
          class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <Icon name="arrowLeft" :size="24" class="rotate-180" />
        </button>
      </div>
    </Transition>
    
    <!-- Post Actions -->
    <div class="flex items-center gap-6 pt-3 mt-3 border-t border-gray-100">
      <button
        @click="handleLike"
        class="flex items-center gap-2 group"
        :class="{ 'text-red-500': isLiked, 'text-gray-600': !isLiked }"
      >
        <Icon 
          :name="isLiked ? 'heart' : 'heart'" 
          :size="22" 
          :solid="isLiked"
          class="transition-transform duration-200 group-active:scale-125" 
        />
        <span 
          @click.stop="showLikesModal = true"
          class="text-sm font-medium cursor-pointer hover:underline"
          :class="{ 'hover:underline': (post.likes?.length || 0) > 0 }"
        >
          {{ post.likes?.length || 0 }}
        </span>
      </button>
      
      <button
        @click="showComments = !showComments"
        class="flex items-center gap-2 group"
        :class="{ 'text-blue-500': showComments, 'text-gray-600': !showComments }"
      >
        <Icon 
          name="message" 
          :size="22" 
          class="transition-transform duration-200 group-active:scale-125" 
        />
        <span class="text-sm font-medium">{{ getCommentCount(post) }}</span>
      </button>
    </div>
    
    <!-- Comments Section -->
    <Transition name="slide-down">
      <div v-if="showComments" class="mt-4 pt-4 border-t border-gray-100 space-y-4">
        <!-- Comments List -->
        <div v-if="post.comments && post.comments.length > 0" class="space-y-4">
          <CommentItem
            v-for="comment in post.comments"
            :key="comment.id"
            :comment="comment"
            :post-id="post.id"
          />
        </div>
        
        <!-- Comment Input -->
        <div class="pt-2">
          <CommentInput
            placeholder="Viết bình luận..."
            @submit="handleComment"
            :loading="commenting"
          />
        </div>
      </div>
    </Transition>
    
    <!-- Likes Modal -->
    <LikesModal
      :show="showLikesModal"
      :likes="post.likes || []"
      :is-owner="isOwner"
      @close="showLikesModal = false"
    />
    
    <!-- Edit Post Modal -->
    <Transition name="modal">
      <div
        v-if="showEditModal"
        @click.self="showEditModal = false"
        class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      >
        <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Sửa bài viết</h3>
            <button
              @click="showEditModal = false"
              class="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <Icon name="close" :size="20" />
            </button>
          </div>
          
          <textarea
            v-model="editingContent"
            placeholder="Nhập nội dung bài viết..."
            class="w-full min-h-[120px] p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="5"
          ></textarea>
          
          <div class="flex items-center gap-3 mt-4">
            <button
              @click="showEditModal = false"
              class="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              @click="handleSaveEdit"
              class="flex-1 px-4 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </article>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, watch } from 'vue'
import { usePostsStore } from '@/stores/posts'
import { useAuthStore } from '@/stores/auth'
import CommentItem from '@/components/CommentItem.vue'
import CommentInput from '@/components/CommentInput.vue'
import Icon from '@/components/Icon.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import LikesModal from '@/components/LikesModal.vue'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const postsStore = usePostsStore()
const authStore = useAuthStore()

const showComments = ref(false)
const commenting = ref(false)
const showImageModal = ref(false)
const modalImageUrl = ref('')
const modalImageIndex = ref(0)
const showLikesModal = ref(false)
const showMenu = ref(false)
const showEditModal = ref(false)
const editingContent = ref('')

const isOwner = computed(() => {
  return props.post.userId === authStore.user?.uid
})

const isLiked = computed(() => {
  return props.post.likes?.includes(authStore.user?.uid) || false
})

const displayedImages = computed(() => {
  if (!props.post.images || !Array.isArray(props.post.images)) return []
  // Chỉ hiển thị tối đa 6 hình (2 dòng x 3 cột)
  return props.post.images.slice(0, 6)
})

const remainingImagesCount = computed(() => {
  if (!props.post.images || !Array.isArray(props.post.images)) return 0
  return Math.max(0, props.post.images.length - 6)
})

const getCommentCount = (post) => {
  if (!post.comments || post.comments.length === 0) return 0
  let count = post.comments.length
  post.comments.forEach(comment => {
    if (comment.replies) {
      count += comment.replies.length
    }
  })
  return count
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`

  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short'
  })
}

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleLike = async () => {
  await postsStore.likePost(props.post.id, authStore.user.uid)
}

const handleComment = async ({ content, fileData }) => {
  if (!content && !fileData) return
  
  commenting.value = true
  try {
    const result = await postsStore.addComment(
      props.post.id,
      content,
      authStore.user.uid,
      authStore.userProfile?.displayName || 'Người dùng',
      authStore.userProfile?.avatar || '',
      fileData
    )
    
    if (result.success) {
      if (window.showToast) {
        window.showToast('Đã gửi bình luận', 'success', '', 2000)
      }
    } else {
      if (window.showToast) {
        window.showToast('Gửi bình luận thất bại', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error commenting:', error)
    if (window.showToast) {
      window.showToast('Gửi bình luận thất bại', 'error', error.message || '', 3000)
    }
  } finally {
    commenting.value = false
  }
}

const handleDelete = async () => {
  showMenu.value = false
  if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
    await postsStore.deletePost(props.post.id)
    if (window.showToast) {
      window.showToast('Đã xóa bài viết', 'success', '', 2000)
    }
  }
}

const handleEdit = () => {
  showMenu.value = false
  editingContent.value = props.post.content || ''
  showEditModal.value = true
}

const handleSaveEdit = async () => {
  if (!editingContent.value.trim()) {
    if (window.showToast) {
      window.showToast('Nội dung không được để trống', 'error', '', 2000)
    }
    return
  }
  
  try {
    await postsStore.updatePost(props.post.id, {
      content: editingContent.value.trim()
    })
    showEditModal.value = false
    if (window.showToast) {
      window.showToast('Đã cập nhật bài viết', 'success', '', 2000)
    }
  } catch (error) {
    console.error('Error updating post:', error)
    if (window.showToast) {
      window.showToast('Cập nhật bài viết thất bại', 'error', error.message || '', 3000)
    }
  }
}

const updatePrivacy = async (privacy) => {
  showMenu.value = false
  try {
    await postsStore.updatePost(props.post.id, {
      privacy: privacy
    })
    if (window.showToast) {
      window.showToast('Đã cập nhật quyền xem', 'success', '', 2000)
    }
  } catch (error) {
    console.error('Error updating privacy:', error)
    if (window.showToast) {
      window.showToast('Cập nhật quyền xem thất bại', 'error', error.message || '', 3000)
    }
  }
}

const handleReport = () => {
  showMenu.value = false
  const reason = prompt('Vui lòng cho biết lý do báo cáo bài viết này:')
  if (reason && reason.trim()) {
    // TODO: Implement report functionality
    if (window.showToast) {
      window.showToast('Đã gửi báo cáo', 'success', '', 2000)
    }
  }
}

const openImageModal = (imageUrl, index) => {
  modalImageUrl.value = imageUrl
  modalImageIndex.value = index
  showImageModal.value = true
}

const openImageModalFromRemaining = () => {
  // Mở modal từ hình thứ 6 (index 5) - hình đang bị che bởi overlay "+X"
  if (props.post.images && props.post.images.length > 6) {
    modalImageUrl.value = props.post.images[5]
    modalImageIndex.value = 5
    showImageModal.value = true
  }
}

const closeImageModal = () => {
  showImageModal.value = false
}

const prevImage = () => {
  if (props.post.images && modalImageIndex.value > 0) {
    modalImageIndex.value--
    modalImageUrl.value = props.post.images[modalImageIndex.value]
  }
}

const nextImage = () => {
  if (props.post.images && modalImageIndex.value < props.post.images.length - 1) {
    modalImageIndex.value++
    modalImageUrl.value = props.post.images[modalImageIndex.value]
  }
}

// Keyboard navigation
const handleKeyDown = (event) => {
  if (!showImageModal.value) return
  
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    prevImage()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    nextImage()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeImageModal()
  }
}

// Add keyboard event listeners
watch(showImageModal, (isOpen) => {
  if (isOpen) {
    window.addEventListener('keydown', handleKeyDown)
  } else {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// Close menu when clicking outside
const handleClickOutside = (event) => {
  const menuButton = event.target.closest('button[title*="Tùy chọn"]')
  const menu = event.target.closest('.absolute.right-0')
  if (showMenu.value && !menuButton && !menu) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* Slide animation for image modal */
.slide-enter-active {
  transition: all 0.3s ease-out;
}

.slide-leave-active {
  transition: all 0.3s ease-in;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>

