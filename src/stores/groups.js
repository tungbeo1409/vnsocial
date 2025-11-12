import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useNotificationsStore } from './notifications'

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref([])
  const groupInvites = ref([])
  const loading = ref(false)

  // Create a new group
  const createGroup = async (creatorId, groupName, invitedUserIds) => {
    if (!invitedUserIds || invitedUserIds.length < 2) {
      return { success: false, error: 'Vui lòng chọn ít nhất 2 người để tạo nhóm' }
    }

    loading.value = true
    try {
      // Get creator info
      const creatorDoc = await getDoc(doc(db, 'users', creatorId))
      const creatorData = creatorDoc.exists() ? creatorDoc.data() : {}

      // Create group document
      const groupRef = doc(collection(db, 'groups'))
      const groupId = groupRef.id

      // Create group data
      const groupData = {
        id: groupId,
        name: groupName || 'Nhóm chat',
        createdBy: creatorId,
        createdAt: serverTimestamp(),
        members: [creatorId], // Creator is automatically a member
        pendingInvites: invitedUserIds, // Users who are invited but haven't accepted
        lastMessage: '',
        lastMessageTime: serverTimestamp()
      }

      await setDoc(groupRef, groupData)

      // Send invitations to all invited users
      const notificationsStore = useNotificationsStore()
      for (const userId of invitedUserIds) {
        // Add group invite to user's groupInvites array
        const userRef = doc(db, 'users', userId)
        await updateDoc(userRef, {
          groupInvites: arrayUnion(groupId)
        })

        // Create notification
        await notificationsStore.createNotification(userId, 'group_invite', {
          groupId: groupId,
          groupName: groupData.name,
          fromUserId: creatorId,
          fromUserName: creatorData.displayName || 'Người dùng',
          fromUserAvatar: creatorData.avatar || ''
        })
      }

      return { success: true, groupId }
    } catch (error) {
      console.error('Error creating group:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // Accept group invitation
  const acceptGroupInvite = async (userId, groupId) => {
    loading.value = true
    try {
      // Get group data
      const groupDoc = await getDoc(doc(db, 'groups', groupId))
      if (!groupDoc.exists()) {
        return { success: false, error: 'Nhóm không tồn tại' }
      }

      const groupData = groupDoc.data()

      // Check if user is in pendingInvites
      if (!groupData.pendingInvites || !groupData.pendingInvites.includes(userId)) {
        return { success: false, error: 'Bạn không có lời mời tham gia nhóm này' }
      }

      // Get user info for notification
      const userDoc = await getDoc(doc(db, 'users', userId))
      const userData = userDoc.exists() ? userDoc.data() : {}

      // Add user to members and remove from pendingInvites
      const groupRef = doc(db, 'groups', groupId)
      await updateDoc(groupRef, {
        members: arrayUnion(userId),
        pendingInvites: arrayRemove(userId)
      })

      // Remove group invite from user's groupInvites
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        groupInvites: arrayRemove(groupId)
      })

      // Create a system message in the group
      const messagesRef = collection(db, 'groups', groupId, 'messages')
      await setDoc(doc(messagesRef), {
        type: 'system',
        content: `${userData.displayName || 'Người dùng'} đã vào nhóm`,
        createdAt: serverTimestamp()
      })

      // Notify other members
      const notificationsStore = useNotificationsStore()
      const otherMembers = groupData.members.filter(memberId => memberId !== userId)
      for (const memberId of otherMembers) {
        await notificationsStore.createNotification(memberId, 'group_member_joined', {
          groupId: groupId,
          groupName: groupData.name,
          fromUserId: userId,
          fromUserName: userData.displayName || 'Người dùng',
          fromUserAvatar: userData.avatar || ''
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error accepting group invite:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // Reject group invitation
  const rejectGroupInvite = async (userId, groupId) => {
    loading.value = true
    try {
      // Get group data
      const groupDoc = await getDoc(doc(db, 'groups', groupId))
      if (!groupDoc.exists()) {
        return { success: false, error: 'Nhóm không tồn tại' }
      }

      const groupData = groupDoc.data()

      // Remove user from pendingInvites
      if (groupData.pendingInvites && groupData.pendingInvites.includes(userId)) {
        const groupRef = doc(db, 'groups', groupId)
        await updateDoc(groupRef, {
          pendingInvites: arrayRemove(userId)
        })
      }

      // Remove group invite from user's groupInvites
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        groupInvites: arrayRemove(groupId)
      })

      return { success: true }
    } catch (error) {
      console.error('Error rejecting group invite:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // Load user's group invites
  const loadGroupInvites = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        return []
      }

      const userData = userDoc.data()
      const inviteIds = Array.isArray(userData.groupInvites) ? userData.groupInvites : []

      // Get group details for each invite
      const invites = await Promise.all(
        inviteIds.map(async (groupId) => {
          try {
            const groupDoc = await getDoc(doc(db, 'groups', groupId))
            if (groupDoc.exists()) {
              const groupData = groupDoc.data()
              // Get creator info
              const creatorDoc = await getDoc(doc(db, 'users', groupData.createdBy))
              const creatorData = creatorDoc.exists() ? creatorDoc.data() : {}

              return {
                groupId: groupId,
                groupName: groupData.name || 'Nhóm chat',
                createdBy: groupData.createdBy,
                creatorName: creatorData.displayName || 'Người dùng',
                creatorAvatar: creatorData.avatar || '',
                createdAt: groupData.createdAt
              }
            }
            return null
          } catch (error) {
            console.error('Error loading group invite:', groupId, error)
            return null
          }
        })
      )

      return invites.filter(Boolean)
    } catch (error) {
      console.error('Error loading group invites:', error)
      return []
    }
  }

  // Load user's groups
  const loadUserGroups = async (userId) => {
    try {
      const groupsRef = collection(db, 'groups')
      const q = query(groupsRef, where('members', 'array-contains', userId))
      const snapshot = await getDocs(q)

      const groupsList = []
      snapshot.forEach((doc) => {
        groupsList.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return groupsList
    } catch (error) {
      console.error('Error loading user groups:', error)
      return []
    }
  }

  // Get group by ID
  const getGroupById = async (groupId) => {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId))
      if (groupDoc.exists()) {
        return { id: groupDoc.id, ...groupDoc.data() }
      }
      return null
    } catch (error) {
      console.error('Error getting group:', error)
      return null
    }
  }

  return {
    groups,
    groupInvites,
    loading,
    createGroup,
    acceptGroupInvite,
    rejectGroupInvite,
    loadGroupInvites,
    loadUserGroups,
    getGroupById
  }
})

