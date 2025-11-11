# 🔧 Sửa lỗi Mark as Read - Missing or insufficient permissions

## Vấn đề
Khi mở chat trong web, có lỗi: "Error marking as read: Missing or insufficient permissions"

## Nguyên nhân
Firestore security rules hiện tại không cho phép update messages, nhưng chức năng mark as read cần update field `read` của message.

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**

### Bước 2: Cập nhật Rules

**Tìm phần messages subcollection và thay đổi rule update:**

**TỪ:**
```javascript
match /messages/{messageId} {
  // Cho phép đọc nếu đã đăng nhập
  allow read: if request.auth != null;
  
  // Cho phép tạo nếu đã đăng nhập
  allow create: if request.auth != null;
  
  // Không cho phép update/delete
  allow update, delete: if false;
}
```

**THÀNH:**
```javascript
match /messages/{messageId} {
  // Cho phép đọc nếu đã đăng nhập
  allow read: if request.auth != null;
  
  // Cho phép tạo nếu đã đăng nhập
  allow create: if request.auth != null;
  
  // Cho phép update field 'read' nếu user là người nhận (toUserId)
  allow update: if request.auth != null && 
    request.auth.uid == resource.data.toUserId &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
  
  // Không cho phép delete
  allow delete: if false;
}
```

### Bước 3: Lưu Rules

Click **Publish** để lưu rules mới.

## Rules hoàn chỉnh (tham khảo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ========== USERS COLLECTION ==========
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['friendRequests', 'friends', 'sentRequests'])
      );
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // ========== POSTS COLLECTION ==========
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // ========== CONVERSATIONS COLLECTION ==========
    match /conversations/{conversationId} {
      // Cho phép đọc nếu đã đăng nhập
      allow read: if request.auth != null;
      
      // Cho phép tạo nếu đã đăng nhập
      allow create: if request.auth != null;
      
      // Cho phép update nếu đã đăng nhập
      allow update: if request.auth != null;
      
      // Không cho phép xóa
      allow delete: if false;
      
      // ========== MESSAGES SUBCOLLECTION ==========
      match /messages/{messageId} {
        // Cho phép đọc nếu đã đăng nhập
        allow read: if request.auth != null;
        
        // Cho phép tạo nếu đã đăng nhập
        allow create: if request.auth != null;
        
        // Cho phép update field 'read' nếu user là người nhận (toUserId)
        allow update: if request.auth != null && 
          request.auth.uid == resource.data.toUserId &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
        
        // Không cho phép delete
        allow delete: if false;
      }
    }
    
    // ========== NOTIFICATIONS COLLECTION ==========
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.toUserId;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.toUserId;
      allow delete: if false;
    }
  }
}
```

## Kiểm tra

Sau khi cập nhật rules:
1. Refresh trang web chat
2. Mở một cuộc trò chuyện
3. Không còn lỗi "Missing or insufficient permissions"
4. Messages sẽ được mark as read khi scroll đến cuối

