# 🔥 Cấu hình Firebase cho vnsocial (GitHub Pages)

## URL GitHub Pages
https://tungbeo1409.github.io/vnsocial/

## Bước 1: Thêm Domain vào Firebase Authorized Domains

### 1.1. Truy cập Firebase Console

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project: **news-eff0b**

### 1.2. Thêm GitHub Pages Domain

1. Vào **Authentication** > **Settings** (tab đầu tiên)
2. Scroll xuống phần **"Authorized domains"**
3. Click **"Add domain"**
4. Nhập domain: `tungbeo1409.github.io`
5. Click **"Add"**

### 1.3. Kiểm tra Authorized Domains

Đảm bảo có các domains sau:
- ✅ `localhost` (cho development local)
- ✅ `tungbeo1409.github.io` (cho GitHub Pages) ⭐ **QUAN TRỌNG**
- ✅ `news-eff0b.firebaseapp.com` (domain mặc định của Firebase)
- ✅ `news-eff0b.web.app` (nếu có)

## Bước 2: Kiểm tra Firebase Config

File `src/config/firebase.js` đã có config đúng, không cần thay đổi:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDVpBBjMCSD-0xRMyUocKD7lS-fFA-a870",
  authDomain: "news-eff0b.firebaseapp.com",
  projectId: "news-eff0b",
  storageBucket: "news-eff0b.firebasestorage.app",
  messagingSenderId: "395035180615",
  appId: "1:395035180615:web:043cdea9835c1d0f2efb62",
  measurementId: "G-QHKR92B7JT"
}
```

Config này sẽ hoạt động cho cả local và GitHub Pages sau khi thêm domain.

## Bước 3: Kiểm tra Firestore Rules

### 3.1. Kiểm tra Rules

Đảm bảo Firestore rules đã được cấu hình đúng. Xem file:
- `FIRESTORE_RULES_ULTRA_SIMPLE.txt`
- `FIX_MARK_AS_READ_PERMISSIONS.md`

### 3.2. Cập nhật Rules (nếu cần)

Vào Firebase Console > Firestore Database > Rules và đảm bảo rules cho phép:
- ✅ Read messages từ authorized users
- ✅ Update message read status từ message recipient
- ✅ Read/write conversations từ participants

## Bước 4: Kiểm tra Storage Rules

### 4.1. Kiểm tra Rules

Vào Firebase Console > Storage > Rules và đảm bảo rules cho phép:
- ✅ Read files từ mọi người
- ✅ Write files từ authenticated users
- ✅ File size limit: 5MB

### 4.2. Rules mẫu

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

## Bước 5: Test sau khi Cấu hình

### 5.1. Test Authentication

1. Truy cập: https://tungbeo1409.github.io/vnsocial/
2. Click **"Đăng ký"** hoặc **"Đăng nhập"**
3. Thử đăng ký/đăng nhập với email/password
4. ✅ Nếu thành công → Firebase Authentication hoạt động

### 5.2. Test Firestore

1. Sau khi đăng nhập, thử đăng bài viết
2. Thử like, comment
3. Thử gửi tin nhắn
4. ✅ Nếu hoạt động → Firestore hoạt động

### 5.3. Test Storage

1. Thử upload ảnh khi đăng bài
2. Thử upload avatar
3. Thử upload file trong chat
4. ✅ Nếu hoạt động → Storage hoạt động

### 5.4. Test Messages

1. Thử gửi tin nhắn
2. Thử upload file trong chat
3. Thử gửi nhiều ảnh
4. ✅ Nếu hoạt động → Messages hoạt động

## Bước 6: Troubleshooting

### Lỗi: "auth/unauthorized-domain"

**Nguyên nhân**: Domain `tungbeo1409.github.io` chưa được thêm vào Authorized domains

**Giải pháp**:
1. Vào Firebase Console > Authentication > Settings > Authorized domains
2. Thêm domain: `tungbeo1409.github.io`
3. Đợi vài phút để Firebase cập nhật (có thể mất 1-5 phút)
4. Refresh trang GitHub Pages
5. Clear browser cache nếu cần

### Lỗi: "firestore/permission-denied"

**Nguyên nhân**: Firestore rules chưa cho phép

**Giải pháp**:
1. Vào Firebase Console > Firestore Database > Rules
2. Đảm bảo rules cho phép các operations cần thiết
3. Xem file `FIX_MARK_AS_READ_PERMISSIONS.md` để cập nhật rules cho messages

### Lỗi: "storage/unauthorized"

**Nguyên nhân**: Storage rules chưa cho phép

**Giải pháp**:
1. Vào Firebase Console > Storage > Rules
2. Đảm bảo rules cho phép read/write từ authenticated users
3. Xem file `FIX_STORAGE_CORS.md` để cập nhật rules

### Lỗi: Routes không hoạt động (404)

**Nguyên nhân**: Base path không đúng

**Giải pháp**:
1. Kiểm tra `vite.config.js` - `REPO_NAME` phải là `/vnsocial/`
2. Rebuild và push lại:
   ```bash
   npm run build
   git add .
   git commit -m "Fix base path"
   git push
   ```
3. Đợi GitHub Actions deploy lại

## Kiểm tra nhanh

Sau khi cấu hình, kiểm tra:

1. ✅ Trang web load được: https://tungbeo1409.github.io/vnsocial/
2. ✅ Đăng nhập/Đăng ký hoạt động
3. ✅ Đăng bài viết hoạt động
4. ✅ Upload ảnh hoạt động
5. ✅ Gửi tin nhắn hoạt động
6. ✅ Không có lỗi trong browser console (F12)

Nếu tất cả đều ✅ → Firebase đã được cấu hình đúng!

## Lưu ý

- ✅ Firebase config **KHÔNG CẦN** thay đổi
- ✅ Chỉ cần thêm domain `tungbeo1409.github.io` vào **Authorized domains**
- ✅ Rules trong Firebase Console áp dụng cho **TẤT CẢ** domains đã authorized
- ✅ Sau khi thêm domain, đợi vài phút để Firebase cập nhật
- ✅ Clear browser cache nếu vẫn gặp lỗi

## Liên kết

- **GitHub Pages**: https://tungbeo1409.github.io/vnsocial/
- **Firebase Console**: https://console.firebase.google.com/project/news-eff0b
- **GitHub Repository**: https://github.com/tungbeo1409/vnsocial

