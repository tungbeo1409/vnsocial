# 🔧 Sửa Lỗi Permission Denied trong Snapshot Listeners

## Vấn đề
Lỗi `permission-denied` trong Firestore snapshot listeners khi query conversations hoặc messages.

## Nguyên nhân
1. Conversation không có field `participants` hoặc `participants` không phải array
2. User không có quyền truy cập conversation (không phải participant)
3. Rules chưa handle trường hợp data không hợp lệ

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**

### Bước 2: Cập nhật Rules

Copy toàn bộ nội dung từ `firestore-rules/FIRESTORE_RULES_WITH_GROUPS.txt` và paste vào Rules editor.

**Các thay đổi quan trọng:**

1. **Conversations read rule** - Thêm check `participants != null`:
```javascript
allow read: if request.auth != null && 
  resource.data.participants != null &&
  request.auth.uid in resource.data.participants;
```

2. **Messages rules** - Thêm helper function để handle trường hợp participants không tồn tại:
```javascript
function getConversationParticipants() {
  let conv = get(/databases/$(database)/documents/conversations/$(conversationId)).data;
  return conv.participants != null ? conv.participants : [];
}

allow read: if request.auth != null && 
  request.auth.uid in getConversationParticipants();
```

### Bước 3: Publish Rules
1. Click **"Publish"** để lưu rules
2. Đợi vài giây để rules được áp dụng

---

## Các Thay Đổi Đã Thực Hiện

### 1. ✅ Cải thiện Firestore Rules
- Thêm check `participants != null` trước khi check membership
- Thêm helper function `getConversationParticipants()` để handle trường hợp participants không tồn tại
- Đảm bảo rules không crash khi data không hợp lệ

### 2. ✅ Cải thiện Error Handling trong Code
- Thêm error handler cho tất cả `onSnapshot` listeners
- Handle `permission-denied` errors gracefully (không crash app)
- Thêm logging để debug
- Skip conversations không hợp lệ thay vì crash

### 3. ✅ Validation trong Code
- Check `participants` là array trước khi xử lý
- Skip conversations không có `participants` hoặc không hợp lệ
- Log warnings cho conversations không hợp lệ

---

## Kiểm Tra Sau Khi Sửa

1. **Refresh trang** (Ctrl+F5)
2. **Kiểm tra Console** - không còn lỗi `permission-denied` uncaught
3. **Kiểm tra conversations** load được không
4. **Thử gửi message** - hoạt động bình thường

---

## Lưu Ý

- Nếu vẫn thấy warnings về permission denied, có thể có conversations cũ trong database không có field `participants`
- Có thể cần cleanup conversations không hợp lệ trong database
- Rules mới sẽ tự động skip conversations không có `participants` thay vì crash

---

## Nếu Vẫn Gặp Lỗi

1. **Kiểm tra Console** để xem conversation nào gây lỗi
2. **Vào Firebase Console** > Firestore > Data
3. **Tìm conversation** có vấn đề
4. **Kiểm tra** xem có field `participants` không
5. **Xóa hoặc sửa** conversation không hợp lệ

