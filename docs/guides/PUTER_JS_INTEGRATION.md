# 🚀 Tích Hợp Puter.js - Cloud Storage Miễn Phí, Không Giới Hạn

## 📖 Tổng Quan

**Puter.js** là giải pháp cloud storage **MIỄN PHÍ, KHÔNG GIỚI HẠN** cho developers. Điểm đặc biệt:

- ✅ **Không cần API keys** - Chỉ cần thêm 1 script tag
- ✅ **Không cần backend** - Upload trực tiếp từ browser
- ✅ **Không giới hạn storage** - Unlimited!
- ✅ **User Pays Model** - Người dùng tự trả phí, bạn không lo chi phí
- ✅ **Full file operations** - Read, write, copy, move, delete, etc.
- ✅ **Hỗ trợ binary files** - Images, videos, documents
- ✅ **Có thể get URLs** - Để hiển thị trong web

**Link:** https://developer.puter.com/tutorials/free-unlimited-cloud-storage-api/

---

## 🎯 Tại Sao Puter.js Phù Hợp Với Dự Án?

### **So Sánh Với Các Giải Pháp:**

| Tính năng | Puter.js | Cloudinary | Firebase Storage | Terabox |
|-----------|----------|------------|-----------------|---------|
| **Storage** | ✅ Unlimited | 25GB free | 5GB free | 1TB free |
| **API** | ✅ Có | ✅ Có | ✅ Có | ❌ Không |
| **Setup** | ✅ 1 script tag | ⚠️ Cần config | ⚠️ Cần config | ❌ Không thể |
| **Chi phí dev** | ✅ Free | ✅ Free | ⚠️ Có thể phát sinh | ✅ Free |
| **Chi phí user** | ⚠️ User trả | ✅ Free | ✅ Free | ✅ Free |
| **CDN** | ✅ Có | ✅ Có | ✅ Có | ❌ Không |
| **Auto optimize** | ❌ Không | ✅ Có | ❌ Không | ❌ Không |

### **Ưu Điểm Puter.js:**
1. **Unlimited storage** - Không lo hết dung lượng
2. **Dễ tích hợp** - Chỉ cần 1 dòng code
3. **Không cần backend** - Upload trực tiếp từ browser
4. **Free cho developer** - User tự trả phí

### **Nhược Điểm:**
1. **User phải có tài khoản Puter** - Cần đăng ký/đăng nhập
2. **User trả phí** - Có thể không phù hợp nếu muốn free cho user
3. **Không auto optimize** - Không tự động nén ảnh như Cloudinary

---

## 🚀 Implementation Guide

### **Bước 1: Thêm Puter.js Script**

Thêm vào `index.html` hoặc `main.js`:

```html
<!-- In index.html -->
<script src="https://js.puter.com/v2/"></script>
```

Hoặc trong Vue component:

```javascript
// In main.js or App.vue
if (!window.puter) {
  const script = document.createElement('script')
  script.src = 'https://js.puter.com/v2/'
  document.head.appendChild(script)
}
```

### **Bước 2: Tạo Utility Functions**

Tạo file `src/utils/puterStorage.js`:

