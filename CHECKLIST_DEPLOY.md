# ✅ Checklist Deploy GitHub Pages

## Đã hoàn thành
- ✅ Repository đã tạo: `vnsocial`
- ✅ Code đã push lên GitHub
- ✅ GitHub Pages đã bật
- ✅ URL hoạt động: https://tungbeo1409.github.io/vnsocial/
- ✅ vite.config.js đã cập nhật base path: `/vnsocial/`

## Cần làm tiếp

### 1. Cấu hình Firebase Authorized Domains ⭐ QUAN TRỌNG

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project: **news-eff0b**
3. Vào **Authentication** > **Settings** > **Authorized domains**
4. Click **"Add domain"**
5. Thêm: `tungbeo1409.github.io`
6. Click **"Add"**
7. Đợi vài phút để Firebase cập nhật

### 2. Rebuild và Push lại Code

Vì đã thay đổi `vite.config.js`, cần rebuild và push lại:

```bash
# Rebuild
npm run build

# Commit và push
git add .
git commit -m "Update base path to /vnsocial/"
git push
```

GitHub Actions sẽ tự động deploy lại với base path mới.

### 3. Kiểm tra sau khi Deploy

Sau khi GitHub Actions deploy xong, kiểm tra:

1. ✅ Trang web load được: https://tungbeo1409.github.io/vnsocial/
2. ✅ Routes hoạt động (không bị 404 khi navigate)
3. ✅ Đăng nhập/Đăng ký hoạt động (sau khi thêm domain vào Firebase)
4. ✅ Đăng bài viết hoạt động
5. ✅ Upload ảnh hoạt động
6. ✅ Gửi tin nhắn hoạt động
7. ✅ Không có lỗi trong browser console (F12)

### 4. Kiểm tra Firebase Rules

Đảm bảo Firestore và Storage rules đã được cấu hình đúng:

- ✅ Firestore rules cho phép read/write messages
- ✅ Storage rules cho phép upload files
- ✅ Xem file `FIX_MARK_AS_READ_PERMISSIONS.md` để cập nhật rules nếu cần

## Troubleshooting

### Lỗi: "auth/unauthorized-domain"
- ✅ Đã thêm domain `tungbeo1409.github.io` vào Firebase Authorized domains?
- ✅ Đợi vài phút để Firebase cập nhật
- ✅ Clear browser cache

### Lỗi: Routes bị 404
- ✅ Đã rebuild và push lại code với base path mới?
- ✅ Kiểm tra GitHub Actions đã deploy xong chưa
- ✅ Kiểm tra `vite.config.js` có `REPO_NAME = '/vnsocial/'` không

### Lỗi: Firebase không kết nối được
- ✅ Đã thêm domain vào Firebase Authorized domains?
- ✅ Kiểm tra browser console có lỗi gì không
- ✅ Kiểm tra Firebase config trong `src/config/firebase.js`

## Liên kết

- **GitHub Pages**: https://tungbeo1409.github.io/vnsocial/
- **Firebase Console**: https://console.firebase.google.com/project/news-eff0b
- **GitHub Repository**: https://github.com/tungbeo1409/vnsocial
- **GitHub Actions**: https://github.com/tungbeo1409/vnsocial/actions

## Tài liệu tham khảo

- `FIREBASE_SETUP_VNSOCIAL.md` - Hướng dẫn cấu hình Firebase chi tiết
- `DEPLOY_GITHUB_PAGES.md` - Hướng dẫn deploy GitHub Pages
- `FIREBASE_GITHUB_PAGES_SETUP.md` - Hướng dẫn cấu hình Firebase cho GitHub Pages

