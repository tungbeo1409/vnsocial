# ⚡ Quick Start - Tạo Firebase Project Mới

## 🎯 Mục Tiêu
Tạo Firebase project mới và cấu hình trong 5 phút.

---

## 📋 Checklist

### Bước 1: Tạo Project (2 phút)
- [ ] Vào https://console.firebase.google.com/
- [ ] Click "Add project"
- [ ] Đặt tên project (ví dụ: `vn-social-new`)
- [ ] Bật/tắt Analytics (tùy chọn)
- [ ] Click "Create project"

### Bước 2: Enable Services (1 phút)
- [ ] **Authentication**: 
  - Vào Authentication > Sign-in method
  - Bật "Email/Password"
  
- [ ] **Firestore Database**:
  - Vào Firestore Database
  - Click "Create database"
  - Chọn "Start in test mode" (hoặc production mode)
  - Chọn location (ví dụ: `asia-southeast1`)
  - Click "Enable"

- [ ] **Storage** (nếu cần):
  - Vào Storage
  - Click "Get started"
  - Chọn "Start in test mode"
  - Chọn location
  - Click "Done"

### Bước 3: Lấy Config (1 phút)
- [ ] Vào Project Settings (⚙️ > Project settings)
- [ ] Scroll xuống "Your apps"
- [ ] Click icon `</>` (Web)
- [ ] Đặt tên app: "VN Social Web"
- [ ] Click "Register app"
- [ ] **Copy config** (sẽ hiển thị ngay)

### Bước 4: Cập Nhật Code (1 phút)
- [ ] Mở file `src/config/firebase.js`
- [ ] Thay thế config cũ bằng config mới
- [ ] Lưu file

### Bước 5: Set Rules (1 phút)
- [ ] Vào Firestore Database > Rules
- [ ] Copy nội dung từ `firestore-rules/FIRESTORE_RULES_WITH_GROUPS.txt`
- [ ] Paste vào Rules editor
- [ ] Click "Publish"

---

## 🔧 Cấu Hình Chi Tiết

### Config Template
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",                    // Từ Firebase Console
  authDomain: "xxx.firebaseapp.com",      // Từ Firebase Console
  projectId: "xxx",                       // Từ Firebase Console
  storageBucket: "xxx.appspot.com",       // Từ Firebase Console
  messagingSenderId: "123456789",         // Từ Firebase Console
  appId: "1:123456789:web:abc123",       // Từ Firebase Console
  measurementId: "G-XXXXX"               // Optional (nếu có Analytics)
}
```

### File Cần Sửa
- `src/config/firebase.js` - Thay config mới

---

## ✅ Test Sau Khi Cấu Hình

1. **Chạy app:**
   ```bash
   npm run dev
   ```

2. **Test các tính năng:**
   - ✅ Đăng ký tài khoản mới
   - ✅ Đăng nhập
   - ✅ Tạo post
   - ✅ Gửi message
   - ✅ Kết bạn

3. **Kiểm tra Console:**
   - Mở DevTools (F12)
   - Xem có lỗi không

---

## ⚠️ Lưu Ý Quan Trọng

### Dữ Liệu Cũ
- **Dữ liệu từ project cũ KHÔNG tự động chuyển sang project mới**
- Bạn sẽ bắt đầu với database trống
- Nếu cần data cũ, phải export/import thủ công

### Free Tier Limits
- Firestore: 50K reads, 20K writes, 20K deletes/day
- Storage: 5GB storage, 1GB/day downloads
- Authentication: Unlimited
- Đủ cho development và testing

### Security
- **KHÔNG commit** config vào Git nếu repo public
- Rules phải được set đúng
- Test kỹ trước khi deploy production

---

## 🆘 Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
**Giải pháp:**
- Vào Authentication > Settings > Authorized domains
- Thêm `localhost` và domain của bạn

### "Missing or insufficient permissions"
**Giải pháp:**
- Kiểm tra Rules đã được publish chưa
- Kiểm tra rules có đúng không
- Refresh trang và thử lại

### "Storage bucket not found"
**Giải pháp:**
- Kiểm tra Storage đã được enable chưa
- Kiểm tra config có đúng `storageBucket` không

---

## 📚 Tài Liệu Tham Khảo

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## 🎉 Hoàn Thành!

Sau khi hoàn thành tất cả các bước:
1. ✅ Project mới đã được tạo
2. ✅ Config đã được cập nhật
3. ✅ Rules đã được set
4. ✅ App đã sẵn sàng để test

**Chúc bạn thành công! 🚀**

