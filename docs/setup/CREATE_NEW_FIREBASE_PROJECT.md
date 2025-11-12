# 🚀 Tạo Firebase Project Mới

## Bước 1: Tạo Project Mới trong Firebase Console

1. **Vào Firebase Console:**
   - https://console.firebase.google.com/
   - Đăng nhập bằng Google account

2. **Click "Add project" hoặc "Create a project"**

3. **Điền thông tin:**
   - **Project name**: Ví dụ: `vn-social-new` hoặc tên bạn muốn
   - **Google Analytics**: Có thể bật hoặc tắt (tùy chọn)
   - Click **"Continue"**

4. **Chọn Analytics account** (nếu bật Analytics):
   - Chọn account hoặc tạo mới
   - Click **"Create project"**

5. **Đợi project được tạo** (mất vài giây)

---

## Bước 2: Cấu Hình Authentication

1. **Vào Authentication:**
   - Trong Firebase Console, click **"Authentication"** ở menu bên trái
   - Click **"Get started"** (nếu lần đầu)

2. **Bật Sign-in methods:**
   - Click tab **"Sign-in method"**
   - Bật **"Email/Password"**:
     - Click vào "Email/Password"
     - Bật **"Enable"**
     - Click **"Save"**

---

## Bước 3: Tạo Firestore Database

1. **Vào Firestore Database:**
   - Click **"Firestore Database"** ở menu bên trái
   - Click **"Create database"**

2. **Chọn chế độ:**
   - Chọn **"Start in production mode"** (sẽ set rules sau)
   - Hoặc **"Start in test mode"** (cho development, tự động cho phép trong 30 ngày)
   - Click **"Next"**

3. **Chọn location:**
   - Chọn location gần bạn nhất (ví dụ: `asia-southeast1` cho Việt Nam)
   - Click **"Enable"**

4. **Đợi database được tạo** (mất vài phút)

---

## Bước 4: Lấy Firebase Config

1. **Vào Project Settings:**
   - Click icon ⚙️ (Settings) > **"Project settings"**

2. **Scroll xuống phần "Your apps":**
   - Click icon **"</>"** (Web) để thêm web app

3. **Đăng ký app:**
   - **App nickname**: Ví dụ: "VN Social Web"
   - **Firebase Hosting**: Có thể bật hoặc tắt (tùy chọn)
   - Click **"Register app"**

4. **Copy Firebase Config:**
   - Bạn sẽ thấy config như sau:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
   - **Copy toàn bộ config này**

---

## Bước 5: Cập Nhật Config trong Code

1. **Mở file `src/config/firebase.js`**

2. **Thay thế config cũ bằng config mới:**
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_NEW_API_KEY",
     authDomain: "YOUR_NEW_PROJECT.firebaseapp.com",
     projectId: "YOUR_NEW_PROJECT_ID",
     storageBucket: "YOUR_NEW_PROJECT.appspot.com",
     messagingSenderId: "YOUR_NEW_SENDER_ID",
     appId: "YOUR_NEW_APP_ID"
   };
   ```

3. **Lưu file**

---

## Bước 6: Cập Nhật Firestore Rules

1. **Vào Firestore Database > Rules**

2. **Copy rules từ file:**
   - Mở file `firestore-rules/FIRESTORE_RULES_WITH_GROUPS.txt`
   - Copy toàn bộ nội dung

3. **Paste vào Rules editor**

4. **Click "Publish"**

---

## Bước 7: Cấu Hình Firebase Storage (Nếu cần)

1. **Vào Storage:**
   - Click **"Storage"** ở menu bên trái
   - Click **"Get started"**

2. **Chọn chế độ:**
   - Chọn **"Start in production mode"** (sẽ set rules sau)
   - Click **"Next"**

3. **Chọn location:**
   - Chọn location giống Firestore
   - Click **"Done"**

4. **Cập nhật Storage Rules** (nếu cần):
   - Vào **Storage > Rules**
   - Set rules phù hợp

---

## Bước 8: Test

1. **Chạy app:**
   ```bash
   npm run dev
   ```

2. **Test các tính năng:**
   - Đăng ký/Đăng nhập
   - Tạo post
   - Gửi message
   - Kết bạn

3. **Kiểm tra Console:**
   - Mở DevTools (F12)
   - Xem có lỗi không

---

## Lưu Ý

### ⚠️ Dữ Liệu Cũ
- **Dữ liệu từ project cũ sẽ KHÔNG tự động chuyển sang project mới**
- Bạn cần:
  - Export data từ project cũ (nếu cần)
  - Import vào project mới (nếu cần)
  - Hoặc bắt đầu lại từ đầu

### 💰 Free Tier
- Firebase có **Spark Plan (Free)** với giới hạn:
  - Firestore: 50K reads, 20K writes, 20K deletes/day
  - Storage: 5GB storage, 1GB/day downloads
  - Authentication: Unlimited
  - Hosting: 10GB storage, 360MB/day transfers

### 🔒 Security
- **KHÔNG commit** Firebase config vào Git nếu project public
- Sử dụng environment variables nếu cần
- Rules phải được set đúng để bảo vệ data

---

## Troubleshooting

### Lỗi "Firebase: Error (auth/unauthorized-domain)"
- Vào **Authentication > Settings > Authorized domains**
- Thêm domain của bạn (ví dụ: `localhost`, domain production)

### Lỗi "Missing or insufficient permissions"
- Kiểm tra Firestore Rules đã được publish chưa
- Kiểm tra rules có đúng không

### Lỗi "Storage bucket not found"
- Kiểm tra Storage đã được enable chưa
- Kiểm tra config có đúng `storageBucket` không

---

## Next Steps

Sau khi tạo project mới:
1. ✅ Cập nhật config trong code
2. ✅ Set Firestore Rules
3. ✅ Test các tính năng
4. ✅ Migrate data (nếu cần)
5. ✅ Update documentation

