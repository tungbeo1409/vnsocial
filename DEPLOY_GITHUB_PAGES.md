# 🚀 Hướng dẫn Deploy lên GitHub Pages

## Bước 1: Tạo GitHub Repository

1. Truy cập https://github.com và đăng nhập
2. Click **"New repository"** (hoặc icon **+** > **New repository**)
3. Đặt tên repository: `News` (hoặc tên khác)
4. Chọn **Public** (GitHub Pages free chỉ hỗ trợ public repos)
5. **KHÔNG** tick "Initialize with README" (nếu đã có code local)
6. Click **"Create repository"**

## Bước 2: Push Code lên GitHub

### 2.1. Khởi tạo Git (nếu chưa có)

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2.2. Thêm Remote và Push

```bash
# Thay YOUR_USERNAME bằng username GitHub của bạn
git remote add origin https://github.com/YOUR_USERNAME/News.git
git branch -M main
git push -u origin main
```

## Bước 3: Cấu hình Vite cho GitHub Pages

File `vite.config.js` đã được cấu hình sẵn với base path `/News/`.

**Nếu repository name khác `News`**, cập nhật trong `vite.config.js`:

```javascript
base: '/your-repo-name/'
```

## Bước 4: Cấu hình GitHub Actions (Tự động Deploy)

### 4.1. Tạo Workflow File

Tạo file `.github/workflows/deploy.yml` (đã có sẵn trong project).

### 4.2. Push Code lên GitHub

```bash
git add .
git commit -m "Add GitHub Actions workflow"
git push
```

### 4.3. Kiểm tra Workflow

1. Vào repository trên GitHub
2. Click tab **"Actions"**
3. Xem workflow đang chạy
4. Đợi workflow hoàn thành (khoảng 1-2 phút)

## Bước 5: Bật GitHub Pages

1. Vào repository trên GitHub
2. Click **Settings** > **Pages**
3. **Source**: chọn **"GitHub Actions"**
4. Save

Sau khi workflow chạy xong, trang web sẽ có tại:
`https://YOUR_USERNAME.github.io/News/`

## Bước 6: Cấu hình Firebase Authorized Domains

### 6.1. Thêm GitHub Pages Domain vào Firebase

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project: **news-eff0b**
3. Vào **Authentication** > **Settings** > **Authorized domains**
4. Click **"Add domain"**
5. Thêm domain: `YOUR_USERNAME.github.io`
6. Click **"Add"**

### 6.2. Kiểm tra Authorized Domains

Đảm bảo có các domains sau:
- ✅ `localhost` (cho dev local)
- ✅ `YOUR_USERNAME.github.io` (cho GitHub Pages)
- ✅ `news-eff0b.firebaseapp.com` (mặc định)

## Bước 7: Kiểm tra Deployment

1. Truy cập: `https://YOUR_USERNAME.github.io/News/`
2. Kiểm tra:
   - ✅ Trang web load được
   - ✅ Đăng nhập/Đăng ký hoạt động
   - ✅ Firebase kết nối được (không có lỗi CORS)
   - ✅ Upload ảnh hoạt động
   - ✅ Gửi tin nhắn hoạt động

## Troubleshooting

### Lỗi 404 khi truy cập GitHub Pages

**Nguyên nhân**: Base path không đúng

**Giải pháp**:
1. Kiểm tra `vite.config.js` - base path phải khớp với repository name
2. Kiểm tra repository name trên GitHub
3. Rebuild và push lại:

```bash
npm run build
git add dist
git commit -m "Fix base path"
git push
```

### Lỗi Firebase Authentication không hoạt động

**Nguyên nhân**: Domain chưa được thêm vào Authorized domains

**Giải pháp**:
1. Vào Firebase Console > Authentication > Settings > Authorized domains
2. Thêm domain: `YOUR_USERNAME.github.io`
3. Đợi vài phút để Firebase cập nhật
4. Refresh trang GitHub Pages

### Lỗi CORS khi upload ảnh

**Nguyên nhân**: Storage rules chưa cho phép domain GitHub Pages

**Giải pháp**:
1. Vào Firebase Console > Storage > Rules
2. Đảm bảo rules cho phép read/write từ mọi domain (đã có sẵn)
3. Kiểm tra Storage bucket URL trong `firebase.js`

### Workflow không chạy

**Nguyên nhân**: File workflow không đúng hoặc chưa được commit

**Giải pháp**:
1. Kiểm tra file `.github/workflows/deploy.yml` có tồn tại không
2. Kiểm tra syntax YAML có đúng không
3. Push lại code:

```bash
git add .github/workflows/deploy.yml
git commit -m "Fix workflow"
git push
```

## Cập nhật Code

Sau khi thay đổi code, chỉ cần:

```bash
git add .
git commit -m "Update code"
git push
```

GitHub Actions sẽ tự động build và deploy lên GitHub Pages.

## Custom Domain (Tùy chọn)

Nếu có custom domain:

1. Vào GitHub repository > Settings > Pages
2. Thêm custom domain
3. Cấu hình DNS records
4. Thêm domain vào Firebase Authorized domains
5. Đợi vài phút để DNS propagate

## Liên kết nhanh

- **GitHub Repository**: `https://github.com/YOUR_USERNAME/News`
- **GitHub Pages**: `https://YOUR_USERNAME.github.io/News/`
- **Firebase Console**: `https://console.firebase.google.com/project/news-eff0b`

