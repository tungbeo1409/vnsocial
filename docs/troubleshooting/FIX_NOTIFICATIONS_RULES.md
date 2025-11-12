# 🔔 Cấu hình Firestore Rules cho Notifications

## Vấn đề
Nếu thấy lỗi "Missing or insufficient permissions" khi tạo/xem notifications, cần cập nhật Firestore Rules.

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. Vào https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**

### Bước 2: Thêm Rules cho Notifications

Thêm rules sau vào phần `match /notifications/{notificationId}`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Posts collection
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.uid in resource.data.likes ||
         request.auth.uid in get(/databases/$(database)/documents/posts/$(postId)).data.likes);
    }

    // Conversations collection
    match /conversations/{conversationId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.participants;
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        allow create: if request.auth != null && 
          request.auth.uid == request.resource.data.fromUserId;
      }
    }

    // Notifications collection
    match /notifications/{notificationId} {
      // Users can read their own notifications
      allow read: if request.auth != null && 
        resource.data.toUserId == request.auth.uid;
      
      // Users can create notifications for others (when they like, comment, send message, etc.)
      allow create: if request.auth != null && 
        request.resource.data.toUserId != request.auth.uid;
      
      // Users can update (mark as read) their own notifications
      allow update: if request.auth != null && 
        resource.data.toUserId == request.auth.uid &&
        request.resource.data.toUserId == resource.data.toUserId &&
        request.resource.data.fromUserId == resource.data.fromUserId;
      
      // Users cannot delete notifications (soft delete by marking as read)
      allow delete: if false;
    }
  }
}
```

### Bước 3: Tạo Composite Index (nếu cần)

Nếu thấy lỗi "The query requires an index", click vào link trong error để tạo index tự động, hoặc tạo thủ công:

1. Vào **Firestore Database** > **Indexes**
2. Click **"Create Index"**
3. Collection ID: `notifications`
4. Fields:
   - Field 1: `toUserId` - Ascending
   - Field 2: `createdAt` - Descending
5. Click **"Create"**

---

## Rules đơn giản hơn (cho development)

Nếu muốn test nhanh, có thể dùng rules đơn giản hơn (KHÔNG dùng trong production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Kiểm tra

Sau khi cập nhật rules:
1. Refresh trang app
2. Thử các actions: like, comment, send message, friend request
3. Kiểm tra notifications xuất hiện trong bell icon
4. Xem notifications page: `/notifications`

---

## Lưu ý

- Rules trên cho phép authenticated users tạo notifications cho người khác
- Users chỉ có thể đọc/update notifications của chính họ
- Không cho phép delete (soft delete bằng cách mark as read)
- Cần composite index nếu query với `orderBy('createdAt', 'desc')`

