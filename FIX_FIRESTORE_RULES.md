# 🔧 Sửa lỗi "Missing or insufficient permissions"

## Vấn đề
Lỗi này xảy ra vì Firestore Security Rules chưa được cấu hình đúng.

## Giải pháp: Cấu hình Firestore Rules

### Bước 1: Vào Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Chọn project của bạn: **news-eff0b**

### Bước 2: Vào Firestore Rules
1. Click vào **Firestore Database** (menu bên trái)
2. Click vào tab **Rules** (ở trên cùng)

### Bước 3: Copy và dán Rules sau

**XÓA TẤT CẢ** code cũ và dán code này vào:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Cho phép đọc tất cả user profiles
      allow read: if true;
      // Chỉ cho phép user tự sửa profile của mình
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts collection
    match /posts/{postId} {
      // Cho phép đọc tất cả posts
      allow read: if true;
      // Chỉ user đã đăng nhập mới được tạo post
      allow create: if request.auth != null;
      // Chỉ user đã đăng nhập mới được update (like, comment)
      allow update: if request.auth != null;
      // Chỉ chủ post mới được xóa
      allow delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### Bước 4: Publish Rules
1. Click nút **"Publish"** (màu xanh, ở trên cùng bên phải)
2. Đợi vài giây để rules được áp dụng

## ✅ Kiểm tra

Sau khi publish, refresh lại trang web và thử:
- Đăng ký tài khoản mới
- Đăng nhập
- Xem profile

Nếu vẫn lỗi, kiểm tra:
1. Rules đã được publish chưa?
2. Đã copy đúng code chưa?
3. Có lỗi syntax trong Rules không? (Firebase sẽ báo đỏ nếu có)

---

## 🔒 Cấu hình Storage Rules (cho upload ảnh)

Nếu bạn muốn upload ảnh, cũng cần cấu hình Storage Rules:

### Bước 1: Vào Storage Rules
1. Click vào **Storage** (menu bên trái)
2. Click vào tab **Rules**

### Bước 2: Copy và dán Rules sau

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{allPaths=**} {
      // Cho phép đọc tất cả ảnh
      allow read: if true;
      // Chỉ user đã đăng nhập mới được upload (tối đa 5MB)
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

### Bước 3: Publish
Click **"Publish"**

---

## ⚠️ Lưu ý về ERR_BLOCKED_BY_CLIENT

Lỗi `ERR_BLOCKED_BY_CLIENT` thường do:
1. **Ad blocker** (uBlock, AdBlock Plus, ...) - Tắt tạm thời để test
2. **Privacy extensions** - Tắt tạm thời
3. **Browser settings** - Kiểm tra cài đặt bảo mật

**Giải pháp**: Thử trên trình duyệt khác hoặc chế độ Incognito/Private.

---

## 🎯 Test Rules

Sau khi cấu hình xong, test bằng cách:

1. **Đăng ký tài khoản mới** → Nên tạo được user profile
2. **Đăng nhập** → Nên load được profile
3. **Tạo post** → Nên tạo được post
4. **Like post** → Nên like được

Nếu vẫn lỗi, kiểm tra lại Rules và đảm bảo đã **Publish**!

