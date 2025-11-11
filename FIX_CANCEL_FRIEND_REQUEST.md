# 🔧 Sửa lỗi "Missing or insufficient permissions" khi hủy lời mời

## Vấn đề
Test cho thấy:
- ✅ Đọc profile: OK
- ✅ Tìm user: OK  
- ✅ Gửi lời mời: OK (đã gửi rồi)
- ❌ **Hủy lời mời: FAILED** - "Missing or insufficient permissions"

## Nguyên nhân
Firestore Rules hiện tại chưa cho phép update `sentRequests` khi hủy lời mời.

Khi hủy lời mời, code cần:
1. Xóa `toUserId` khỏi `sentRequests` của người gửi
2. Xóa `fromUserId` khỏi `friendRequests` của người nhận

Rules hiện tại có thể chưa cho phép case này.

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**

### Bước 2: Copy Rules mới

**XÓA TẤT CẢ** và dán code từ file **`FIRESTORE_RULES_SIMPLE_FIX.txt`**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Cho phép update:
      // - User tự update profile
      // - User update friendRequests, friends, sentRequests
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        // Cho phép update các field liên quan đến friends
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

### Bước 3: Publish Rules
Click **"Publish"** và đợi vài giây

### Bước 4: Test lại
1. Vào http://localhost:5173/test-friends
2. Click "▶️ Chạy Test"
3. Test sẽ tự động hủy lời mời và gửi lại

---

## Giải thích Rules

Rules này cho phép:
- ✅ User tự update profile của mình
- ✅ User update `friendRequests`, `friends`, `sentRequests` của bất kỳ user nào
  - Khi gửi lời mời: Update `sentRequests` của mình + `friendRequests` của người nhận
  - Khi hủy lời mời: Xóa khỏi `sentRequests` của mình + `friendRequests` của người nhận
  - Khi chấp nhận: Update `friends` của cả 2 người

**⚠️ Lưu ý**: Rules này cho phép update friend arrays của user khác. Đủ an toàn cho development, nhưng có thể tối ưu thêm cho production.

---

## Nếu vẫn lỗi

1. **Kiểm tra Rules đã publish chưa:**
   - Firebase Console > Firestore > Rules
   - Xem có nút "Publish" không (nếu có thì chưa publish)

2. **Kiểm tra syntax:**
   - Rules có highlight đỏ không?
   - Có lỗi syntax không?

3. **Clear cache:**
   - Refresh trang (Ctrl+F5)
   - Hoặc đợi vài phút để rules propagate

4. **Kiểm tra Network:**
   - F12 > Network
   - Tìm request đến `firestore.googleapis.com`
   - Xem Status code:
     - `403` → Rules chưa đúng
     - `400` → Data format sai

---

## Test Checklist

Sau khi cập nhật Rules, test lại:
- [ ] ✅ Gửi lời mời kết bạn
- [ ] ✅ Hủy lời mời
- [ ] ✅ Chấp nhận lời mời
- [ ] ✅ Từ chối lời mời
- [ ] ✅ Hủy kết bạn

Nếu tất cả đều OK → Rules đã đúng! 🎉