```javascript
// src/utils/puterStorage.js

/**
 * Upload file to Puter cloud storage
 * @param {File} file - File to upload
 * @param {string} folder - Folder path (e.g., 'posts', 'messages')
 * @param {string} userId - User ID for organizing files
 * @returns {Promise<{url: string, path: string, filename: string}>}
 */
export const uploadToPuter = async (file, folder = 'uploads', userId = '') => {
  try {
    // Wait for Puter.js to load
    if (!window.puter) {
      await new Promise((resolve) => {
        const checkPuter = setInterval(() => {
          if (window.puter) {
            clearInterval(checkPuter)
            resolve()
          }
        }, 100)
      })
    }

    // Create folder structure: folder/userId/filename
    const timestamp = Date.now()
    const filename = `${timestamp}_${file.name}`
    const filePath = userId 
      ? `${folder}/${userId}/${filename}` 
      : `${folder}/${filename}`

    // Create parent directories if needed
    if (userId) {
      try {
        await window.puter.fs.mkdir(`${folder}/${userId}`, { 
          createMissingParents: true 
        })
      } catch (err) {
        // Directory might already exist, ignore
      }
    }

    // Upload file
    const uploadedFile = await window.puter.fs.write(filePath, file, {
      dedupeName: true // Auto rename if file exists
    })

    // Get readable URL for the file
    const url = await window.puter.fs.getReadURL(filePath)

    return {
      url: url,
      path: uploadedFile.path,
      filename: filename,
      size: file.size,
      type: file.type
    }
  } catch (error) {
    console.error('Error uploading to Puter:', error)
    throw new Error('Không thể tải file lên. Vui lòng thử lại.')
  }
}

/**
 * Upload multiple files to Puter
 * @param {File[]} files - Array of files
 * @param {string} folder - Folder path
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export const uploadMultipleToPuter = async (files, folder = 'uploads', userId = '') => {
  try {
    if (!window.puter) {
      await new Promise((resolve) => {
        const checkPuter = setInterval(() => {
          if (window.puter) {
            clearInterval(checkPuter)
            resolve()
          }
        }, 100)
      })
    }

    const uploadPromises = files.map(file => uploadToPuter(file, folder, userId))
    const results = await Promise.all(uploadPromises)
    
    return results
  } catch (error) {
    console.error('Error uploading multiple files to Puter:', error)
    throw error
  }
}

/**
 * Delete file from Puter
 * @param {string} filePath - Path to file
 */
export const deleteFromPuter = async (filePath) => {
  try {
    if (!window.puter) {
      throw new Error('Puter.js chưa được load')
    }

    await window.puter.fs.delete(filePath)
  } catch (error) {
    console.error('Error deleting from Puter:', error)
    throw error
  }
}

/**
 * Check if Puter.js is available
 */
export const isPuterAvailable = () => {
  return typeof window !== 'undefined' && window.puter !== undefined
}
```

### **Bước 3: Tích Hợp Vào Dự Án**

#### **Option A: Thay Thế Base64 → Puter URLs (Khuyến nghị)**

**Trong `src/components/CreatePost.vue`:**

```javascript
import { uploadToPuter, uploadMultipleToPuter } from '@/utils/puterStorage'

// Thay vì lưu base64, upload lên Puter
const handleSubmit = async () => {
  // ... existing code ...
  
  try {
    let fileData = null
    
    // Upload images to Puter instead of base64
    if (images.value.length > 0) {
      const imageFiles = images.value.map(img => {
        // Convert base64 back to File if needed
        // Or better: keep original File objects
        return img.file // Assuming you store original file
      })
      
      const uploadedImages = await uploadMultipleToPuter(
        imageFiles, 
        'posts', 
        authStore.user.uid
      )
      
      fileData = {
        type: 'images',
        images: uploadedImages.map(img => img.url), // Store URLs instead of base64
        count: uploadedImages.length
      }
    }
    
    // Similar for video/audio...
    
    // Create post with URLs instead of base64
    await postsStore.createPost(/* ... */)
  } catch (error) {
    // Handle error
  }
}
```

#### **Option B: Hybrid Approach**

- **Ảnh nhỏ** (< 500KB) → Base64 trong Firestore (như hiện tại)
- **Ảnh/video lớn** → Upload lên Puter, lưu URL trong Firestore

```javascript
const uploadFile = async (file) => {
  // If file is small, use base64
  if (file.size < 500 * 1024) {
    return { type: 'base64', data: await fileToBase64(file) }
  }
  
  // If file is large, upload to Puter
  const result = await uploadToPuter(file, 'posts', userId)
  return { type: 'url', url: result.url, path: result.path }
}
```

---

## 📝 User Authentication

**Puter.js yêu cầu user đăng nhập vào tài khoản Puter của họ.**

