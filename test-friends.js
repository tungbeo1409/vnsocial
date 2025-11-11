/**
 * Test script cho chức năng kết bạn
 * Chạy trong browser console sau khi đăng nhập
 */

// Import Firebase functions (chạy trong browser console)
async function testFriendRequest() {
  console.log('🧪 Bắt đầu test chức năng kết bạn...\n')
  
  // Test 1: Kiểm tra Firebase connection
  console.log('📋 Test 1: Kiểm tra Firebase connection')
  try {
    const { db } = await import('./src/config/firebase.js')
    console.log('✅ Firebase connected:', !!db)
  } catch (error) {
    console.error('❌ Firebase connection failed:', error)
    return
  }
  
  // Test 2: Kiểm tra user đã đăng nhập
  console.log('\n📋 Test 2: Kiểm tra user đã đăng nhập')
  const authStore = (await import('./src/stores/auth.js')).useAuthStore()
  if (!authStore.user) {
    console.error('❌ Chưa đăng nhập! Vui lòng đăng nhập trước.')
    return
  }
  console.log('✅ User đã đăng nhập:', authStore.user.uid)
  console.log('✅ User profile:', authStore.userProfile)
  
  // Test 3: Kiểm tra Firestore Rules - Đọc user profile
  console.log('\n📋 Test 3: Kiểm tra Firestore Rules - Đọc user profile')
  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const { db } = await import('./src/config/firebase.js')
    const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log('✅ Đọc được user profile')
      console.log('   - friends:', userData.friends || [])
      console.log('   - friendRequests:', userData.friendRequests || [])
      console.log('   - sentRequests:', userData.sentRequests || [])
    } else {
      console.error('❌ User profile không tồn tại!')
      return
    }
  } catch (error) {
    console.error('❌ Lỗi đọc user profile:', error.message)
    console.error('   → Có thể do Firestore Rules chưa cho phép đọc')
    return
  }
  
  // Test 4: Tìm user khác để test
  console.log('\n📋 Test 4: Tìm user khác để test')
  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const { db } = await import('./src/config/firebase.js')
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    const otherUsers = []
    snapshot.forEach((doc) => {
      if (doc.id !== authStore.user.uid) {
        otherUsers.push({ id: doc.id, ...doc.data() })
      }
    })
    
    if (otherUsers.length === 0) {
      console.error('❌ Không tìm thấy user nào khác để test!')
      console.log('   → Tạo tài khoản khác để test')
      return
    }
    
    const testUser = otherUsers[0]
    console.log('✅ Tìm thấy user để test:', testUser.displayName, `(${testUser.id})`)
    
    // Test 5: Kiểm tra friendship status
    console.log('\n📋 Test 5: Kiểm tra friendship status')
    const friendsStore = (await import('./src/stores/friends.js')).useFriendsStore()
    const status = await friendsStore.getFriendshipStatus(authStore.user.uid, testUser.id)
    console.log('✅ Friendship status:', status)
    
    // Test 6: Test gửi lời mời kết bạn
    console.log('\n📋 Test 6: Test gửi lời mời kết bạn')
    if (status === 'none') {
      console.log('   → Đang gửi lời mời...')
      const result = await friendsStore.sendFriendRequest(authStore.user.uid, testUser.id)
      
      if (result.success) {
        console.log('✅ Gửi lời mời thành công!')
        
        // Verify: Kiểm tra sentRequests
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('./src/config/firebase.js')
        const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
        const userData = userDoc.data()
        console.log('   - sentRequests sau khi gửi:', userData.sentRequests || [])
        
        // Verify: Kiểm tra friendRequests của người nhận
        const otherUserDoc = await getDoc(doc(db, 'users', testUser.id))
        const otherUserData = otherUserDoc.data()
        console.log('   - friendRequests của người nhận:', otherUserData.friendRequests || [])
        
        if (userData.sentRequests?.includes(testUser.id) && 
            otherUserData.friendRequests?.includes(authStore.user.uid)) {
          console.log('✅ Dữ liệu đã được cập nhật đúng!')
        } else {
          console.error('❌ Dữ liệu chưa được cập nhật đúng!')
        }
      } else {
        console.error('❌ Gửi lời mời thất bại:', result.error)
        console.error('   → Có thể do Firestore Rules chưa cho phép update')
      }
    } else if (status === 'sent') {
      console.log('⚠️  Đã gửi lời mời rồi, đang hủy...')
      const result = await friendsStore.cancelFriendRequest(authStore.user.uid, testUser.id)
      if (result.success) {
        console.log('✅ Hủy lời mời thành công!')
      } else {
        console.error('❌ Hủy lời mời thất bại:', result.error)
      }
    } else if (status === 'friends') {
      console.log('⚠️  Đã là bạn bè rồi!')
    } else if (status === 'received') {
      console.log('⚠️  Đã nhận lời mời từ user này!')
    }
    
  } catch (error) {
    console.error('❌ Lỗi trong test:', error)
    console.error('   Stack:', error.stack)
  }
  
  // Test 7: Kiểm tra Firestore Rules chi tiết
  console.log('\n📋 Test 7: Kiểm tra Firestore Rules')
  console.log('   → Vào Firebase Console > Firestore > Rules')
  console.log('   → Đảm bảo có rules cho phép update friendRequests, friends, sentRequests')
  console.log('   → Xem file FIRESTORE_RULES_FIXED.txt để copy rules')
  
  console.log('\n✅ Test hoàn tất!')
  console.log('\n📝 Tóm tắt:')
  console.log('   1. Firebase connection: OK')
  console.log('   2. User authentication: OK')
  console.log('   3. Read user profile: Cần kiểm tra Rules')
  console.log('   4. Send friend request: Cần kiểm tra Rules')
  console.log('   5. Update arrays: Cần kiểm tra Rules')
}

// Export để có thể gọi từ console
if (typeof window !== 'undefined') {
  window.testFriendRequest = testFriendRequest
  console.log('💡 Chạy test bằng cách gọi: testFriendRequest()')
}

export { testFriendRequest }

