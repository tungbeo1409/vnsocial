<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h1 class="text-3xl font-bold mb-6 text-primary-600">🧪 Test Chức năng Kết bạn</h1>
        
        <div class="mb-6 flex gap-4">
          <button @click="runTest" :disabled="testing" class="btn-primary">
            {{ testing ? 'Đang test...' : '▶️ Chạy Test' }}
          </button>
          <button @click="clearLog" class="btn-secondary">🗑️ Xóa Log</button>
          <router-link to="/" class="btn-secondary">← Về trang chủ</router-link>
        </div>
        
        <div v-if="status" class="mb-4 p-4 rounded-lg" :class="statusClass">
          {{ status }}
        </div>
        
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          <div v-for="(log, index) in logs" :key="index" :class="log.type">
            {{ log.message }}
          </div>
          <div v-if="logs.length === 0" class="text-gray-500">
            Click "Chạy Test" để bắt đầu...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFriendsStore } from '@/stores/friends'
import { db } from '@/config/firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'

const authStore = useAuthStore()
const friendsStore = useFriendsStore()

const testing = ref(false)
const status = ref('')
const statusClass = ref('')
const logs = ref([])

function addLog(message, type = 'text-gray-300') {
  logs.value.push({ message, type })
}

function clearLog() {
  logs.value = []
  status.value = ''
}

function setStatus(text, type = 'bg-blue-100 text-blue-800') {
  status.value = text
  statusClass.value = type
}

