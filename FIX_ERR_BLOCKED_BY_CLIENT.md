# 🔧 Sửa lỗi ERR_BLOCKED_BY_CLIENT khi kết bạn

## Vấn đề
Lỗi `ERR_BLOCKED_BY_CLIENT` khi gửi lời mời kết bạn hoặc chấp nhận lời mời.

## Nguyên nhân có thể

### 1. Ad Blocker / Browser Extension
Ad blocker có thể chặn requests đến Firebase.

### 2. Firestore Rules chưa đúng
Rules chưa cho phép update friend requests.

## Giải pháp

### Giải pháp 1: Tắt Ad Blocker (Test nhanh)

1. **Tắt ad blocker tạm thời:**
   - uBlock Origin, AdBlock Plus, etc.
   - Hoặc dùng chế độ **Incognito/Private** (thường không có extension)

2. **Test lại:**
   - Thử gửi lời mời kết bạn
   - Nếu hoạt động → Vấn đề là ad blocker

3. **Nếu vẫn lỗi:** Xem Giải pháp 2

---

### Giải pháp 2: Cập nhật Firestore Rules (Quan trọng!)

Firestore Rules hiện tại có thể chưa cho phép update friend requests.

#### Bước 1: Vào Firebase Console
1. https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**

#### Bước 2: Copy Rules mới

**XÓA TẤT CẢ** và dán code này:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Cho phép đọc tất cả user profiles
      allow read: if true;
      
      // Cho phép user tự tạo profile
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Cho phép update:
      // 1. User tự update profile của mình
      // 2. User update friendRequests khi nhận lời mời (thêm/xóa từ array)
      // 3. User update friends và sentRequests
      allow update: if request.auth != null && (
        // User tự update profile
        request.auth.uid == userId ||
        // Cho phép update friendRequests khi có lời mời (người nhận update)
        (request.resource.data.diff(resource.data).affectedKeys().hasAny(['friendRequests', 'friends', 'sentRequests']) &&
         request.resource.data.friendRequests.hasAny([request.auth.uid]))
      );
      
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts collection
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

**HOẶC** dùng rules đơn giản hơn cho development (ít an toàn nhưng dễ test):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      // Cho phép user tự update HOẶC update friend requests
      allow write: if request.auth != null && (
        request.auth.uid == userId ||
        // Cho phép update friendRequests, friends, sentRequests
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['friendRequests', 'friends', 'sentRequests'])
      );
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

#### Bước 3: Publish Rules
Click **"Publish"** và đợi vài giây

---

### Giải pháp 3: Kiểm tra Network Tab

1. Mở **Developer Tools** (F12)
2. Vào tab **Network**
3. Thử gửi lời mời kết bạn
4. Xem request nào bị lỗi:
   - Nếu thấy `ERR_BLOCKED_BY_CLIENT` → Ad blocker
   - Nếu thấy `403 Forbidden` → Firestore Rules
   - Nếu thấy `400 Bad Request` → Data format sai

---

## ✅ Test sau khi fix

1. ✅ Tìm kiếm người dùng
2. ✅ Gửi lời mời kết bạn
3. ✅ Chấp nhận lời mời
4. ✅ Từ chối lời mời
5. ✅ Hủy kết bạn

---

## 🔍 Debug Steps

Nếu vẫn lỗi, kiểm tra:

1. ✅ Firestore Rules đã publish chưa?
2. ✅ Rules có lỗi syntax không? (Firebase sẽ highlight đỏ)
3. ✅ User đã đăng nhập chưa? (`request.auth != null`)
4. ✅ Ad blocker đã tắt chưa?
5. ✅ Thử trên trình duyệt khác

---

## 💡 Tips

- **Development**: Dùng rules đơn giản để test nhanh
- **Production**: Dùng rules an toàn hơn (chỉ cho phép update khi cần)
- **Ad Blocker**: Whitelist domain `firestore.googleapis.com` nếu muốn giữ ad blocker


