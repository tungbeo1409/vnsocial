# 🔧 Cập nhật Firestore Rules cho tính năng Nhắn tin

## Vấn đề
Tính năng nhắn tin cần cập nhật Firestore Rules để cho phép:
- Tạo và đọc conversations
- Gửi và đọc messages

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**

### Bước 2: Copy Rules mới

**XÓA TẤT CẢ** code cũ và dán code này:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['friendRequests', 'friends', 'sentRequests'])
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
    
    // Conversations collection
    match /conversations/{conversationId} {
      // Chỉ participants mới được đọc conversation
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      // Chỉ participants mới được tạo/update conversation
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.participants;
      
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      // Messages subcollection
      match /messages/{messageId} {
        // Chỉ participants mới được đọc messages
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        
        // Chỉ người gửi mới được tạo message
        allow create: if request.auth != null && 
          request.auth.uid == request.resource.data.fromUserId &&
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        
        // Không cho phép update/delete messages
        allow update, delete: if false;
      }
    }
  }
}
```

### Bước 3: Publish Rules
Click **"Publish"**

---

## ✅ Kiểm tra

Sau khi publish, test các tính năng:
1. ✅ Xem danh sách cuộc trò chuyện
2. ✅ Gửi tin nhắn
3. ✅ Nhận tin nhắn realtime
4. ✅ Xem tin nhắn cũ

---

## 🔒 Rules đơn giản hơn (cho development)

Nếu rules trên phức tạp, có thể dùng rules đơn giản hơn:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && (
        request.auth.uid == userId ||
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
    
    // Conversations - đơn giản hơn
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

**⚠️ LƯU Ý**: Rules đơn giản cho phép mọi user đã đăng nhập đọc/ghi. Chỉ dùng cho development!

