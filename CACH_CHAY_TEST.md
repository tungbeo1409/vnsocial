# 🚀 Cách Chạy Test Đúng

## Vấn đề
File HTML không thể import ES modules khi mở trực tiếp (file://) do CORS policy.

## Giải pháp: Chạy từ Dev Server

### Cách 1: Chạy test-runner.html từ dev server (Khuyến nghị)

1. **Đảm bảo dev server đang chạy:**
   ```bash
   npm run dev
   ```

2. **Mở file test từ dev server:**
   - Không double-click file
   - Mở trình duyệt và vào: `http://localhost:5173/test-runner.html`
   - Hoặc copy file vào thư mục `public/` và mở: `http://localhost:5173/test-runner.html`

3. **Đảm bảo đã đăng nhập:**
   - Mở tab khác: http://localhost:5173
   - Đăng nhập
   - Quay lại tab test

4. **Click "▶️ Chạy Test Đầy Đủ"**

---

## Cách 2: Test trực tiếp trong Console của ứng dụng

1. **Mở ứng dụng:** http://localhost:5173
2. **Đăng nhập**
3. **Mở Console:** F12 > Console
4. **Gõ:** `allow pasting` (nếu bị chặn paste)
5. **Copy và paste code sau:**

```javascript
// Test script
const {useAuthStore} = await import('./src/stores/auth.js')
const {useFriendsStore} = await import('./src/stores/friends.js')
const {db} = await import('./src/config/firebase.js')
const {doc, getDoc, collection, getDocs} = await import('firebase/firestore')

const authStore = useAuthStore()
const friendsStore = useFriendsStore()

console.log('🧪 Testing...')

// Check auth
if (!authStore.user) {
  console.error('❌ Chưa đăng nhập!')
} else {
  console.log('✅ User:', authStore.user.uid)
  
  // Test read
  try {
    const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
    console.log('✅ Read OK:', userDoc.exists())
    console.log('   Data:', userDoc.data())
  } catch (e) {
    console.error('❌ Read failed:', e.message)
  }
  
  // Find other user
  const snapshot = await getDocs(collection(db, 'users'))
  const others = []
  snapshot.forEach(d => {
    if (d.id !== authStore.user.uid) {
      others.push({ id: d.id, ...d.data() })
    }
  })
  
  if (others.length > 0) {
    const testUser = others[0]
    console.log('✅ Test user:', testUser.displayName)
    
    // Test send request
    console.log('→ Đang gửi lời mời...')
    const result = await friendsStore.sendFriendRequest(authStore.user.uid, testUser.id)
    console.log('Kết quả:', result)
    
    if (result.success) {
      // Wait and verify
      await new Promise(r => setTimeout(r, 1500))
      const senderDoc = await getDoc(doc(db, 'users', authStore.user.uid))
      const receiverDoc = await getDoc(doc(db, 'users', testUser.id))
      console.log('Sender sentRequests:', senderDoc.data().sentRequests)
      console.log('Receiver friendRequests:', receiverDoc.data().friendRequests)
    }
  } else {
    console.error('❌ Không có user để test!')
  }
}
```

---

## Cách 3: Di chuyển file vào public/

1. **Copy file test-runner.html vào thư mục `public/`:**
   ```bash
   cp test-runner.html public/
   ```

2. **Mở từ dev server:**
   - http://localhost:5173/test-runner.html

---

## Tóm tắt

✅ **Đúng:** Mở từ http://localhost:5173/test-runner.html  
❌ **Sai:** Double-click file để mở (file://)

---

## Nếu vẫn lỗi

1. Kiểm tra dev server đang chạy: `npm run dev`
2. Kiểm tra port: http://localhost:5173
3. Thử cách 2: Test trực tiếp trong Console

