# 🔧 Sửa lỗi CORS khi upload ảnh lên Firebase Storage

## Vấn đề
Lỗi: `Access to XMLHttpRequest has been blocked by CORS policy` khi upload ảnh.

## Nguyên nhân
1. **Storage Rules chưa được cấu hình đúng**
2. **Storage chưa được bật hoặc setup chưa đúng**
3. **Storage bucket chưa được khởi tạo**

## Giải pháp

### Bước 1: Kiểm tra Storage đã được bật chưa

1. Vào Firebase Console: https://console.firebase.google.com/
2. Chọn project: **news-eff0b**
3. Click vào **Storage** (menu bên trái)
4. Nếu thấy "Get started" → Click và làm theo hướng dẫn:
   - Chọn **"Start in test mode"**
   - Chọn location (ví dụ: `asia-southeast1`)
   - Click **"Done"**

### Bước 2: Cấu hình Storage Rules

1. Vào **Storage** > **Rules**
2. **XÓA TẤT CẢ** code cũ và dán code này:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Cho phép đọc tất cả files
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Chỉ user đã đăng nhập mới được upload
    match /posts/{allPaths=**} {
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

**HOẶC** nếu muốn đơn giản hơn (cho development):

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

3. Click **"Publish"**

### Bước 3: Kiểm tra Storage Bucket URL

Đảm bảo trong `src/config/firebase.js`, `storageBucket` đúng:

```javascript
storageBucket: "news-eff0b.firebasestorage.app"
```

Nếu khác, cập nhật lại.

### Bước 4: Kiểm tra Authorized Domains

1. Vào **Authentication** > **Settings** > **Authorized domains**
2. Đảm bảo có:
   - ✅ `localhost` (cho dev local)
   - ✅ `news-eff0b.firebaseapp.com`
   - ✅ Domain của bạn (nếu deploy)

### Bước 5: Test lại

1. Refresh trang web
2. Đăng nhập
3. Thử upload ảnh

---

## ⚠️ Nếu vẫn lỗi CORS

### Giải pháp 1: Kiểm tra Storage Rules syntax

Đảm bảo không có lỗi syntax. Firebase sẽ highlight màu đỏ nếu có lỗi.

### Giải pháp 2: Thử Rules đơn giản hơn (tạm thời)

Để test, có thể dùng rules đơn giản:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ LƯU Ý**: Rules này cho phép mọi user đã đăng nhập upload/đọc mọi file. Chỉ dùng để test!

### Giải pháp 3: Kiểm tra Browser Console

1. Mở Developer Tools (F12)
2. Vào tab **Network**
3. Thử upload ảnh
4. Xem request nào bị lỗi
5. Kiểm tra Response headers có `Access-Control-Allow-Origin` không

### Giải pháp 4: Tắt Ad Blocker

Một số ad blocker có thể chặn Firebase Storage requests. Thử:
- Tắt ad blocker tạm thời
- Hoặc dùng chế độ Incognito/Private

---

## 🔍 Debug Steps

Nếu vẫn không được, kiểm tra:

1. ✅ Storage đã được bật chưa?
2. ✅ Storage Rules đã được publish chưa?
3. ✅ Rules có lỗi syntax không?
4. ✅ `storageBucket` trong config đúng chưa?
5. ✅ User đã đăng nhập chưa? (`request.auth != null`)
6. ✅ File size < 5MB không?

---

## 📝 Code mẫu để test Storage

Nếu muốn test trực tiếp, có thể thêm vào console:

```javascript
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/config/firebase'

// Test upload
const testUpload = async () => {
  const testFile = new Blob(['test'], { type: 'text/plain' })
  const imageRef = storageRef(storage, 'test/test.txt')
  await uploadBytes(imageRef, testFile)
  const url = await getDownloadURL(imageRef)
  console.log('Upload success:', url)
}
```

---

## ✅ Sau khi fix

Sau khi cấu hình đúng, bạn sẽ có thể:
- ✅ Upload ảnh khi tạo post
- ✅ Xem ảnh đã upload
- ✅ Không còn lỗi CORS

Nếu vẫn lỗi, kiểm tra lại tất cả các bước trên!

