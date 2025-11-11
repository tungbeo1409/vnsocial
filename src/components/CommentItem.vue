<template>
  <div class="comment-item">
    <!-- Main Comment -->
    <div class="flex gap-3">
      <router-link :to="`/profile/${comment.userId}`" class="flex-shrink-0">
        <img
          v-if="comment.userAvatar"
          :src="comment.userAvatar"
          :alt="comment.userDisplayName"
          class="avatar w-9 h-9"
        />
        <img
          v-else
          src="/user.png"
          :alt="comment.userDisplayName"
          class="avatar w-9 h-9"
        />
      </router-link>
      
      <div class="flex-1 min-w-0">
        <div 
          :id="`comment-${comment.id}`"
          class="bg-gray-50 rounded-2xl px-4 py-2.5 transition-all duration-200"
          :class="{ 'ring-2 ring-blue-500 bg-blue-50': isHighlighted }"
        >
          <!-- Reply To Info -->
          <div v-if="comment.replyTo" class="mb-1.5">
            <button
              @click="scrollToComment(comment.replyTo.commentId)"
              class="text-xs text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              <Icon name="arrowLeft" :size="12" class="rotate-180" />
              <span>Phản hồi</span>
              <span class="font-medium">
                {{ comment.replyTo.userId === authStore.user?.uid ? 'bạn' : comment.replyTo.userDisplayName }}
              </span>
            </button>
          </div>
          
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2">
              <router-link 
                :to="`/profile/${comment.userId}`" 
                class="font-semibold text-sm text-gray-900 hover:text-blue-500 transition-colors"
              >
                {{ comment.userDisplayName }}
              </router-link>
              <span class="text-xs text-gray-500">{{ formatDate(comment.createdAt) }}</span>
              <span v-if="comment.updatedAt" class="text-xs text-gray-400">(đã chỉnh sửa)</span>
            </div>
            
            <!-- Comment Menu (show for everyone, but options differ) -->
            <div class="relative">
              <button
                @click.stop="showMenu = !showMenu"
                class="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
                title="Tùy chọn"
              >
                <Icon name="more" :size="16" />
              </button>
              
              <!-- Dropdown Menu -->
              <Transition name="slide-down">
                <div
                  v-if="showMenu"
                  class="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  @click.stop
                >
                  <button
                    v-if="isOwnComment"
                    @click="handleEdit"
                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Icon name="edit" :size="16" />
                    <span>Sửa</span>
                  </button>
                  <button
                    v-if="isOwnComment || isPostOwner"
                    @click="handleDelete"
                    class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Icon name="trash" :size="16" />
                    <span>Xóa</span>
                  </button>
                  <button
                    v-if="!isOwnComment"
                    @click="handleReport"
                    class="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Icon name="flag" :size="16" />
                    <span>Báo cáo</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
          
          <!-- Edit Form -->
          <div v-if="isEditing" class="mb-2">
            <textarea
              v-model="editingContent"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              placeholder="Nhập bình luận..."
            ></textarea>
            <div class="flex items-center gap-2 mt-2">
              <button
                @click="handleSaveEdit"
                :disabled="saving || (!editingContent.trim() && !comment.fileType)"
                class="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lưu
              </button>
              <button
                @click="handleCancelEdit"
                :disabled="saving"
                class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
          
          <!-- Normal Comment Content (only show when not editing) -->
          <div v-else-if="comment.content" class="text-sm text-gray-700 leading-relaxed mb-2">
            {{ comment.content }}
          </div>
          
          <!-- Comment File (only show if not editing) -->
          <div v-if="comment.fileType && !isEditing" class="mb-2">
            <!-- Image -->
            <div v-if="comment.fileType === 'image'" class="flex justify-start items-start max-w-xs">
              <img
                :src="comment.fileData"
                alt="Comment image"
                class="max-w-full max-h-16 w-auto h-auto object-contain rounded-lg cursor-pointer"
                @click="openImagePreview(comment.fileData)"
              />
            </div>
            
            <!-- Video -->
            <div v-else-if="comment.fileType === 'video'" class="flex justify-start items-start max-w-xs">
              <video
                :src="comment.fileData"
                controls
                class="max-w-full max-h-16 w-auto h-auto object-contain rounded-lg"
              ></video>
            </div>
            
            <!-- Audio/Voice -->
            <div v-else-if="comment.fileType === 'audio'" class="max-w-xs">
              <AudioPlayer 
                :src="comment.fileData"
                :duration="comment.duration || 0"
              />
            </div>
            
            <!-- Sticker -->
            <div v-else-if="comment.fileType === 'sticker'" class="text-4xl">
              {{ comment.fileData }}
            </div>
            
            <!-- File -->
            <div v-else-if="comment.fileType === 'file'" class="flex items-center gap-2 p-2 bg-white rounded-lg">
              <span class="text-xl">{{ getFileIcon(comment.fileName) }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ comment.fileName || 'File' }}</p>
                <p v-if="comment.fileSize" class="text-xs text-gray-500">{{ formatFileSize(comment.fileSize) }}</p>
              </div>
              <a
                :href="comment.fileData"
                :download="comment.fileName"
                class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
              >
                Tải
              </a>
            </div>
          </div>
          
          <!-- Comment Actions -->
          <div class="flex items-center gap-4 mt-2">
            <button
              @click="handleLike"
              class="flex items-center gap-1 text-xs text-gray-600 hover:text-red-500 transition-colors"
              :class="{ 'text-red-500': isLiked }"
            >
              <Icon :name="'heart'" :size="16" :solid="isLiked" />
              <span v-if="likeCount > 0">{{ likeCount }}</span>
            </button>
            <button
              v-if="!isEditing"
              @click="toggleReply"
              class="text-xs text-gray-600 hover:text-blue-500 transition-colors"
            >
              Phản hồi
            </button>
          </div>
        </div>
        
        <!-- Reply Input -->
        <Transition name="slide-down">
          <div v-if="showReplyInput" class="mt-2">
            <CommentInput
              :placeholder="`Phản hồi ${comment.userDisplayName}...`"
              @submit="handleReply"
              :loading="replying"
            />
          </div>
        </Transition>
        
        <!-- Replies -->
        <div v-if="comment.replies && comment.replies.length > 0" class="mt-3 space-y-3 pl-4 border-l-2 border-gray-200">
          <CommentItem
            v-for="reply in comment.replies"
            :key="reply.id"
            :comment="reply"
            :post-id="postId"
            :parent-comment-id="comment.id"
            :depth="(depth || 0) + 1"
            :post-user-id="postUserId"
          />
        </div>
      </div>
    </div>
    
    <!-- Image Preview Modal -->
    <Transition name="fade">
      <div
        v-if="showImagePreview"
        @click="showImagePreview = false"
        class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <img
          :src="previewImageUrl"
          alt="Preview"
          class="max-w-full max-h-full object-contain rounded-lg"
          @click.stop
        />
        <button
          @click="showImagePreview = false"
          class="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl transition-colors"
        >
          ✕
        </button>
      </div>
    </Transition>
    
    <!-- Report Modal -->
    <Transition name="fade">
      <div
        v-if="showReportModal"
        @click="handleCancelReport"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <div
          @click.stop
          class="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Báo cáo bình luận</h3>
          
          <div class="space-y-3 mb-4">
            <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                v-model="reportReason"
                value="Spam"
                class="w-4 h-4 text-blue-600"
              />
              <span class="text-sm text-gray-700">Spam hoặc lừa đảo</span>
            </label>
            <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                v-model="reportReason"
                value="Nội dung không phù hợp"
                class="w-4 h-4 text-blue-600"
              />
              <span class="text-sm text-gray-700">Nội dung không phù hợp</span>
            </label>
            <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                v-model="reportReason"
                value="Quấy rối"
                class="w-4 h-4 text-blue-600"
              />
              <span class="text-sm text-gray-700">Quấy rối hoặc bắt nạt</span>
            </label>
            <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                v-model="reportReason"
                value="Ngôn từ thù địch"
                class="w-4 h-4 text-blue-600"
              />
              <span class="text-sm text-gray-700">Ngôn từ thù địch</span>
            </label>
            <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                v-model="reportReason"
                value="Khác"
                class="w-4 h-4 text-blue-600"
              />
              <span class="text-sm text-gray-700">Khác</span>
            </label>
          </div>
          
          <div class="flex items-center gap-3">
            <button
              @click="handleCancelReport"
              :disabled="reporting"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              @click="handleSubmitReport"
              :disabled="reporting || !reportReason"
              class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ reporting ? 'Đang gửi...' : 'Gửi báo cáo' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePostsStore } from '@/stores/posts'
