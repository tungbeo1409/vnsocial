/**
 * Script test đơn giản - Copy và paste vào Browser Console
 * Sau khi đã đăng nhập vào ứng dụng
 */

async function testFriendRequestFlow() {
  console.clear()
  console.log('%c🧪 TEST CHỨC NĂNG KẾT BẠN', 'font-size: 20px; font-weight: bold; color: #3b82f6;')
  console.log('='.repeat(50))
  
  try {
    // Step 1: Import modules
    console.log('\n📦 Step 1: Import modules...')
    const { useAuthStore } = await import('./src/stores/auth.js')
    const { useFriendsStore } = await import('./src/stores/friends.js')
    const { db } = await import('./src/config/firebase.js')
    const { doc, getDoc, collection, getDocs, updateDoc, arrayUnion } = await import('firebase/firestore')
    
    const authStore = useAuthStore()
    const friendsStore = useFriendsStore()
    
    console.log('✅ Modules imported')
    
    // Step 2: Check authentication
    console.log('\n🔐 Step 2: Kiểm tra authentication...')
    if (!authStore.user) {
      console.error('❌ CHƯA ĐĂNG NHẬP! Vui lòng đăng nhập trước.')
      return { success: false, error: 'Not authenticated' }
    }
    console.log('✅ User:', authStore.user.email)
    console.log('✅ UID:', authStore.user.uid)
    
    // Step 3: Test read permission
    console.log('\n📖 Step 3: Test quyền đọc user profile...')
    try {
      const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
      if (!userDoc.exists()) {
        console.error('❌ User profile không tồn tại!')
        return { success: false, error: 'User profile not found' }
      }
      const userData = userDoc.data()
      console.log('✅ Đọc được profile')
      console.log('   - Display Name:', userData.displayName)
      console.log('   - Friends:', userData.friends?.length || 0)
      console.log('   - Friend Requests:', userData.friendRequests?.length || 0)
      console.log('   - Sent Requests:', userData.sentRequests?.length || 0)
    } catch (error) {
      console.error('❌ Lỗi đọc profile:', error.message)
      console.error('   → Có thể do Firestore Rules chưa cho phép đọc')
      return { success: false, error: error.message }
    }
    
    // Step 4: Find another user
    console.log('\n🔍 Step 4: Tìm user khác để test...')
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    const otherUsers = []
    snapshot.forEach((doc) => {
      if (doc.id !== authStore.user.uid) {
        otherUsers.push({ id: doc.id, ...doc.data() })
      }
    })
    
    if (otherUsers.length === 0) {
      console.error('❌ Không tìm thấy user nào khác!')
      console.log('   → Tạo tài khoản khác để test')
      return { success: false, error: 'No other users found' }
    }
    
    const testUser = otherUsers[0]
    console.log('✅ Tìm thấy user:', testUser.displayName)
    console.log('   - ID:', testUser.id)
    console.log('   - Username:', testUser.username)
    
    // Step 5: Check friendship status
    console.log('\n🤝 Step 5: Kiểm tra friendship status...')
    const status = await friendsStore.getFriendshipStatus(authStore.user.uid, testUser.id)
    console.log('✅ Status:', status)
    
    // Step 6: Test send friend request
    console.log('\n📤 Step 6: Test gửi lời mời kết bạn...')
    
    if (status === 'none') {
      console.log('   → Đang gửi lời mời...')
      const result = await friendsStore.sendFriendRequest(authStore.user.uid, testUser.id)
      
      if (result.success) {
        console.log('✅ Gửi lời mời thành công!')
        
        // Wait a bit for Firestore to update
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Verify: Check sender's sentRequests
        console.log('\n🔍 Step 7: Verify dữ liệu...')
        const senderDoc = await getDoc(doc(db, 'users', authStore.user.uid))
        const senderData = senderDoc.data()
        const receiverDoc = await getDoc(doc(db, 'users', testUser.id))
        const receiverData = receiverDoc.data()
        
        console.log('   Sender sentRequests:', senderData.sentRequests || [])
        console.log('   Receiver friendRequests:', receiverData.friendRequests || [])
        
        const senderHasRequest = senderData.sentRequests?.includes(testUser.id)
        const receiverHasRequest = receiverData.friendRequests?.includes(authStore.user.uid)
        
        if (senderHasRequest && receiverHasRequest) {
          console.log('✅ Dữ liệu đã được cập nhật đúng!')
          console.log('\n🎉 TEST THÀNH CÔNG!')
          return { success: true }
        } else {
          console.error('❌ Dữ liệu chưa được cập nhật đúng!')
          console.error('   → Có thể do Firestore Rules chưa cho phép update')
          console.error('   → Xem file FIRESTORE_RULES_FIXED.txt')
          return { success: false, error: 'Data not updated correctly' }
        }
      } else {
        console.error('❌ Gửi lời mời thất bại:', result.error)
        console.error('   → Có thể do Firestore Rules chưa cho phép update')
        console.error('   → Xem file FIRESTORE_RULES_FIXED.txt để cập nhật Rules')
        return { success: false, error: result.error }
      }
    } else if (status === 'sent') {
      console.log('⚠️  Đã gửi lời mời rồi')
      console.log('   → Test hủy lời mời...')
      const result = await friendsStore.cancelFriendRequest(authStore.user.uid, testUser.id)
      if (result.success) {
        console.log('✅ Hủy lời mời thành công!')
        return { success: true }
      } else {
        console.error('❌ Hủy lời mời thất bại:', result.error)
        return { success: false, error: result.error }
      }
    } else if (status === 'friends') {
      console.log('⚠️  Đã là bạn bè rồi!')
      return { success: true, message: 'Already friends' }
    } else if (status === 'received') {
      console.log('⚠️  Đã nhận lời mời từ user này!')
      console.log('   → Test chấp nhận lời mời...')
      const result = await friendsStore.acceptFriendRequest(authStore.user.uid, testUser.id)
      if (result.success) {
        console.log('✅ Chấp nhận lời mời thành công!')
        return { success: true }
      } else {
        console.error('❌ Chấp nhận lời mời thất bại:', result.error)
        return { success: false, error: result.error }
      }
    }
    
  } catch (error) {
    console.error('\n❌ LỖI:', error.message)
    console.error('Stack:', error.stack)
    return { success: false, error: error.message }
  }
}

// Export để có thể gọi từ console
if (typeof window !== 'undefined') {
  window.testFriendRequestFlow = testFriendRequestFlow
  console.log('%c💡 Chạy test bằng cách gọi: testFriendRequestFlow()', 'color: #3b82f6; font-weight: bold;')
}

export { testFriendRequestFlow }

