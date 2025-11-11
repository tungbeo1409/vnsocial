// Utility functions for file handling with Firebase Storage

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/config/firebase'

// Upload file to Firebase Storage
export const uploadFileToStorage = async (file, folder = 'messages', userId) => {
  try {
    // Create unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}_${file.name}`
    const filePath = `${folder}/${userId}/${filename}`
    
    // Create storage reference
    const storageRef = ref(storage, filePath)
    
    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file)
    
    // Wait for upload to complete
    await uploadTask
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef)
    
    return {
      url: downloadURL,
      path: filePath,
      filename: filename,
      size: file.size,
      type: file.type
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error('Không thể tải file lên. Vui lòng thử lại.')
  }
}

// Compress image to Base64 (for preview)
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

// Compress video to Base64 (simplified - just convert, no actual compression)
export const compressVideo = (file, maxSizeMB = 0.7) => {
  return new Promise((resolve, reject) => {
    // Check file size first
    if (file.size > maxSizeMB * 1024 * 1024) {
      reject(new Error(`Video quá lớn! Vui lòng chọn video nhỏ hơn ${maxSizeMB}MB.`))
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    reader.onerror = reject
  })
}

// Convert file to Base64
export const fileToBase64 = (file, maxSizeMB = 10) => {
  return new Promise((resolve, reject) => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      reject(new Error(`File quá lớn! Vui lòng chọn file nhỏ hơn ${maxSizeMB}MB.`))
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    reader.onerror = reject
  })
}

// Get file type from base64 or file
export const getFileType = (fileOrBase64) => {
  if (typeof fileOrBase64 === 'string') {
    // Base64 string
    if (fileOrBase64.startsWith('data:image/')) return 'image'
    if (fileOrBase64.startsWith('data:video/')) return 'video'
    if (fileOrBase64.startsWith('data:audio/')) return 'audio'
    return 'file'
  } else {
    // File object
    if (fileOrBase64.type.startsWith('image/')) return 'image'
    if (fileOrBase64.type.startsWith('video/')) return 'video'
    if (fileOrBase64.type.startsWith('audio/')) return 'audio'
    return 'file'
  }
}

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Get file extension
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase()
}

// Get file icon emoji
export const getFileIcon = (filename, type) => {
  if (type === 'image') return '🖼️'
  if (type === 'video') return '🎥'
  if (type === 'audio') return '🎵'
  
  const ext = getFileExtension(filename)
  const iconMap = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📊',
    pptx: '📊',
    zip: '📦',
    rar: '📦',
    txt: '📄',
    js: '💻',
    html: '🌐',
    css: '🎨'
  }
  return iconMap[ext] || '📎'
}