import { useAuthStore } from '@/stores/auth'
import { formatFileSize, getFileIcon } from '@/utils/fileUtils'
import CommentInput from '@/components/CommentInput.vue'
import Icon from '@/components/Icon.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  postId: {
    type: String,
    required: true
  },
  parentCommentId: {
    type: String,
    default: null
  },
  depth: {
    type: Number,
    default: 0
  },
  postUserId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['reply'])

const postsStore = usePostsStore()
const authStore = useAuthStore()

const showReplyInput = ref(false)
const replying = ref(false)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const isHighlighted = ref(false)
const showMenu = ref(false)
const isEditing = ref(false)
const editingContent = ref('')
const saving = ref(false)
const showReportModal = ref(false)
const reportReason = ref('')
const reporting = ref(false)

const isOwnComment = computed(() => {
  return props.comment.userId === authStore.user?.uid
})

const isPostOwner = computed(() => {
  return props.postUserId === authStore.user?.uid
})

const isLiked = computed(() => {
  return props.comment.likes?.includes(authStore.user?.uid) || false
})

const likeCount = computed(() => {
  return props.comment.likes?.length || 0
})

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
  const result = await postsStore.likeComment(
    props.postId,
    props.comment.id,
    authStore.user.uid,
    !!props.parentCommentId,
    props.parentCommentId
  )
  
  if (!result.success && window.showToast) {
    window.showToast('Không thể thích bình luận', 'error', result.error || '', 3000)
  }
}

