# 🔧 Fix Lỗi 404 trên GitHub Pages

## Vấn đề
- Lỗi 404 khi load `main.js` hoặc các assets
- Trang trắng khi reload các route

## Nguyên nhân
1. Base path không đúng với cách deploy
2. GitHub Actions chưa build lại với config mới
3. Cache trình duyệt

## Giải pháp

### Bước 1: Kiểm tra Base Path

Mở file `vite.config.js` và kiểm tra:

```javascript
const REPO_NAME = '/' // Cho user page (tungbeo1409.github.io)
// hoặc
const REPO_NAME = '/vnsocial/' // Cho project page (tungbeo1409.github.io/vnsocial/)
```

**Quan trọng**: 
- Nếu URL là `tungbeo1409.github.io` → dùng `/`
- Nếu URL là `tungbeo1409.github.io/vnsocial/` → dùng `/vnsocial/`

### Bước 2: Rebuild và Deploy

```bash
# 1. Build local để kiểm tra
npm run build

# 2. Kiểm tra file dist/index.html có đúng không
# Các file assets phải bắt đầu bằng /assets/... (không có base path)

# 3. Commit và push
git add .
git commit -m "Fix base path for GitHub Pages"
git push
```

### Bước 3: Đợi GitHub Actions Build

1. Vào repository trên GitHub
2. Click tab **"Actions"**
3. Đợi workflow **"Deploy to GitHub Pages"** chạy xong (1-2 phút)
4. Kiểm tra có lỗi không

### Bước 4: Clear Cache và Test

1. **Clear cache trình duyệt**:
   - Chrome/Edge: Ctrl+Shift+Delete → Chọn "Cached images and files"
   - Hoặc dùng **Incognito/Private mode**

2. **Hard refresh**:
   - Windows: Ctrl+F5 hoặc Ctrl+Shift+R
   - Mac: Cmd+Shift+R

3. **Test lại**:
   - Truy cập: `https://tungbeo1409.github.io/`
   - Kiểm tra Console (F12) xem còn lỗi không

### Bước 5: Kiểm tra File 404.html

File `public/404.html` sẽ được copy vào `dist/404.html` khi build.

**Kiểm tra**:
- File `dist/404.html` có tồn tại không?
- Base path trong `404.html` có khớp với `vite.config.js` không?

## Troubleshooting

### Lỗi: "Failed to load resource: 404"

**Nguyên nhân**: Assets không tìm thấy

**Giải pháp**:
1. Kiểm tra base path trong `vite.config.js`
2. Rebuild: `npm run build`
3. Kiểm tra `dist/index.html` - các đường dẫn assets phải đúng
4. Push lại và đợi GitHub Actions build

### Lỗi: Trang trắng

**Nguyên nhân**: JavaScript không load được

**Giải pháp**:
1. Kiểm tra Console (F12) xem có lỗi gì
2. Kiểm tra Network tab xem file nào không load được
3. Clear cache và hard refresh
4. Kiểm tra GitHub Actions có build thành công không

### Lỗi: 404 khi reload route

**Nguyên nhân**: GitHub Pages không hỗ trợ client-side routing

**Giải pháp**:
- File `404.html` đã được tạo để redirect về `index.html`
- Đảm bảo `404.html` có trong `dist/` sau khi build
- Đảm bảo base path trong `404.html` khớp với `vite.config.js`

## Kiểm tra nhanh

1. **Build local**:
   ```bash
   npm run build
   ```

2. **Kiểm tra dist/index.html**:
   - Mở file `dist/index.html`
   - Kiểm tra các đường dẫn assets:
     - ✅ Đúng: `/assets/index-xxx.js`
     - ❌ Sai: `/vnsocial/assets/index-xxx.js` (nếu base path là `/`)

3. **Kiểm tra dist/404.html**:
   - File phải tồn tại
   - Base path phải khớp với `vite.config.js`

4. **Push và đợi**:
   ```bash
   git add .
   git commit -m "Fix 404 error"
   git push
   ```
   - Đợi GitHub Actions build xong (1-2 phút)
   - Clear cache và test lại

## Liên hệ

Nếu vẫn gặp vấn đề:
1. Kiểm tra Console (F12) để xem lỗi cụ thể
2. Kiểm tra Network tab để xem file nào không load được
3. Kiểm tra GitHub Actions logs để xem có lỗi build không

