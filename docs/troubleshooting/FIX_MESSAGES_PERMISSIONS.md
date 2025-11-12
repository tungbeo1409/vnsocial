# 🔧 Sửa lỗi "Missing or insufficient permissions" khi gửi tin nhắn

## Vấn đề
Test "Can send a message" failed với lỗi: "Missing or insufficient permissions"

## Nguyên nhân
Firestore Rules chưa cho phép tạo `conversations` và `messages`.

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**

### Bước 2: Copy Rules đầy đủ

**XÓA TẤT CẢ** và dán code từ file **`FIRESTORE_RULES_COMPLETE_ALL.txt`**:

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
      // Chỉ participants mới được đọc
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      // Cho phép tạo nếu user là participant
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.participants;
      
      // Cho phép update nếu user là participant
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      allow delete: if false;
      
      // Messages subcollection
      match /messages/{messageId} {
        // Chỉ participants mới được đọc
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        
        // Chỉ người gửi mới được tạo và phải là participant
        allow create: if request.auth != null && 
          request.auth.uid == request.resource.data.fromUserId &&
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        
        allow update, delete: if false;
      }
    }
  }
}
```

### Bước 3: Publish Rules
Click **"Publish"** và đợi vài giây

### Bước 4: Test lại
1. Vào http://localhost:5173/test-suite
2. Click "▶️ Chạy Tất Cả Tests"
3. Test "Can send a message" sẽ pass

---

## Giải thích Rules

### Conversations Rules:
- **read**: Chỉ participants mới được đọc
- **create**: User phải là participant
- **update**: User phải là participant (để update lastMessage)
- **delete**: Không cho phép

### Messages Rules:
- **read**: Chỉ participants mới được đọc
- **create**: 
  - User phải là người gửi (`fromUserId`)
  - User phải là participant của conversation
- **update/delete**: Không cho phép (messages là immutable)

---

## Nếu vẫn lỗi

1. **Kiểm tra Rules đã publish:**
   - Firebase Console > Firestore > Rules
   - Xem có nút "Publish" không

2. **Kiểm tra syntax:**
   - Rules có highlight đỏ không?
   - Có lỗi syntax không?

3. **Clear cache:**
   - Refresh trang (Ctrl+F5)
   - Đợi vài phút để rules propagate

4. **Kiểm tra conversation được tạo:**
   - Firebase Console > Firestore > Data
   - Xem có collection `conversations` không
   - Xem có document mới được tạo không

---

## Test Checklist

Sau khi cập nhật Rules, tất cả tests nên pass:
- [ ] ✅ Authentication tests (4/4)
- [ ] ✅ Posts tests (5/5)
- [ ] ✅ Friends tests (7/7)
- [ ] ✅ Messages tests (5/5) ← Cần fix

Sau khi fix, tất cả 21 tests sẽ pass! 🎉

