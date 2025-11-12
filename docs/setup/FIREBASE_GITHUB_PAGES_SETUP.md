# 🔥 Cấu hình Firebase cho GitHub Pages

## Bước 1: Thêm GitHub Pages Domain vào Firebase Authorized Domains

### 1.1. Lấy GitHub Pages URL

Sau khi deploy lên GitHub Pages, URL sẽ có dạng:
```
https://YOUR_USERNAME.github.io/News/
```

Domain là: `YOUR_USERNAME.github.io`

### 1.2. Thêm Domain vào Firebase

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project: **news-eff0b**
3. Vào **Authentication** > **Settings** (tab đầu tiên)
4. Scroll xuống phần **"Authorized domains"**
5. Click **"Add domain"**
6. Nhập domain: `YOUR_USERNAME.github.io` (thay YOUR_USERNAME bằng username GitHub của bạn)
7. Click **"Add"**

### 1.3. Kiểm tra Authorized Domains

Đảm bảo có các domains sau:
- ✅ `localhost` (cho development local)
- ✅ `YOUR_USERNAME.github.io` (cho GitHub Pages)
- ✅ `news-eff0b.firebaseapp.com` (domain mặc định của Firebase)
- ✅ `news-eff0b.web.app` (nếu có)

## Bước 2: Kiểm tra Firebase Config

### 2.1. Kiểm tra File Config

File `src/config/firebase.js` đã có config sẵn:

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

Config này sẽ hoạt động cho cả local và GitHub Pages.

### 2.2. Không cần thay đổi Config

Firebase config không cần thay đổi khi deploy lên GitHub Pages. Config này sẽ hoạt động cho mọi domain đã được authorized.

## Bước 3: Kiểm tra Firestore Rules

### 3.1. Kiểm tra Rules

Đảm bảo Firestore rules đã được cấu hình đúng. Xem file `FIRESTORE_RULES_ULTRA_SIMPLE.txt` hoặc `FIX_MARK_AS_READ_PERMISSIONS.md` để cập nhật rules.

### 3.2. Kiểm tra Storage Rules

Đảm bảo Storage rules cho phép upload từ GitHub Pages domain. Rules hiện tại đã cho phép từ mọi domain đã authenticated.

## Bước 4: Test sau khi Deploy

### 4.1. Test Authentication

1. Truy cập: `https://YOUR_USERNAME.github.io/News/`
2. Click **"Đăng ký"** hoặc **"Đăng nhập"**
3. Thử đăng ký/đăng nhập với email/password
4. ✅ Nếu thành công → Firebase Authentication hoạt động

### 4.2. Test Firestore

1. Sau khi đăng nhập, thử đăng bài viết
2. Thử like, comment
3. ✅ Nếu hoạt động → Firestore hoạt động

### 4.3. Test Storage

1. Thử upload ảnh khi đăng bài
2. Thử upload avatar
3. ✅ Nếu hoạt động → Storage hoạt động

### 4.4. Test Messages

1. Thử gửi tin nhắn
2. Thử upload file trong chat
3. ✅ Nếu hoạt động → Messages hoạt động

## Bước 5: Troubleshooting

### Lỗi: "auth/unauthorized-domain"

**Nguyên nhân**: Domain GitHub Pages chưa được thêm vào Authorized domains

**Giải pháp**:
1. Vào Firebase Console > Authentication > Settings > Authorized domains
2. Thêm domain: `YOUR_USERNAME.github.io`
3. Đợi vài phút để Firebase cập nhật
4. Refresh trang GitHub Pages

### Lỗi: "auth/network-request-failed"

**Nguyên nhân**: CORS hoặc network issue

**Giải pháp**:
1. Kiểm tra internet connection
2. Kiểm tra console browser có lỗi CORS không
3. Kiểm tra Firebase rules có đúng không
4. Thử clear browser cache

### Lỗi: "storage/unauthorized"

**Nguyên nhân**: Storage rules chưa cho phép

**Giải pháp**:
1. Vào Firebase Console > Storage > Rules
2. Đảm bảo rules cho phép read/write từ authenticated users
3. Xem file `FIX_STORAGE_CORS.md` để cập nhật rules

### Lỗi: "firestore/permission-denied"

**Nguyên nhân**: Firestore rules chưa cho phép

**Giải pháp**:
1. Vào Firebase Console > Firestore Database > Rules
2. Đảm bảo rules cho phép các operations cần thiết
3. Xem file `FIRESTORE_RULES_ULTRA_SIMPLE.txt` để cập nhật rules

## Lưu ý

- ✅ Firebase config **KHÔNG CẦN** thay đổi khi deploy lên GitHub Pages
- ✅ Chỉ cần thêm domain GitHub Pages vào **Authorized domains**
- ✅ Rules trong Firebase Console áp dụng cho **TẤT CẢ** domains đã authorized
- ✅ Không cần cấu hình CORS riêng cho GitHub Pages

## Kiểm tra nhanh

Sau khi deploy, kiểm tra:

1. ✅ Trang web load được: `https://YOUR_USERNAME.github.io/News/`
2. ✅ Đăng nhập/Đăng ký hoạt động
3. ✅ Đăng bài viết hoạt động
4. ✅ Upload ảnh hoạt động
5. ✅ Gửi tin nhắn hoạt động
6. ✅ Không có lỗi trong browser console

Nếu tất cả đều ✅ → Firebase đã được cấu hình đúng!

