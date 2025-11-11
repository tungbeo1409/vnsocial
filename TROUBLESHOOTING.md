# Hướng dẫn xử lý lỗi ERR_BLOCKED_BY_CLIENT

## Vấn đề
Lỗi `net::ERR_BLOCKED_BY_CLIENT` khi kết nối đến Firebase Firestore khiến ứng dụng không thể:
- Tải notifications
- Tải messages
- Tải comments, likes
- Các tính năng khác phụ thuộc vào Firestore

## Nguyên nhân
Lỗi này xảy ra khi trình duyệt hoặc extension chặn kết nối đến `firestore.googleapis.com`.

## Giải pháp

### 1. Kiểm tra Ad Blocker và Privacy Extensions
- **uBlock Origin**: Tắt cho trang web này hoặc whitelist `firestore.googleapis.com`
- **AdBlock Plus**: Tắt cho trang web này
- **Privacy Badger**: Cho phép `firestore.googleapis.com`
- **Ghostery**: Cho phép Firebase domains

### 2. Kiểm tra Firewall/Antivirus
- Tắt tạm thời firewall/antivirus để test
- Thêm exception cho `firestore.googleapis.com`

### 3. Kiểm tra Cài đặt Trình duyệt
- **Chrome**: Settings → Privacy and security → Site settings → Additional permissions → Insecure content
- Đảm bảo không block third-party cookies cho Firebase

### 4. Test trong Chế độ Ẩn danh
- Mở trình duyệt ở chế độ ẩn danh (không có extensions)
- Nếu hoạt động → vấn đề là từ extensions

### 5. Whitelist Firebase Domains
Thêm các domains sau vào whitelist:
- `*.firebase.googleapis.com`
- `*.firestore.googleapis.com`
- `*.googleapis.com`
- `*.google.com`

### 6. Kiểm tra Console
- Mở Developer Tools (F12)
- Xem tab Network
- Tìm requests bị block
- Kiểm tra error messages chi tiết

## Test sau khi sửa
1. Refresh trang (Ctrl+F5)
2. Kiểm tra console không còn lỗi `ERR_BLOCKED_BY_CLIENT`
3. Kiểm tra notifications, messages hiển thị đúng
4. Test gửi message, comment, like

## Nếu vẫn không hoạt động
1. Clear browser cache và cookies
2. Restart trình duyệt
3. Thử trình duyệt khác (Chrome, Firefox, Edge)
4. Kiểm tra internet connection
5. Kiểm tra Firestore rules trong Firebase Console

