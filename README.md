# Social Network - Vue.js + TailwindCSS + Firebase

Mạng xã hội đơn giản được xây dựng với Vue.js, TailwindCSS và Firebase (Free Tier).

## Tính năng

- ✅ Đăng ký / Đăng nhập
- ✅ Đăng bài viết với text và ảnh
- ✅ Like / Unlike bài viết
- ✅ Bình luận bài viết
- ✅ Xem profile người dùng
- ✅ Realtime updates (cập nhật theo thời gian thực)
- ✅ Responsive design

## Công nghệ sử dụng

- **Frontend**: Vue.js 3 + Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State Management**: Pinia
- **Routing**: Vue Router

## Cài đặt

### 1. Clone và cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Firebase

1. Tạo project mới tại [Firebase Console](https://console.firebase.google.com/)
2. Bật các services:
   - **Authentication**: Email/Password
   - **Firestore Database**: Tạo database ở chế độ test mode
   - **Storage**: Bật Firebase Storage
3. Lấy Firebase config từ Project Settings > General > Your apps
4. Mở file `src/config/firebase.js` và thay thế config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

### 3. Cấu hình Firestore Security Rules

Vào Firebase Console > Firestore Database > Rules và cập nhật:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.uid == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin);
    }
  }
}
```

### 4. Cấu hình Storage Rules

Vào Firebase Console > Storage > Rules và cập nhật:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

## Chạy ứng dụng

### Development

```bash
npm run dev
```

### Build cho production

```bash
npm run build
```

## Deploy lên GitHub Pages

### Cách 1: Sử dụng GitHub Actions (Khuyến nghị)

Project đã được cấu hình sẵn với GitHub Actions để tự động deploy.

1. **Push code lên GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/News.git
   git push -u origin main
   ```

2. **Bật GitHub Pages**:
   - Vào repository > Settings > Pages
   - Source: chọn **"GitHub Actions"**
   - Save

3. **Cấu hình Firebase**:
   - Vào Firebase Console > Authentication > Settings > Authorized domains
   - Thêm domain: `YOUR_USERNAME.github.io`
   - Xem chi tiết trong file `FIREBASE_GITHUB_PAGES_SETUP.md`

4. **Kiểm tra deployment**:
   - GitHub Actions sẽ tự động build và deploy
   - Truy cập: `https://YOUR_USERNAME.github.io/News/`

### Cách 2: Deploy thủ công

1. **Cập nhật base path** trong `vite.config.js`:
   ```javascript
   const REPO_NAME = '/News/' // Thay đổi thành tên repo của bạn
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   - Push thư mục `dist` lên branch `gh-pages`
   - Hoặc sử dụng GitHub Pages với source là folder `/dist`

### Xem hướng dẫn chi tiết

- **Deploy GitHub Pages**: Xem file `DEPLOY_GITHUB_PAGES.md`
- **Cấu hình Firebase**: Xem file `FIREBASE_GITHUB_PAGES_SETUP.md`

## Cấu trúc thư mục

```
src/
├── components/       # Vue components
│   ├── CreatePost.vue
│   └── PostCard.vue
├── config/          # Firebase config
│   └── firebase.js
├── router/          # Vue Router
│   └── index.js
├── stores/          # Pinia stores
│   ├── auth.js
│   └── posts.js
├── views/           # Page components
│   ├── Home.vue
│   ├── Login.vue
│   ├── Register.vue
│   └── Profile.vue
├── App.vue
├── main.js
└── style.css
```

## Giới hạn Firebase Free Tier

- **Firestore**: 50K reads, 20K writes, 20K deletes/ngày
- **Storage**: 5GB
- **Bandwidth**: 1GB/ngày
- **Cloud Functions**: 2 triệu invocations/tháng

Đủ cho một mạng xã hội nhỏ với vài trăm người dùng.

## License

MIT

