# 🔧 Cập nhật Firestore Rules cho tính năng Kết bạn

## Vấn đề
Tính năng kết bạn cần cập nhật Firestore Rules để cho phép:
- Update friendRequests, sentRequests, friends arrays
- Read user profiles để tìm kiếm

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**

### Bước 2: Copy và dán Rules mới

**XÓA TẤT CẢ** code cũ và dán code này:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Cho phép đọc tất cả user profiles (để tìm kiếm)
      allow read: if true;
      
      // Cho phép user tự tạo profile của mình
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Cho phép user tự update profile của mình
      // HOẶC update friend requests (khi nhận/chấp nhận lời mời)
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        // Cho phép update friendRequests khi nhận lời mời
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['friendRequests']) &&
         request.resource.data.friendRequests.hasAny([request.auth.uid]))
      );
      
      // Cho phép user tự xóa profile của mình
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

**HOẶC** nếu rules trên phức tạp, dùng rules đơn giản hơn (cho development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Cho phép đọc tất cả user profiles
      allow read: if true;
      // Cho phép user tự sửa profile của mình
      // HOẶC bất kỳ user nào update friendRequests (để nhận lời mời)
      allow write: if request.auth != null && (
        request.auth.uid == userId ||
        // Cho phép update friendRequests khi có lời mời
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['friendRequests', 'friends', 'sentRequests']))
      );
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

**⚠️ LƯU Ý**: Rules đơn giản hơn cho phép mọi user đã đăng nhập update friend requests. Chỉ dùng cho development!

### Bước 3: Publish Rules
Click **"Publish"**

---

## ✅ Kiểm tra

Sau khi publish, test các tính năng:
1. ✅ Tìm kiếm người dùng
2. ✅ Gửi lời mời kết bạn
3. ✅ Chấp nhận/từ chối lời mời
4. ✅ Xem danh sách bạn bè
5. ✅ Hủy kết bạn

---

## 🔒 Rules Production (An toàn hơn)

Nếu muốn rules an toàn hơn cho production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      
      allow update: if request.auth != null && (
        // User tự update profile
        (request.auth.uid == userId && 
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['friendRequests', 'sentRequests', 'friends'])) ||
        // User update friendRequests khi nhận lời mời (chỉ thêm vào array)
        (request.resource.data.friendRequests.hasAny([request.auth.uid]) &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['friendRequests']))
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

