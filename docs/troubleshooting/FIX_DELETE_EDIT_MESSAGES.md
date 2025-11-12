# 🔧 Sửa lỗi "Missing or insufficient permissions" khi xóa/sửa tin nhắn

## Vấn đề
Khi xóa hoặc sửa tin nhắn, gặp lỗi: "Missing or insufficient permissions"

## Nguyên nhân
Firestore Rules hiện tại không cho phép `update` và `delete` messages:
```javascript
allow update, delete: if false;
```

## Giải pháp: Cập nhật Firestore Rules

### Bước 1: Vào Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**

### Bước 2: Copy Rules mới

**XÓA TẤT CẢ** code cũ và dán code từ file **`FIRESTORE_RULES_WITH_DELETE_EDIT.txt`**:

File này cho phép:
- ✅ **Update message**: Chỉ người gửi mới được sửa tin nhắn của mình
- ✅ **Delete message**: Chỉ người gửi mới được xóa tin nhắn của mình
- ✅ Kiểm tra user phải là participant trong conversation
- ✅ Kiểm tra user phải là người gửi (fromUserId)

### Bước 3: Publish Rules
1. Click nút **"Publish"** ở trên cùng
2. Đợi vài giây để rules được cập nhật

### Bước 4: Test lại
1. Thử xóa một tin nhắn của chính mình
2. Thử sửa một tin nhắn có text của chính mình
3. Kiểm tra console không còn lỗi permissions

## Lưu ý
- Rules này chỉ cho phép người gửi xóa/sửa tin nhắn của chính họ
- Không thể xóa/sửa tin nhắn của người khác
- Phải là participant trong conversation mới được thực hiện thao tác

