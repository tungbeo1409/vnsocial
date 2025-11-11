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

### 1. Cập nhật base path trong `vite.config.js`

Nếu repository của bạn là `https://github.com/username/News`, thì base path đã được set là `/News/`.

Nếu repository khác, thay đổi:

```javascript
base: '/your-repo-name/'
```

### 2. Deploy

```bash
npm run build
```

Sau đó commit và push thư mục `dist` lên GitHub:

```bash
git add dist
git commit -m "Deploy to GitHub Pages"
git push
```

### 3. Bật GitHub Pages

1. Vào repository trên GitHub
2. Settings > Pages
3. Source: chọn branch `main` và folder `/dist`
4. Save

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

