# 🔧 Sửa Lỗi ERR_BLOCKED_BY_CLIENT và Permission Denied Khi Gửi Message

## Vấn đề

1. **ERR_BLOCKED_BY_CLIENT**: Extension/ad blocker chặn kết nối đến Firebase
2. **Missing or insufficient permissions**: Lỗi permissions khi gửi message

## Nguyên nhân

### ERR_BLOCKED_BY_CLIENT
- **Ad blocker** (uBlock Origin, AdBlock Plus) chặn `firestore.googleapis.com`
- **Privacy extensions** (Privacy Badger, Ghostery) chặn Firebase domains
- **Browser settings** chặn third-party cookies

### Permission Denied
- Firestore rules chưa được cập nhật trong Firebase Console
- Conversation không có `participants` đúng
- Race condition khi tạo conversation mới

## Giải pháp

### 1. Sửa ERR_BLOCKED_BY_CLIENT

#### Cách 1: Tắt Ad Blocker cho trang web này
1. Click vào icon ad blocker (uBlock Origin, AdBlock Plus, etc.)
2. Chọn **"Disable on this site"** hoặc **"Whitelist this site"**

#### Cách 2: Whitelist Firebase Domains
Thêm các domains sau vào whitelist:
- `*.firebase.googleapis.com`
- `*.firestore.googleapis.com`
- `*.googleapis.com`
- `*.google.com`

#### Cách 3: Tắt Privacy Extensions
- **Privacy Badger**: Cho phép `firestore.googleapis.com`
- **Ghostery**: Cho phép Firebase domains

#### Cách 4: Test trong Chế độ Ẩn danh
1. Mở trình duyệt ở chế độ ẩn danh (không có extensions)
2. Nếu hoạt động → vấn đề là từ extensions

### 2. Sửa Permission Denied

#### Bước 1: Cập nhật Firestore Rules

1. Vào Firebase Console: https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Vào **Firestore Database** > **Rules**
4. Copy toàn bộ nội dung từ `firestore-rules/FIRESTORE_RULES_WITH_GROUPS.txt`
5. Paste vào Rules editor
6. Click **"Publish"**

#### Bước 2: Kiểm tra Conversation có Participants

Nếu vẫn gặp lỗi, có thể conversation cũ không có `participants`:

1. Vào Firebase Console > Firestore > Data
2. Tìm conversation có vấn đề
3. Kiểm tra xem có field `participants` không
4. Nếu không có, thêm: `participants: [userId1, userId2]`

#### Bước 3: Clear Cache và Retry

Code đã được cải thiện để:
- Tự động thêm user vào participants nếu thiếu
- Retry khi gặp permission error
- Wait sau khi tạo conversation để đảm bảo được tạo xong

## Code Đã Được Cải Thiện

### 1. ✅ Tự động fix participants
- Check và thêm user vào participants nếu thiếu
- Đảm bảo cả `fromUserId` và `toUserId` đều có trong participants

### 2. ✅ Retry logic
- Tự động retry khi gặp permission error
- Wait sau khi tạo conversation để đảm bảo được tạo xong

### 3. ✅ Error handling
- Handle permission errors gracefully
- Log warnings thay vì crash app

## Kiểm Tra Sau Khi Sửa

1. **Tắt ad blocker** cho trang web này
2. **Cập nhật Firestore rules** trong Firebase Console
3. **Refresh trang** (Ctrl+F5)
4. **Thử gửi message** - hoạt động bình thường
5. **Kiểm tra Console** - không còn lỗi permission denied

## Lưu Ý

- **ERR_BLOCKED_BY_CLIENT** không phải lỗi code, mà do extension chặn
- **Permission denied** có thể do rules chưa được cập nhật
- Code đã tự động fix conversations cũ không có participants
- Nếu vẫn gặp lỗi, kiểm tra xem conversation có field `participants` đúng không

## Nếu Vẫn Gặp Lỗi

1. **Kiểm tra Console** để xem conversation nào gây lỗi
2. **Vào Firebase Console** > Firestore > Data
3. **Tìm conversation** có vấn đề
4. **Kiểm tra** field `participants` có đúng không
5. **Sửa thủ công** nếu cần