### **Cách hoạt động:**
1. User click upload file
2. Puter.js hiển thị login dialog (nếu chưa đăng nhập)
3. User đăng nhập/đăng ký tài khoản Puter
4. File được upload vào cloud storage của user
5. App nhận được URL để lưu vào Firestore

### **User Experience:**
- Lần đầu upload → User cần đăng nhập Puter
- Các lần sau → Tự động (đã đăng nhập)
- User có thể quản lý files trong Puter dashboard

---

## 🔄 Migration Strategy

### **Từ Base64 → Puter URLs:**

1. **Giữ backward compatibility:**
   - Check nếu data là base64 → hiển thị như cũ
   - Check nếu data là URL → load từ Puter

2. **Gradual migration:**
   - Files mới → Upload lên Puter
   - Files cũ → Giữ base64 (hoặc migrate sau)

3. **Code example:**

```javascript
// In PostCard.vue or ChatMessage.vue
const getImageUrl = (imageData) => {
  // If it's a URL (from Puter)
  if (typeof imageData === 'string' && imageData.startsWith('http')) {
    return imageData
  }
  
  // If it's base64 (old format)
  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    return imageData
  }
  
  return null
}
```

---

## 💡 Best Practices

### **1. Error Handling:**

```javascript
try {
  const result = await uploadToPuter(file, 'posts', userId)
  // Success
} catch (error) {
  if (error.message.includes('authentication')) {
    // User needs to login to Puter
    alert('Vui lòng đăng nhập vào Puter để upload file')
  } else {
    // Other error
    console.error('Upload error:', error)
  }
}
```

### **2. Loading States:**

```javascript
const uploading = ref(false)

const uploadFile = async (file) => {
  uploading.value = true
  try {
    const result = await uploadToPuter(file, 'posts', userId)
    return result
  } finally {
    uploading.value = false
  }
}
```

### **3. File Organization:**

```javascript
// Organize by type and user
const folder = `posts/${userId}/${new Date().getFullYear()}/${new Date().getMonth() + 1}`
```

---

## 🆚 So Sánh Với Cloudinary

### **Khi nào dùng Puter.js:**
- ✅ Cần unlimited storage
- ✅ User sẵn sàng đăng ký tài khoản Puter
- ✅ Không cần auto optimize images
- ✅ Muốn đơn giản, không cần config

### **Khi nào dùng Cloudinary:**
- ✅ Cần auto optimize images
- ✅ Muốn free cho user (không cần đăng ký)
- ✅ Cần video transformation
- ✅ 25GB đủ dùng

---

## 🚀 Quick Start

1. **Thêm script:**
```html
<script src="https://js.puter.com/v2/"></script>
```

2. **Upload file:**
```javascript
const file = event.target.files[0]
const result = await window.puter.fs.write('myfile.jpg', file)
const url = await window.puter.fs.getReadURL('myfile.jpg')
console.log('File URL:', url)
```

3. **Done!** Không cần config gì thêm.

---

## 📚 Resources

- [Puter.js Docs](https://developer.puter.com/)
- [Free Unlimited Cloud Storage API Tutorial](https://developer.puter.com/tutorials/free-unlimited-cloud-storage-api/)
- [Puter.js Playground](https://developer.puter.com/playground)

---

## ⚠️ Lưu Ý

1. **User phải đăng nhập Puter** - Có thể ảnh hưởng UX
2. **User trả phí** - Cần thông báo rõ cho user
3. **Không auto optimize** - Cần compress images trước khi upload
4. **Dependency** - Phụ thuộc vào Puter.js service

---

## 🎯 Kết Luận

**Puter.js là giải pháp tuyệt vời nếu:**
- Bạn cần unlimited storage
- User sẵn sàng đăng ký tài khoản
- Bạn muốn đơn giản, không cần config

**Nếu không, Cloudinary vẫn là lựa chọn tốt hơn** cho hầu hết trường hợp.

