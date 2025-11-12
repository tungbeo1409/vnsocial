# ✅ Bước Tiếp Theo Sau Khi Cập Nhật Config

## 🎉 Config đã được cập nhật!

File `src/config/firebase.js` đã được cập nhật với Firebase project mới:
- **Project ID**: `vnsocial-6412b`

---

## 📋 Checklist Các Bước Tiếp Theo

### 1. ✅ Enable Authentication (BẮT BUỘC)

1. Vào Firebase Console: https://console.firebase.google.com/
2. Chọn project: **vnsocial-6412b**
3. Vào **Authentication** > **Sign-in method**
4. Bật **Email/Password**:
   - Click vào "Email/Password"
   - Bật **"Enable"**
   - Click **"Save"**

### 2. ✅ Tạo Firestore Database (BẮT BUỘC)

1. Vào **Firestore Database**
2. Click **"Create database"**
3. Chọn chế độ:
   - **"Start in test mode"** (cho development - tự động cho phép trong 30 ngày)
   - Hoặc **"Start in production mode"** (sẽ set rules ngay)
4. Chọn location: **asia-southeast1** (gần Việt Nam nhất)
5. Click **"Enable"**
6. Đợi database được tạo (mất vài phút)

### 3. ✅ Set Firestore Rules (BẮT BUỘC)

1. Vào **Firestore Database** > **Rules**
2. Copy toàn bộ nội dung từ file: `firestore-rules/FIRESTORE_RULES_WITH_GROUPS.txt`
3. Paste vào Rules editor
4. Click **"Publish"**

⚠️ **QUAN TRỌNG**: Rules phải được set đúng để app hoạt động!

### 4. ✅ Enable Storage (Nếu cần upload files)

1. Vào **Storage**
2. Click **"Get started"**
3. Chọn chế độ:
   - **"Start in test mode"** (cho development)
   - Hoặc **"Start in production mode"**
4. Chọn location: **asia-southeast1** (giống Firestore)
5. Click **"Done"**

### 5. ✅ Authorize Domain (Nếu cần)

1. Vào **Authentication** > **Settings** > **Authorized domains**
2. Đảm bảo có:
   - `localhost` (cho development)
   - Domain của bạn (nếu có)

---

## 🧪 Test App

Sau khi hoàn thành các bước trên:

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
   - ✅ Tạo nhóm

3. **Kiểm tra Console:**
   - Mở DevTools (F12)
   - Xem có lỗi không
   - Kiểm tra Network tab xem có request đến Firebase không

---

## ⚠️ Lưu Ý

### Database Trống
- Project mới sẽ có **database trống**
- Bạn cần đăng ký tài khoản mới
- Tất cả data cũ từ project `news-eff0b` sẽ KHÔNG có trong project mới

### Free Tier
- Firebase Free tier đủ cho development
- Giới hạn: 50K reads, 20K writes/day
- Nếu vượt quá, cần upgrade plan

### Security
- **KHÔNG commit** config vào Git nếu repo public
- Rules phải được set đúng
- Test kỹ trước khi deploy

---

## 🆘 Troubleshooting

### Lỗi "Firebase: Error (auth/unauthorized-domain)"
**Giải pháp:**
- Vào Authentication > Settings > Authorized domains
- Thêm `localhost`

### Lỗi "Missing or insufficient permissions"
**Giải pháp:**
- Kiểm tra Rules đã được publish chưa
- Kiểm tra rules có đúng không
- Refresh trang và thử lại

### Lỗi "Storage bucket not found"
**Giải pháp:**
- Kiểm tra Storage đã được enable chưa
- Kiểm tra config có đúng `storageBucket` không

### Lỗi "Firestore (9.x.x): Could not reach Cloud Firestore backend"
**Giải pháp:**
- Kiểm tra Firestore Database đã được tạo chưa
- Kiểm tra location đã được chọn chưa
- Đợi vài phút để database được tạo hoàn toàn

---

## ✅ Hoàn Thành!

Sau khi hoàn thành tất cả các bước:
1. ✅ Config đã được cập nhật
2. ✅ Authentication đã được enable
3. ✅ Firestore đã được tạo
4. ✅ Rules đã được set
5. ✅ App đã sẵn sàng để test

**Chúc bạn thành công! 🚀**

