# 🔧 Hướng dẫn sửa lỗi "Missing or insufficient permissions" khi kết bạn

## Vấn đề
Khi click "Kết bạn", xuất hiện lỗi:
- ❌ "Missing or insufficient permissions"
- ❌ "ERR_BLOCKED_BY_CLIENT"

## Nguyên nhân
Firestore Rules hiện tại chưa cho phép update `friendRequests`, `friends`, `sentRequests`.

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Đăng nhập
3. Chọn project: **news-eff0b**

### Bước 2: Vào Firestore Rules
1. Click vào **Firestore Database** (menu bên trái)
2. Click vào tab **Rules** (ở trên cùng)

### Bước 3: Copy Rules mới
1. Mở file `FIRESTORE_RULES_FIXED.txt` trong project
2. **Copy toàn bộ** nội dung
3. Vào Firebase Console > Firestore > Rules
4. **XÓA TẤT CẢ** code cũ
5. **Dán** code mới vào

### Bước 4: Publish Rules
1. Click nút **"Publish"** (màu xanh, ở trên cùng bên phải)
2. Đợi vài giây để rules được áp dụng
3. Bạn sẽ thấy thông báo "Rules published successfully"

### Bước 5: Test lại
1. Refresh trang web (F5)
2. Thử tìm kiếm người dùng
3. Click "Kết bạn"
4. Nếu không còn lỗi → ✅ Thành công!

---

## Nếu vẫn lỗi ERR_BLOCKED_BY_CLIENT

Lỗi này thường do **Ad Blocker** chặn requests đến Firebase.

### Cách fix:
1. **Tắt ad blocker tạm thời:**
   - uBlock Origin
   - AdBlock Plus
   - Privacy Badger
   - Các extension chặn quảng cáo khác

2. **Hoặc dùng chế độ Incognito/Private:**
   - Chrome: Ctrl+Shift+N
   - Firefox: Ctrl+Shift+P
   - Edge: Ctrl+Shift+N

3. **Hoặc whitelist domain:**
   - Thêm `firestore.googleapis.com` vào whitelist của ad blocker

---

## Kiểm tra Rules đã đúng chưa

Sau khi publish, rules sẽ trông như thế này:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['friendRequests', 'friends', 'sentRequests'])
      );
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## ✅ Checklist

Sau khi fix, kiểm tra:
- [ ] Rules đã được publish
- [ ] Không có lỗi syntax (Firebase sẽ highlight đỏ nếu có)
- [ ] Ad blocker đã tắt (nếu có)
- [ ] Refresh lại trang web
- [ ] Thử gửi lời mời kết bạn
- [ ] Thử chấp nhận lời mời

---

## 🆘 Vẫn không được?

Nếu vẫn lỗi sau khi làm các bước trên:

1. **Kiểm tra Console:**
   - Mở Developer Tools (F12)
   - Tab Console
   - Xem lỗi chi tiết

2. **Kiểm tra Network:**
   - Tab Network
   - Tìm request đến `firestore.googleapis.com`
   - Xem Status code:
     - `403` → Rules chưa đúng
     - `400` → Data format sai
     - `ERR_BLOCKED_BY_CLIENT` → Ad blocker

3. **Thử trên trình duyệt khác:**
   - Chrome, Firefox, Edge
   - Xem có lỗi tương tự không

---

## 💡 Lưu ý

- Rules này cho phép mọi user đã đăng nhập update friend requests
- Đủ an toàn cho development và testing
- Có thể tối ưu thêm cho production (xem file `UPDATE_FIRESTORE_RULES_FRIENDS.md`)