const toggleReply = () => {
  showReplyInput.value = !showReplyInput.value
}

const handleReply = async ({ content, fileData }) => {
  if (!content && !fileData) return
  
  replying.value = true
  try {
    // If this is a reply (has parentCommentId), reply to the parent comment (same level)
    // Otherwise, reply to this comment (new level)
    // The parentId for adding to replies array (same level)
    const parentIdForLevel = props.parentCommentId || props.comment.id
    
    // The commentId for replyTo info (the comment user clicked "Phản hồi" on)
    // This should always be the current comment's ID, not the parent
    const commentIdForReplyTo = props.comment.id
    
    console.log('📤 Replying to comment')
    console.log('   - Current Comment ID (will be in replyTo):', commentIdForReplyTo)
    console.log('   - Parent Comment ID (for same level):', props.parentCommentId)
    console.log('   - Will add to replies of:', parentIdForLevel)
    console.log('   - Depth:', props.depth || 0)
    
    const result = await postsStore.addComment(
      props.postId,
      content,
      authStore.user.uid,
      authStore.userProfile?.displayName || 'Người dùng',
      authStore.userProfile?.avatar || '',
      fileData,
      parentIdForLevel, // For adding to replies array (same level)
      commentIdForReplyTo // For replyTo info (the comment being replied to)
    )
    
    if (result.success) {
      showReplyInput.value = false
      if (window.showToast) {
        window.showToast('Đã gửi phản hồi', 'success', '', 2000)
      }
    } else {
      if (window.showToast) {
        window.showToast('Gửi phản hồi thất bại', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error replying:', error)
    if (window.showToast) {
      window.showToast('Gửi phản hồi thất bại', 'error', error.message || '', 3000)
    }
  } finally {
    replying.value = false
  }
}

const openImagePreview = (imageUrl) => {
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
}

const handleEdit = () => {
  showMenu.value = false
  editingContent.value = props.comment.content || ''
  isEditing.value = true
}

const handleCancelEdit = () => {
  isEditing.value = false
  editingContent.value = ''
}

const handleSaveEdit = async () => {
  if (!editingContent.value.trim() && !props.comment.fileType) {
    if (window.showToast) {
      window.showToast('Bình luận không được để trống', 'error', '', 3000)
    }
    return
  }
  
  saving.value = true
  try {
    const result = await postsStore.editComment(
      props.postId,
      props.comment.id,
      editingContent.value.trim()
    )
    
    if (result.success) {
      isEditing.value = false
      editingContent.value = ''
      if (window.showToast) {
        window.showToast('Đã cập nhật bình luận', 'success', '', 2000)
      }
    } else {
      if (window.showToast) {
        window.showToast('Không thể cập nhật bình luận', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error editing comment:', error)
    if (window.showToast) {
      window.showToast('Không thể cập nhật bình luận', 'error', error.message || '', 3000)
    }
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  showMenu.value = false
  const deleteMessage = isPostOwner && !isOwnComment 
    ? 'Bạn có chắc muốn xóa bình luận này? (Bạn là chủ bài viết)'
    : 'Bạn có chắc muốn xóa bình luận này?'
  
  if (!confirm(deleteMessage)) {
    return
  }
  
  try {
    const result = await postsStore.deleteComment(props.postId, props.comment.id)
    
    if (result.success) {
      if (window.showToast) {
        window.showToast('Đã xóa bình luận', 'success', '', 2000)
      }
    } else {
      if (window.showToast) {
        window.showToast('Không thể xóa bình luận', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error deleting comment:', error)
    if (window.showToast) {
      window.showToast('Không thể xóa bình luận', 'error', error.message || '', 3000)
    }
  }
}

const handleReport = () => {
  showMenu.value = false
  showReportModal.value = true
  reportReason.value = ''
}

const handleSubmitReport = async () => {
  if (!reportReason.value.trim()) {
    if (window.showToast) {
      window.showToast('Vui lòng chọn lý do báo cáo', 'error', '', 3000)
    }
    return
  }
  
  reporting.value = true
  try {
    const result = await postsStore.reportComment(
      props.postId,
      props.comment.id,
      reportReason.value,
      authStore.user.uid
    )
    
    if (result.success) {
      showReportModal.value = false
      reportReason.value = ''
      if (window.showToast) {
        window.showToast('Đã gửi báo cáo thành công', 'success', '', 2000)
      }
    } else {
      if (window.showToast) {
        window.showToast('Không thể gửi báo cáo', 'error', result.error || '', 3000)
      }
    }
  } catch (error) {
    console.error('Error reporting comment:', error)
    if (window.showToast) {
      window.showToast('Không thể gửi báo cáo', 'error', error.message || '', 3000)
    }
  } finally {
    reporting.value = false
  }
}

const handleCancelReport = () => {
  showReportModal.value = false
  reportReason.value = ''
}

const scrollToComment = (commentId) => {
  // Find comment element
  const commentElement = document.getElementById(`comment-${commentId}`)
  if (commentElement) {
    // Scroll to comment
    commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    
    // Highlight comment temporarily
    const targetComment = document.querySelector(`#comment-${commentId}`)
    if (targetComment) {
          targetComment.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50')
      setTimeout(() => {
        targetComment.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50')
      }, 2000)
    }
  } else {
    // If comment not found in current view, try to find it in nested replies
    // This is a fallback - ideally the comment should be visible
    console.warn('Comment not found:', commentId)
  }
}

// Check if this comment should be highlighted (from URL hash or other)
onMounted(() => {
  const hash = window.location.hash
  if (hash === `#comment-${props.comment.id}`) {
    isHighlighted.value = true
    setTimeout(() => {
      scrollToComment(props.comment.id)
      setTimeout(() => {
        isHighlighted.value = false
      }, 2000)
    }, 100)
  }
  
  // Close menu when clicking outside
  const handleClickOutside = (event) => {
    if (showMenu.value) {
      const menuButton = event.target.closest('button[title="Tùy chọn"]')
      const menu = event.target.closest('.absolute.right-0')
      if (!menuButton && !menu) {
        showMenu.value = false
      }
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  // Cleanup
  return () => {
    document.removeEventListener('click', handleClickOutside)
  }
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

