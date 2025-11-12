# 🔧 Sửa lỗi "Missing or insufficient permissions" cho Groups

## Vấn đề
Lỗi này xảy ra khi tạo nhóm vì Firestore Security Rules chưa được cấu hình cho `groups` collection.

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Chọn project của bạn: **news-eff0b**

### Bước 2: Vào Firestore Rules
1. Click vào **Firestore Database** (menu bên trái)
2. Click vào tab **Rules** (ở trên cùng)

### Bước 3: Copy và dán Rules mới

**XÓA TẤT CẢ** code cũ và dán code từ file `firestore-rules/FIRESTORE_RULES_WITH_GROUPS.txt`:

Hoặc copy trực tiếp:

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
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['friendRequests', 'friends', 'sentRequests', 'groupInvites'])
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
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      allow delete: if false;
      
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null && 
          request.auth.uid == resource.data.fromUserId;
        allow delete: if request.auth != null && 
          request.auth.uid == resource.data.fromUserId;
      }
    }
    
    // ========== GROUPS COLLECTION ==========
    match /groups/{groupId} {
      // Cho phép đọc nếu đã đăng nhập và là member hoặc được mời
      allow read: if request.auth != null && (
        request.auth.uid in resource.data.members ||
        request.auth.uid in resource.data.pendingInvites
      );
      
      // Cho phép tạo nếu đã đăng nhập
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.createdBy;
      
      // Cho phép update nếu đã đăng nhập và là member
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.members;
      
      // Không cho phép xóa nhóm
      allow delete: if false;
      
      // ========== GROUP MESSAGES SUBCOLLECTION ==========
      match /messages/{messageId} {
        // Cho phép đọc nếu đã đăng nhập và là member
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
        
        // Cho phép tạo nếu đã đăng nhập và là member
        allow create: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
        
        // Cho phép update nếu là người gửi
        allow update: if request.auth != null && 
          request.auth.uid == resource.data.fromUserId;
        
        // Cho phép xóa nếu là người gửi
        allow delete: if request.auth != null && 
          request.auth.uid == resource.data.fromUserId;
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

### Bước 4: Publish Rules
1. Click nút **"Publish"** (màu xanh, ở trên cùng bên phải)
2. Đợi vài giây để rules được áp dụng

## ✅ Kiểm tra

Sau khi publish, refresh lại trang web và thử:
- Tạo nhóm mới
- Chấp nhận lời mời nhóm
- Gửi tin nhắn trong nhóm

## Lưu ý

- Rules này cho phép:
  - Tạo nhóm: Bất kỳ user đã đăng nhập nào
  - Đọc nhóm: Chỉ members và users được mời
  - Update nhóm: Chỉ members (để thêm/xóa members)
  - Gửi tin nhắn trong nhóm: Chỉ members
  - Update groupInvites trong users: Cho phép khi accept/reject invite

- Nếu vẫn lỗi, kiểm tra:
  1. Rules đã được publish chưa?
  2. User đã đăng nhập chưa?
  3. Console có lỗi gì khác không?

