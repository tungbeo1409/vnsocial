# Hướng dẫn lấy Firebase Config

## Bước 1: Tạo Firebase Project

1. Truy cập: https://console.firebase.google.com/
2. Đăng nhập bằng tài khoản Google
3. Click **"Add project"** (hoặc chọn project có sẵn)
4. Đặt tên project (ví dụ: `social-network`)
5. Chọn **"Continue"** → **"Continue"** → **"Create project"**
6. Đợi Firebase tạo project (khoảng 30 giây)

## Bước 2: Tạo Web App

1. Trong Firebase Console, bạn sẽ thấy trang chủ project
2. Tìm biểu tượng **Web** (`</>`) và click vào
3. Đặt tên app (ví dụ: `Social Network`)
4. **KHÔNG** cần bật Firebase Hosting (bỏ tick)
5. Click **"Register app"**

## Bước 3: Copy Config

Sau khi tạo app, Firebase sẽ hiển thị code config như sau:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

**Copy toàn bộ object này!**

## Bước 4: Dán vào file `src/config/firebase.js`

Mở file `src/config/firebase.js` và thay thế:

```javascript
// ❌ XÓA PHẦN NÀY:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

// ✅ DÁN CONFIG CỦA BẠN VÀO:
const firebaseConfig = {
  apiKey: "AIzaSyC...",  // Config bạn copy từ Firebase
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

## Bước 5: Bật các Services cần thiết

### 5.1. Bật Authentication

1. Vào **Authentication** (menu bên trái)
2. Click **"Get started"**
3. Chọn tab **"Sign-in method"**
4. Bật **"Email/Password"**:
   - Click vào "Email/Password"
   - Bật "Enable"
   - Click "Save"

### 5.2. Tạo Firestore Database

1. Vào **Firestore Database** (menu bên trái)
2. Click **"Create database"**
3. Chọn **"Start in test mode"** (cho development)
4. Chọn location (gần nhất với bạn, ví dụ: `asia-southeast1`)
5. Click **"Enable"**

### 5.3. Bật Storage

1. Vào **Storage** (menu bên trái)
2. Click **"Get started"**
3. Chọn **"Start in test mode"**
4. Chọn location (giống Firestore)
5. Click **"Done"**

## Bước 6: Cấu hình Security Rules

### Firestore Rules

1. Vào **Firestore Database** > **Rules**
2. Thay thế bằng:

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
        resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **"Publish"**

### Storage Rules

1. Vào **Storage** > **Rules**
2. Thay thế bằng:

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

3. Click **"Publish"**

## Nếu không tìm thấy config?

Nếu bạn đã tạo app nhưng không thấy config:

1. Click vào **⚙️ Settings** (biểu tượng bánh răng) > **Project settings**
2. Scroll xuống phần **"Your apps"**
3. Tìm app Web của bạn
4. Click vào app đó
5. Bạn sẽ thấy config trong phần **"SDK setup and configuration"**
6. Copy config từ đây

## Kiểm tra

Sau khi cấu hình xong, chạy:

```bash
npm run dev
```

Nếu không có lỗi, bạn đã cấu hình thành công! 🎉

