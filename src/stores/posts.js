import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useNotificationsStore } from './notifications'
import { useAuthStore } from './auth'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref([])
  const loading = ref(false)

  // Listen to posts in real-time
  const subscribeToPosts = () => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    
    return onSnapshot(q, async (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Always load latest user info from profile for all posts and comments
      const postsWithLatestInfo = await Promise.all(
        postsData.map(async (post) => {
          // Update post author info
          if (post.userId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', post.userId))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                // Always update with latest info from user profile
                post.userAvatar = userData.avatar || ''
                post.userDisplayName = userData.displayName || post.userDisplayName || 'Người dùng'
              }
            } catch (error) {
              console.error('Error loading user info for post:', error)
            }
          }
          
          // Update all comments with latest user info
          if (post.comments && Array.isArray(post.comments)) {
            const updateCommentInfo = async (commentList) => {
              for (const comment of commentList) {
                if (comment.userId) {
                  try {
                    const userDoc = await getDoc(doc(db, 'users', comment.userId))
                    if (userDoc.exists()) {
                      const userData = userDoc.data()
                      comment.userAvatar = userData.avatar || ''
                      comment.userDisplayName = userData.displayName || comment.userDisplayName || 'Người dùng'
                    }
                  } catch (error) {
                    console.error('Error loading user info for comment:', error)
                  }
                }
                
                // Update replyTo info if exists
                if (comment.replyTo && comment.replyTo.userId) {
                  try {
                    const repliedUserDoc = await getDoc(doc(db, 'users', comment.replyTo.userId))
                    if (repliedUserDoc.exists()) {
                      const repliedUserData = repliedUserDoc.data()
                      comment.replyTo.userAvatar = repliedUserData.avatar || ''
                      comment.replyTo.userDisplayName = repliedUserData.displayName || comment.replyTo.userDisplayName || 'Người dùng'
                    }
                  } catch (error) {
                    console.error('Error loading replied user info:', error)
                  }
                }
                
                // Recursively update replies
                if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
                  await updateCommentInfo(comment.replies)
                }
              }
            }
            
            await updateCommentInfo(post.comments)
          }
          
          return post
        })
      )
      
      // Filter posts based on privacy settings
      const authStore = useAuthStore()
      const currentUserId = authStore.user?.uid
      const currentUserFriends = authStore.userProfile?.friends || []
      
      const filteredPosts = postsWithLatestInfo.filter(post => {
        // If no privacy set, default to public
        const privacy = post.privacy || 'public'
        
        // Owner can always see their own posts
        if (post.userId === currentUserId) {
          return true
        }
        
        // Public posts: everyone can see
        if (privacy === 'public') {
          return true
        }
        
        // Friends only: only friends can see
        if (privacy === 'friends') {
          return currentUserFriends.includes(post.userId)
        }
        
        // Only me: only owner can see (already handled above)
        if (privacy === 'onlyMe') {
          return false
        }
        
        // Default: show public posts
        return true
      })
      
      posts.value = filteredPosts
    })
  }

  const createPost = async (content, imageUrl = null, userId, userDisplayName, userAvatar, fileData = null) => {
    loading.value = true
    try {
      const postData = {
        content,
        imageUrl: imageUrl || null, // For backward compatibility
        userId,
        userDisplayName,
        userAvatar,
        likes: [],
        comments: [],
        privacy: 'public', // Default privacy: public
        createdAt: new Date().toISOString()
      }

      // Add file data if exists (can have multiple types: images + audio/video)
      if (fileData) {
        console.log('Creating post with fileData:', { type: fileData.type, hasAudio: !!fileData.audio, hasVideo: !!fileData.video })
        
        if (fileData.type === 'images' && fileData.images) {
          // Multiple images
          postData.images = fileData.images // Array of base64 images
          postData.imageCount = fileData.count || fileData.images.length
          // Set first image for backward compatibility
          postData.imageUrl = fileData.images[0]
          
          // Can also have audio with images
          if (fileData.audio) {
            console.log('Adding audio to images post')
            postData.audioType = fileData.audio.type
            postData.audioData = fileData.audio.data
            postData.audioDuration = fileData.audio.duration || null
            postData.audioFileName = fileData.audio.filename || null
            postData.audioSize = fileData.audio.size || null
            postData.audioMimeType = fileData.audio.mimeType || null
          }
          
          // Can also have video with images
          if (fileData.video) {
            postData.videoType = fileData.video.type
            postData.videoData = fileData.video.data
            postData.videoFileName = fileData.video.filename || null
            postData.videoSize = fileData.video.size || null
            postData.videoMimeType = fileData.video.mimeType || null
          }
        } else {
          // Single file (video, audio, or single image)
          console.log('Single file post:', fileData.type)
          postData.fileType = fileData.type
          postData.fileData = fileData.data
          postData.fileName = fileData.filename || null
          postData.fileSize = fileData.size || null
          postData.mimeType = fileData.mimeType || null
          if (fileData.duration) {
            postData.duration = fileData.duration
          }
          
          // Also set imageUrl if it's an image (for backward compatibility)
          if (fileData.type === 'image') {
            postData.imageUrl = fileData.data
          }
          
          // Can have audio with video
          if (fileData.audio) {
            console.log('Adding audio to single file post')
            postData.audioType = fileData.audio.type
            postData.audioData = fileData.audio.data
            postData.audioDuration = fileData.audio.duration || null
            postData.audioFileName = fileData.audio.filename || null
            postData.audioSize = fileData.audio.size || null
            postData.audioMimeType = fileData.audio.mimeType || null
          }
        }
        
        console.log('Final postData:', { 
          fileType: postData.fileType, 
          hasFileData: !!postData.fileData,
          hasAudioData: !!postData.audioData,
          hasImages: !!postData.images 
        })
      }

      const postRef = await addDoc(collection(db, 'posts'), postData)
      
      // Create notifications for friends when a new post is created
      // Only notify if privacy is 'public' or 'friends'
      try {
        const postPrivacy = postData.privacy || 'public'
        
        // Only send notifications for public or friends posts
        if (postPrivacy === 'public' || postPrivacy === 'friends') {
          const authStore = useAuthStore()
          const userFriends = authStore.userProfile?.friends || []
          
          if (userFriends.length > 0) {
            const notificationsStore = useNotificationsStore()
            const userDoc = await getDoc(doc(db, 'users', userId))
            const userData = userDoc.exists() ? userDoc.data() : {}
            
            // Tạo thông báo cho tất cả bạn bè
            const notificationPromises = userFriends.map(friendId => 
              notificationsStore.createNotification(friendId, 'new_post', {
                fromUserId: userId,
                fromUserName: userData.displayName || userDisplayName || 'Người dùng',
                fromUserAvatar: userData.avatar || userAvatar || '',
                postId: postRef.id
              })
            )
            Promise.all(notificationPromises).catch(error => {
              console.error('Error creating post notifications:', error)
            })
          }
        }
      } catch (error) {
        console.error('Error creating notifications for new post:', error)
        // Don't fail the post creation if notification creation fails
      }
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const likePost = async (postId, userId) => {
    try {
      const postRef = doc(db, 'posts', postId)
      const post = posts.value.find(p => p.id === postId)
      
      if (!post) {
        console.error('Post not found:', postId)
        return { success: false, error: 'Post not found' }
      }
      
      if (post.likes.includes(userId)) {
        // Unlike: remove like
        await updateDoc(postRef, {
          likes: arrayRemove(userId)
        })
        console.log('✅ Post unliked by user:', userId)
      } else {
        // Like: add like
        await updateDoc(postRef, {
          likes: arrayUnion(userId)
        })
        // Tạo thông báo cho chủ bài viết
        if (post.userId !== userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId))
            const userData = userDoc.exists() ? userDoc.data() : {}
            const notificationsStore = useNotificationsStore()
            await notificationsStore.createNotification(post.userId, 'like', {
              fromUserId: userId,
              fromUserName: userData.displayName || 'Người dùng',
              fromUserAvatar: userData.avatar || '',
              postId: postId
            })
          } catch (error) {
            console.error('Error creating like notification:', error)
          }
        }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const addComment = async (postId, comment, userId, userDisplayName, userAvatar, fileData = null, parentCommentId = null, repliedToCommentId = null) => {
    try {
      const postRef = doc(db, 'posts', postId)
      const postDoc = await getDoc(postRef)
      const post = postDoc.exists() ? postDoc.data() : null
      
      const newComment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content: comment || '',
        userId,
        userDisplayName,
        userAvatar,
        createdAt: new Date().toISOString(),
        replies: [],
        likes: []
      }

      // If this is a reply, add the comment being replied to (the one user clicked "Phản hồi" on)
      // repliedToCommentId is the comment user actually clicked on (for replyTo info)
      // parentCommentId is for adding to the correct replies array (same level)
      if (repliedToCommentId) {
        // Find the comment being replied to (the one user clicked on)
        // Search in both current post data and also check if it's in the posts store (for real-time updates)
        const findRepliedComment = (commentList, targetId) => {
          for (const comment of commentList) {
            if (comment.id === targetId) {
              return comment
            }
            if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
              const found = findRepliedComment(comment.replies, targetId)
              if (found) return found
            }
          }
          return null
        }
        
        let repliedComment = null
        
        // First try to find in posts store (real-time data, most up-to-date)
        const postsStore = usePostsStore()
        const currentPost = postsStore.posts.find(p => p.id === postId)
        if (currentPost && currentPost.comments) {
          repliedComment = findRepliedComment(currentPost.comments, repliedToCommentId)
        }
        
        // If not found, try to find in current post data from Firestore
        if (!repliedComment && post && post.comments) {
          repliedComment = findRepliedComment(post.comments, repliedToCommentId)
        }
        
        if (repliedComment) {
          // Get latest info for replied user
          let repliedUserAvatar = repliedComment.userAvatar || ''
          let repliedUserDisplayName = repliedComment.userDisplayName || 'Người dùng'
          
          try {
            const repliedUserDoc = await getDoc(doc(db, 'users', repliedComment.userId))
            if (repliedUserDoc.exists()) {
              const repliedUserData = repliedUserDoc.data()
              repliedUserAvatar = repliedUserData.avatar || ''
              repliedUserDisplayName = repliedUserData.displayName || repliedUserDisplayName
            }
          } catch (error) {
            console.error('Error loading replied user info:', error)
          }
          
          newComment.replyTo = {
            commentId: repliedToCommentId, // The comment user clicked "Phản hồi" on
            userId: repliedComment.userId,
            userDisplayName: repliedUserDisplayName,
            userAvatar: repliedUserAvatar
          }
          console.log('✅ Found replied comment:', repliedComment.userDisplayName, 'ID:', repliedToCommentId)
        } else {
          console.warn('⚠️ Could not find replied comment:', repliedToCommentId)
          console.warn('   Available comment IDs in post:', currentPost?.comments?.map(c => c.id).join(', ') || 'none')
        }
      }

      // Add file data if exists
      if (fileData) {
        newComment.fileType = fileData.type
        newComment.fileData = fileData.data
        newComment.fileName = fileData.filename || null
        newComment.fileSize = fileData.size || null
        newComment.mimeType = fileData.mimeType || null
        if (fileData.duration) {
          newComment.duration = fileData.duration
        }
      }

      // If this is a reply, add to parent comment's replies (supports nested replies)
      if (parentCommentId && post && post.comments) {
        // Deep clone comments array to avoid mutation issues
        const comments = JSON.parse(JSON.stringify(post.comments))
        
        // Recursive function to find and add reply to parent (supports nested replies)
        const findAndAddReply = (commentList, parentId, newReply, depth = 0) => {
          for (let i = 0; i < commentList.length; i++) {
            // Check if this is the parent
            if (commentList[i].id === parentId) {
              if (!commentList[i].replies) {
                commentList[i].replies = []
              }
              commentList[i].replies.push(newReply)
              console.log(`✅ Found parent at depth ${depth}, added reply to comment ${parentId}`)
              return true
            }
            
            // Check in replies recursively
            if (commentList[i].replies && Array.isArray(commentList[i].replies) && commentList[i].replies.length > 0) {
              if (findAndAddReply(commentList[i].replies, parentId, newReply, depth + 1)) {
                return true
              }
            }
          }
          return false
        }
        
        // Helper function to collect all comment IDs (including nested)
        const getAllCommentIds = (commentList, depth = 0) => {
          const ids = []
          for (const comment of commentList) {
            ids.push({ id: comment.id, depth })
            if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
              ids.push(...getAllCommentIds(comment.replies, depth + 1))
            }
          }
          return ids
        }
        
        const allIds = getAllCommentIds(comments)
        console.log('🔍 Looking for parent comment:', parentCommentId)
        console.log('📋 All available comment IDs:', allIds.map(c => `[depth ${c.depth}] ${c.id}`).join(', '))
        console.log('📝 Current comments structure:', JSON.stringify(comments, null, 2).substring(0, 500))
        
        const found = findAndAddReply(comments, parentCommentId, newComment)
        
        if (found) {
          // Update the entire comments array to preserve nested structure
          console.log('💾 Updating comments with nested structure')
          await updateDoc(postRef, {
            comments: comments
          })
        } else {
          console.warn('❌ Parent comment not found, adding as top-level comment. Parent ID:', parentCommentId)
          console.warn('Available comment IDs:', comments.map(c => c.id).join(', '))
          // Fallback: add as top-level comment if parent not found
          await updateDoc(postRef, {
            comments: arrayUnion(newComment)
          })
        }
      } else {
        // Add as top-level comment
        await updateDoc(postRef, {
          comments: arrayUnion(newComment)
        })
      }

      // Create notifications
      const notificationsStore = useNotificationsStore()
      const commentText = comment || (fileData ? 
        (fileData.type === 'image' ? '📷 Ảnh' : 
         fileData.type === 'video' ? '🎥 Video' : 
         fileData.type === 'audio' ? '🎤 Ghi âm' : 
         fileData.type === 'sticker' ? '😊 Sticker' : '📎 File') : 'Bình luận')
      
      // Get latest user info
      let latestDisplayName = userDisplayName
      let latestAvatar = userAvatar
      try {
        const userDoc = await getDoc(doc(db, 'users', userId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          latestDisplayName = userData.displayName || userDisplayName
          latestAvatar = userData.avatar || userAvatar
        }
      } catch (error) {
        console.error('Error loading user info for notification:', error)
      }
      
      // Tạo thông báo cho người được nhắc và chủ bài viết
      try {
        if (repliedToCommentId && newComment.replyTo) {
          // Reply comment: thông báo cho người được reply
          const repliedUserId = newComment.replyTo.userId
          if (repliedUserId !== userId) {
            await notificationsStore.createNotification(repliedUserId, 'comment', {
              fromUserId: userId,
              fromUserName: latestDisplayName,
              fromUserAvatar: latestAvatar,
              postId: postId,
              message: commentText
            })
          }
          // Cũng thông báo cho chủ bài viết (nếu khác người được reply)
          if (post && post.userId !== userId && post.userId !== repliedUserId) {
            await notificationsStore.createNotification(post.userId, 'comment', {
              fromUserId: userId,
              fromUserName: latestDisplayName,
              fromUserAvatar: latestAvatar,
              postId: postId,
              message: commentText
            })
          }
        } else if (post && post.userId !== userId) {
          // Comment thường: thông báo cho chủ bài viết
          await notificationsStore.createNotification(post.userId, 'comment', {
            fromUserId: userId,
            fromUserName: latestDisplayName,
            fromUserAvatar: latestAvatar,
            postId: postId,
            message: commentText
          })
        }
      } catch (error) {
        console.error('Error creating comment notifications:', error)
      }
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const likeComment = async (postId, commentId, userId, isReply = false, parentCommentId = null) => {
    try {
      const postRef = doc(db, 'posts', postId)
      const postDoc = await getDoc(postRef)
      const post = postDoc.exists() ? postDoc.data() : null
      
      if (!post || !post.comments) {
        return { success: false, error: 'Post or comments not found' }
      }

      const comments = [...post.comments]
      
      if (isReply && parentCommentId) {
        const parentIndex = comments.findIndex(c => c.id === parentCommentId)
        if (parentIndex !== -1 && comments[parentIndex].replies) {
          const replyIndex = comments[parentIndex].replies.findIndex(r => r.id === commentId)
          if (replyIndex !== -1) {
            const reply = comments[parentIndex].replies[replyIndex]
            if (!reply.likes) reply.likes = []
            
            if (reply.likes.includes(userId)) {
              reply.likes = reply.likes.filter(id => id !== userId)
            } else {
              reply.likes.push(userId)
            }
            
            await updateDoc(postRef, { comments })
            return { success: true }
          }
        }
      } else {
        const commentIndex = comments.findIndex(c => c.id === commentId)
        if (commentIndex !== -1) {
          const comment = comments[commentIndex]
          if (!comment.likes) comment.likes = []
          
          if (comment.likes.includes(userId)) {
            comment.likes = comment.likes.filter(id => id !== userId)
          } else {
            comment.likes.push(userId)
          }
          
          await updateDoc(postRef, { comments })
          return { success: true }
        }
      }
      
      return { success: false, error: 'Comment not found' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updatePost = async (postId, updates) => {
    try {
      const postRef = doc(db, 'posts', postId)
      await updateDoc(postRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      return { success: true }
    } catch (error) {
      console.error('Error updating post:', error)
      return { success: false, error: error.message }
    }
  }

  const deletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    posts,
    loading,
    subscribeToPosts,
    createPost,
    likePost,
    addComment,
    likeComment,
    updatePost,
    deletePost
  }
})

