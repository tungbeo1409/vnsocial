# 🛡️ Cách Test An Toàn - Không Cần Paste vào Console

## Vấn đề
Browser chặn paste code vào Console để bảo vệ bạn khỏi mã độc.

## Giải pháp: Dùng File Test HTML

### Cách 1: Mở file test-runner.html (Khuyến nghị)

1. **Mở file `test-runner.html` trong trình duyệt:**
   - Cách 1: Double-click file `test-runner.html`
   - Cách 2: Kéo thả file vào trình duyệt
   - Cách 3: Right-click > Open with > Browser

2. **Đảm bảo bạn đã đăng nhập:**
   - Mở tab khác: http://localhost:5173
   - Đăng nhập vào ứng dụng
   - Quay lại tab test-runner.html

3. **Click nút "▶️ Chạy Test Đầy Đủ"**

4. **Xem kết quả trong log**

---

## Cách 2: Gõ `allow pasting` trong Console

Nếu vẫn muốn dùng Console:

1. Mở Console (F12)
2. **Gõ** (không paste): `allow pasting`
3. Nhấn Enter
4. Bây giờ có thể paste code

---

## Cách 3: Tạo Bookmark để test

1. Tạo bookmark mới với URL:
```javascript
javascript:(async function(){const {useAuthStore}=await import('./src/stores/auth.js');const {useFriendsStore}=await import('./src/stores/friends.js');const {db}=await import('./src/config/firebase.js');const {doc,getDoc,collection,getDocs}=await import('firebase/firestore');const authStore=useAuthStore();const friendsStore=useFriendsStore();if(!authStore.user){alert('Chưa đăng nhập!');return;}const snapshot=await getDocs(collection(db,'users'));const others=[];snapshot.forEach(d=>{if(d.id!==authStore.user.uid)others.push({id:d.id,...d.data()})});if(others.length===0){alert('Không có user để test!');return;}const result=await friendsStore.sendFriendRequest(authStore.user.uid,others[0].id);alert(result.success?'✅ Thành công!':'❌ Thất bại: '+result.error);})();
```

2. Click bookmark khi đã đăng nhập

---

## Khuyến nghị

**Dùng file `test-runner.html`** vì:
- ✅ An toàn (không cần paste code)
- ✅ Có UI đẹp
- ✅ Hiển thị log rõ ràng
- ✅ Có nút kiểm tra Rules
- ✅ Dễ sử dụng

---

## Lưu ý

- File HTML cần chạy từ cùng domain với app (localhost:5173)
- Nếu mở trực tiếp file:// có thể bị lỗi CORS
- Tốt nhất là serve file qua dev server

