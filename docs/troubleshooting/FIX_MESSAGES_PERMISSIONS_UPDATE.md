# 🔧 Sửa Lỗi Permissions Khi Gửi Message

## Vấn đề
Lỗi `Missing or insufficient permissions` khi gửi message trong conversations.

## Nguyên nhân
Firestore rules chưa kiểm tra xem user có phải là participant trong conversation hay không trước khi cho phép tạo message.

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**

### Bước 2: Cập nhật Rules cho Messages

Tìm phần `match /conversations/{conversationId}` và cập nhật phần `match /messages/{messageId}` như sau:

```javascript
// ========== CONVERSATIONS COLLECTION ==========
match /conversations/{conversationId} {
  // ... existing rules ...
  
  // ========== MESSAGES SUBCOLLECTION ==========
  match /messages/{messageId} {
    // Cho phép đọc nếu đã đăng nhập và là participant
    allow read: if request.auth != null && 
      request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    
    // Cho phép tạo nếu đã đăng nhập, là người gửi, và là participant
    allow create: if request.auth != null &&
      request.auth.uid == request.resource.data.fromUserId &&
      request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    
    // Cho phép update nếu là người gửi (để edit message)
    allow update: if request.auth != null && 
      request.auth.uid == resource.data.fromUserId;
    
    // Cho phép xóa nếu là người gửi
    allow delete: if request.auth != null && 
      request.auth.uid == resource.data.fromUserId;
  }
}
```

### Bước 3: Publish Rules
1. Click **"Publish"** để lưu rules
2. Đợi vài giây để rules được áp dụng

---

## Các Thay Đổi Đã Thực Hiện

### 1. ✅ Sửa lỗi `indexOf` trong `friends.js`
- Thêm validation cho `userId` trước khi query
- Thêm check `userData` không null
- Đảm bảo `friendRequests` là array

### 2. ✅ Sửa lỗi permissions trong Firestore rules
- Thêm check participant khi đọc messages
- Thêm check participant khi tạo messages
- Đảm bảo chỉ participants mới có thể gửi message

### 3. ✅ Cải thiện error handling
- Thêm check `data.participants` là array trong conversations query
- Thêm check trong fallback query khi composite index chưa có

---

## Kiểm Tra Sau Khi Sửa

1. **Refresh trang** (Ctrl+F5)
2. **Thử gửi message** trong chat
3. **Kiểm tra Console** không còn lỗi permissions
4. **Kiểm tra friend requests** load được không

---

## Lưu Ý

- Rules mới đảm bảo chỉ participants mới có thể gửi/đọc messages
- Nếu vẫn gặp lỗi, kiểm tra xem conversation có field `participants` là array chứa user ID không
- Composite index vẫn cần tạo nếu muốn sort conversations theo `lastMessageTime` (click link trong error để tạo tự động)

