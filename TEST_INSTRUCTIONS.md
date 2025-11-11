# 🧪 Hướng dẫn Test Chức năng Kết bạn

## Cách Test Nhanh (Khuyến nghị)

### Bước 1: Mở ứng dụng và đăng nhập
```bash
npm run dev
```
1. Mở trình duyệt: http://localhost:5173
2. Đăng nhập vào tài khoản

### Bước 2: Mở Browser Console
1. Nhấn **F12** để mở Developer Tools
2. Vào tab **Console**

### Bước 3: Copy và chạy test script

**Cách 1: Import file test**
```javascript
// Copy toàn bộ nội dung file test-friends-simple.js
// Paste vào Console và Enter
```

**Cách 2: Chạy trực tiếp**
```javascript
// Import stores
const { useAuthStore } = await import('./src/stores/auth.js')
const { useFriendsStore } = await import('./src/stores/friends.js')
const { db } = await import('./src/config/firebase.js')
const { doc, getDoc, collection, getDocs } = await import('firebase/firestore')

const authStore = useAuthStore()
const friendsStore = useFriendsStore()

// Test
console.log('🧪 Testing...')

// 1. Check auth
if (!authStore.user) {
  console.error('❌ Chưa đăng nhập!')
} else {
  console.log('✅ User:', authStore.user.uid)
  
  // 2. Test read
  try {
    const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
    console.log('✅ Read OK:', userDoc.exists())
  } catch (e) {
    console.error('❌ Read failed:', e.message)
  }
  
  // 3. Find other user
  const snapshot = await getDocs(collection(db, 'users'))
  const others = []
  snapshot.forEach(d => {
    if (d.id !== authStore.user.uid) others.push({ id: d.id, ...d.data() })
  })
  
  if (others.length > 0) {
    const testUser = others[0]
    console.log('✅ Test user:', testUser.displayName)
    
    // 4. Test send request
    const result = await friendsStore.sendFriendRequest(authStore.user.uid, testUser.id)
    console.log('Result:', result)
  }
}
```

---

## Kiểm tra Firestore Rules

### Nếu test báo lỗi "Missing or insufficient permissions":

1. **Vào Firebase Console:**
   - https://console.firebase.google.com/
   - Chọn project: **news-eff0b**
   - Vào **Firestore Database** > **Rules**

2. **Copy Rules từ file `FIRESTORE_RULES_FIXED.txt`**

3. **Paste vào Firebase Console và Publish**

4. **Test lại**

---

## Test Checklist

Sau khi chạy test, kiểm tra:

- [ ] ✅ User đã đăng nhập
- [ ] ✅ Có thể đọc user profile
- [ ] ✅ Tìm thấy user khác
- [ ] ✅ Gửi lời mời thành công
- [ ] ✅ `sentRequests` được update
- [ ] ✅ `friendRequests` của người nhận được update
- [ ] ✅ Không có lỗi trong Console

---

## Debug

### Nếu vẫn lỗi:

1. **Kiểm tra Console:**
   - F12 > Console
   - Xem error message chi tiết

2. **Kiểm tra Network:**
   - F12 > Network
   - Filter "firestore"
   - Xem request nào bị lỗi

3. **Kiểm tra Firestore:**
   - Firebase Console > Firestore > Data
   - Xem collection `users`
   - Kiểm tra field `sentRequests` và `friendRequests`

4. **Kiểm tra Rules:**
   - Firebase Console > Firestore > Rules
   - Đảm bảo đã publish rules mới

---

## Kết quả mong đợi

Khi test thành công, bạn sẽ thấy:

```
🧪 TEST CHỨC NĂNG KẾT BẠN
==================================================

📦 Step 1: Import modules...
✅ Modules imported

🔐 Step 2: Kiểm tra authentication...
✅ User: your@email.com
✅ UID: abc123...

📖 Step 3: Test quyền đọc user profile...
✅ Đọc được profile
   - Display Name: Your Name
   - Friends: 0
   - Friend Requests: 0
   - Sent Requests: 0

🔍 Step 4: Tìm user khác để test...
✅ Tìm thấy user: Other User
   - ID: xyz789...
   - Username: otheruser

🤝 Step 5: Kiểm tra friendship status...
✅ Status: none

📤 Step 6: Test gửi lời mời kết bạn...
   → Đang gửi lời mời...
✅ Gửi lời mời thành công!

🔍 Step 7: Verify dữ liệu...
   Sender sentRequests: ["xyz789..."]
   Receiver friendRequests: ["abc123..."]
✅ Dữ liệu đã được cập nhật đúng!

🎉 TEST THÀNH CÔNG!
```

---

## Nếu test thất bại

Copy toàn bộ error message và gửi để được hỗ trợ!

