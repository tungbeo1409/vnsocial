# 🧪 Hướng dẫn Test Chức năng Kết bạn

## Cách 1: Test trong Browser Console (Khuyến nghị)

### Bước 1: Mở trang web và đăng nhập
1. Chạy `npm run dev`
2. Mở trình duyệt và đăng nhập
3. Mở Developer Tools (F12)
4. Vào tab **Console**

### Bước 2: Import và chạy test
Copy và paste code sau vào Console:

```javascript
// Import stores
const { useAuthStore } = await import('./src/stores/auth.js')
const { useFriendsStore } = await import('./src/stores/friends.js')
const { db } = await import('./src/config/firebase.js')
const { doc, getDoc, collection, getDocs } = await import('firebase/firestore')

const authStore = useAuthStore()
const friendsStore = useFriendsStore()

// Test
console.log('🧪 Bắt đầu test...')

// Test 1: Check auth
if (!authStore.user) {
  console.error('❌ Chưa đăng nhập!')
} else {
  console.log('✅ User:', authStore.user.uid)
  
  // Test 2: Read profile
  try {
    const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
    console.log('✅ Đọc được profile:', userDoc.exists())
  } catch (error) {
    console.error('❌ Lỗi đọc:', error.message)
  }
  
  // Test 3: Find other user
  const snapshot = await getDocs(collection(db, 'users'))
  const otherUsers = []
  snapshot.forEach((doc) => {
    if (doc.id !== authStore.user.uid) {
      otherUsers.push({ id: doc.id, ...doc.data() })
    }
  })
  
  if (otherUsers.length > 0) {
    const testUser = otherUsers[0]
    console.log('✅ User để test:', testUser.displayName)
    
    // Test 4: Send friend request
    const result = await friendsStore.sendFriendRequest(authStore.user.uid, testUser.id)
    console.log('Kết quả:', result)
  }
}
```

---

## Cách 2: Test bằng file HTML

1. Mở file `test-friends-browser.html` trong trình duyệt
2. Click nút "▶️ Chạy Test"
3. Xem kết quả trong log

**Lưu ý**: Cần chạy từ local server (không thể mở trực tiếp file://)

---

## Cách 3: Test thủ công

### Test 1: Kiểm tra Firestore Rules
1. Vào Firebase Console > Firestore > Rules
2. Đảm bảo có rules cho phép update `friendRequests`, `friends`, `sentRequests`
3. Xem file `FIRESTORE_RULES_FIXED.txt`

### Test 2: Test trong UI
1. Tìm kiếm user
2. Click "Kết bạn"
3. Mở Console (F12) xem có lỗi không
4. Kiểm tra Network tab xem request có bị block không

### Test 3: Kiểm tra dữ liệu
1. Vào Firebase Console > Firestore
2. Xem collection `users`
3. Kiểm tra field `sentRequests` và `friendRequests` có được update không

---

## Các lỗi thường gặp

### 1. "Missing or insufficient permissions"
**Nguyên nhân**: Firestore Rules chưa cho phép update

**Giải pháp**: 
- Copy rules từ `FIRESTORE_RULES_FIXED.txt`
- Paste vào Firebase Console > Firestore > Rules
- Click "Publish"

### 2. "ERR_BLOCKED_BY_CLIENT"
**Nguyên nhân**: Ad blocker chặn requests

**Giải pháp**: 
- Tắt ad blocker
- Hoặc dùng chế độ Incognito

### 3. "User profile không tồn tại"
**Nguyên nhân**: User chưa có profile trong Firestore

**Giải pháp**: 
- Đăng ký lại tài khoản
- Hoặc tạo profile thủ công trong Firestore

---

## Checklist Test

- [ ] User đã đăng nhập
- [ ] Có thể đọc user profile
- [ ] Có thể tìm thấy user khác
- [ ] Có thể gửi lời mời kết bạn
- [ ] `sentRequests` được update
- [ ] `friendRequests` của người nhận được update
- [ ] UI hiển thị đúng trạng thái
- [ ] Có thể chấp nhận/từ chối lời mời
- [ ] Có thể hủy kết bạn

---

## Debug Tips

1. **Mở Console**: F12 > Console
2. **Xem Network**: F12 > Network > Filter "firestore"
3. **Xem Firestore**: Firebase Console > Firestore > Data
4. **Xem Rules**: Firebase Console > Firestore > Rules

Nếu vẫn lỗi, copy toàn bộ error message và gửi để debug!

