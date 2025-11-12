# 🚀 Quick Start - Deploy lên GitHub Pages

## Bước 1: Cập nhật Repository Name

Mở file `vite.config.js` và thay đổi `REPO_NAME`:

```javascript
const REPO_NAME = '/News/' // Thay 'News' thành tên repository của bạn
```

## Bước 2: Push Code lên GitHub

```bash
# Khởi tạo Git (nếu chưa có)
git init
git add .
git commit -m "Initial commit"

# Thêm remote (thay YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/News.git
git branch -M main
git push -u origin main
```

## Bước 3: Bật GitHub Pages

1. Vào repository trên GitHub
2. **Settings** > **Pages**
3. **Source**: chọn **"GitHub Actions"**
4. **Save**

## Bước 4: Cấu hình Firebase

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project: **news-eff0b**
3. **Authentication** > **Settings** > **Authorized domains**
4. Click **"Add domain"**
5. Thêm: `YOUR_USERNAME.github.io`
6. Click **"Add"**

## Bước 5: Chờ Deployment

- GitHub Actions sẽ tự động build và deploy
- Đợi 1-2 phút
- Truy cập: `https://YOUR_USERNAME.github.io/News/`

## ✅ Xong!

Nếu có vấn đề, xem:
- `DEPLOY_GITHUB_PAGES.md` - Hướng dẫn chi tiết
- `FIREBASE_GITHUB_PAGES_SETUP.md` - Cấu hình Firebase