async function runTest() {
  clearLog()
  testing.value = true
  setStatus('🔄 Đang chạy test...', 'bg-blue-100 text-blue-800')
  
  try {
    addLog('🧪 BẮT ĐẦU TEST CHỨC NĂNG KẾT BẠN', 'text-purple-400 font-bold')
    addLog('='.repeat(50), 'text-gray-500')
    
    // Step 1: Check auth
    addLog('', 'text-gray-500')
    addLog('🔐 Step 1: Kiểm tra authentication...', 'text-yellow-400')
    if (!authStore.user) {
      addLog('❌ CHƯA ĐĂNG NHẬP!', 'text-red-400')
      addLog('   → Vui lòng đăng nhập trước', 'text-yellow-400')
      setStatus('❌ Chưa đăng nhập', 'bg-red-100 text-red-800')
      return
    }
    addLog(`✅ User: ${authStore.user.email}`, 'text-green-400')
    addLog(`✅ UID: ${authStore.user.uid}`, 'text-green-400')
    
    // Step 2: Test read
    addLog('', 'text-gray-500')
    addLog('📖 Step 2: Test quyền đọc user profile...', 'text-yellow-400')
    try {
      const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
      if (!userDoc.exists()) {
        addLog('❌ User profile không tồn tại!', 'text-red-400')
        setStatus('❌ Profile không tồn tại', 'bg-red-100 text-red-800')
        return
      }
      const userData = userDoc.data()
      addLog('✅ Đọc được profile', 'text-green-400')
      addLog(`   - Display Name: ${userData.displayName || 'N/A'}`, 'text-gray-300')
      addLog(`   - Friends: ${userData.friends?.length || 0}`, 'text-gray-300')
      addLog(`   - Friend Requests: ${userData.friendRequests?.length || 0}`, 'text-gray-300')
      addLog(`   - Sent Requests: ${userData.sentRequests?.length || 0}`, 'text-gray-300')
    } catch (error) {
      addLog(`❌ Lỗi đọc profile: ${error.message}`, 'text-red-400')
      addLog('   → Có thể do Firestore Rules chưa cho phép đọc', 'text-yellow-400')
      setStatus('❌ Lỗi đọc profile', 'bg-red-100 text-red-800')
      return
    }
    
    // Step 3: Find other user
    addLog('', 'text-gray-500')
    addLog('🔍 Step 3: Tìm user khác để test...', 'text-yellow-400')
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    const otherUsers = []
    snapshot.forEach((doc) => {
      if (doc.id !== authStore.user.uid) {
        otherUsers.push({ id: doc.id, ...doc.data() })
      }
    })
    
    if (otherUsers.length === 0) {
      addLog('❌ Không tìm thấy user nào khác!', 'text-red-400')
      addLog('   → Tạo tài khoản khác để test', 'text-yellow-400')
      setStatus('❌ Không có user để test', 'bg-red-100 text-red-800')
      return
    }
    
    const testUser = otherUsers[0]
    addLog(`✅ Tìm thấy user: ${testUser.displayName}`, 'text-green-400')
    addLog(`   - ID: ${testUser.id}`, 'text-gray-300')
    addLog(`   - Username: ${testUser.username || 'N/A'}`, 'text-gray-300')
    
    // Step 4: Check status
    addLog('', 'text-gray-500')
    addLog('🤝 Step 4: Kiểm tra friendship status...', 'text-yellow-400')
    const status = await friendsStore.getFriendshipStatus(authStore.user.uid, testUser.id)
    addLog(`✅ Status: ${status}`, 'text-green-400')
    
    // Step 5: Test send request
    addLog('', 'text-gray-500')
    addLog('📤 Step 5: Test gửi lời mời kết bạn...', 'text-yellow-400')
    
    if (status === 'none') {
      addLog('   → Đang gửi lời mời...', 'text-gray-300')
      const result = await friendsStore.sendFriendRequest(authStore.user.uid, testUser.id)
      
      if (result.success) {
        addLog('✅ Gửi lời mời thành công!', 'text-green-400')
        
        // Wait for update
        addLog('   → Đang đợi Firestore cập nhật...', 'text-gray-300')
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Verify
        addLog('', 'text-gray-500')
        addLog('🔍 Step 6: Verify dữ liệu...', 'text-yellow-400')
        const senderDoc = await getDoc(doc(db, 'users', authStore.user.uid))
        const senderData = senderDoc.data()
        const receiverDoc = await getDoc(doc(db, 'users', testUser.id))
        const receiverData = receiverDoc.data()
        
        addLog(`   Sender sentRequests: ${JSON.stringify(senderData.sentRequests || [])}`, 'text-gray-300')
        addLog(`   Receiver friendRequests: ${JSON.stringify(receiverData.friendRequests || [])}`, 'text-gray-300')
        
        const senderHasRequest = senderData.sentRequests?.includes(testUser.id)
        const receiverHasRequest = receiverData.friendRequests?.includes(authStore.user.uid)
        
        if (senderHasRequest && receiverHasRequest) {
          addLog('✅ Dữ liệu đã được cập nhật đúng!', 'text-green-400')
          addLog('', 'text-gray-500')
          addLog('🎉 TEST THÀNH CÔNG!', 'text-green-400 font-bold')
          setStatus('✅ Test thành công!', 'bg-green-100 text-green-800')
        } else {
          addLog('❌ Dữ liệu chưa được cập nhật đúng!', 'text-red-400')
          addLog('   → Có thể do Firestore Rules chưa cho phép update', 'text-yellow-400')
          addLog('   → Xem file FIRESTORE_RULES_FIXED.txt', 'text-yellow-400')
          setStatus('❌ Dữ liệu chưa update', 'bg-red-100 text-red-800')
        }
      } else {
        addLog(`❌ Gửi lời mời thất bại: ${result.error}`, 'text-red-400')
        addLog('   → Có thể do Firestore Rules chưa cho phép update', 'text-yellow-400')
        addLog('   → Xem file FIRESTORE_RULES_FIXED.txt', 'text-yellow-400')
        setStatus('❌ Gửi lời mời thất bại', 'bg-red-100 text-red-800')
      }
    } else if (status === 'sent') {
      addLog('⚠️  Đã gửi lời mời rồi', 'text-yellow-400')
      addLog('   → Test hủy lời mời...', 'text-gray-300')
      const result = await friendsStore.cancelFriendRequest(authStore.user.uid, testUser.id)
      if (result.success) {
        addLog('✅ Hủy lời mời thành công!', 'text-green-400')
        setStatus('✅ Test thành công!', 'bg-green-100 text-green-800')
      } else {
        addLog(`❌ Hủy lời mời thất bại: ${result.error}`, 'text-red-400')
        setStatus('❌ Hủy lời mời thất bại', 'bg-red-100 text-red-800')
      }
    } else if (status === 'friends') {
      addLog('⚠️  Đã là bạn bè rồi!', 'text-yellow-400')
      setStatus('✅ Đã là bạn bè', 'bg-green-100 text-green-800')
    } else if (status === 'received') {
      addLog('⚠️  Đã nhận lời mời từ user này!', 'text-yellow-400')
      addLog('   → Test chấp nhận lời mời...', 'text-gray-300')
      const result = await friendsStore.acceptFriendRequest(authStore.user.uid, testUser.id)
      if (result.success) {
        addLog('✅ Chấp nhận lời mời thành công!', 'text-green-400')
        setStatus('✅ Test thành công!', 'bg-green-100 text-green-800')
      } else {
        addLog(`❌ Chấp nhận lời mời thất bại: ${result.error}`, 'text-red-400')
        setStatus('❌ Chấp nhận thất bại', 'bg-red-100 text-red-800')
      }
    }
    
  } catch (error) {
    addLog('', 'text-gray-500')
    addLog(`❌ LỖI: ${error.message}`, 'text-red-400')
    addLog(`   Stack: ${error.stack}`, 'text-red-400')
    setStatus('❌ Có lỗi xảy ra', 'bg-red-100 text-red-800')
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.bg-gray-900 {
  background-color: #111827;
}
</style>

