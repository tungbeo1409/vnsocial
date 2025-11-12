// Utility functions for Puter.js cloud storage
// Documentation: https://developer.puter.com/tutorials/free-unlimited-cloud-storage-api/

/**
 * Wait for Puter.js to load
 * @returns {Promise<void>}
 */
const waitForPuter = async () => {
  if (window.puter) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    let attempts = 0
    const maxAttempts = 50 // 5 seconds max wait

    const checkPuter = setInterval(() => {
      attempts++
      if (window.puter) {
        clearInterval(checkPuter)
        resolve()
      } else if (attempts >= maxAttempts) {
        clearInterval(checkPuter)
        reject(new Error('Puter.js không thể load. Vui lòng kiểm tra kết nối internet.'))
      }
    }, 100)
  })
}

/**
 * Load Puter.js script if not already loaded
 * @returns {Promise<void>}
 */
export const loadPuterScript = async () => {
  if (window.puter) {
    return Promise.resolve()
  }

  // Check if script is already in DOM
  const existingScript = document.querySelector('script[src*="js.puter.com"]')
  if (existingScript) {
    return waitForPuter()
  }

  // Load script
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.puter.com/v2/'
    script.async = true
    script.onload = () => {
      waitForPuter().then(resolve).catch(reject)
    }
    script.onerror = () => {
      reject(new Error('Không thể load Puter.js script'))
    }
    document.head.appendChild(script)
  })
}

/**
 * Upload file to Puter cloud storage
 * @param {File} file - File to upload
 * @param {string} folder - Folder path (e.g., 'posts', 'messages')
 * @param {string} userId - User ID for organizing files
 * @returns {Promise<{url: string, path: string, filename: string, size: number, type: string}>}
 */
export const uploadToPuter = async (file, folder = 'uploads', userId = '') => {
  try {
    // Load Puter.js if not loaded
    await loadPuterScript()

    // Create folder structure: folder/userId/filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const filename = `${timestamp}_${randomId}_${file.name}`
    
    let filePath
    if (userId) {
      filePath = `${folder}/${userId}/${filename}`
      
      // Create parent directories if needed
      try {
        await window.puter.fs.mkdir(`${folder}/${userId}`, { 
          createMissingParents: true 
        })
      } catch (err) {
        // Directory might already exist, ignore
        console.log('Directory might already exist:', err)
      }
    } else {
      filePath = `${folder}/${filename}`
    }

    // Upload file
    const uploadedFile = await window.puter.fs.write(filePath, file, {
      dedupeName: true // Auto rename if file exists
    })

    // Get readable URL for the file
    const url = await window.puter.fs.getReadURL(filePath)

    return {
      url: url,
      path: uploadedFile.path || filePath,
      filename: filename,
      size: file.size,
      type: file.type
    }
  } catch (error) {
    console.error('Error uploading to Puter:', error)
    
    // Check if it's an authentication error
    if (error.message && error.message.includes('auth')) {
      throw new Error('Vui lòng đăng nhập vào Puter để upload file. Puter.js sẽ tự động hiển thị dialog đăng nhập.')
    }
    
    throw new Error('Không thể tải file lên Puter. Vui lòng thử lại.')
  }
}

/**
 * Upload multiple files to Puter
 * @param {File[]} files - Array of files
 * @param {string} folder - Folder path
 * @param {string} userId - User ID
 * @returns {Promise<Array<{url: string, path: string, filename: string}>>}
 */
export const uploadMultipleToPuter = async (files, folder = 'uploads', userId = '') => {
  try {
    await loadPuterScript()

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
 * @returns {Promise<void>}
 */
export const deleteFromPuter = async (filePath) => {
  try {
    await loadPuterScript()
    await window.puter.fs.delete(filePath)
  } catch (error) {
    console.error('Error deleting from Puter:', error)
    throw error
  }
}

/**
 * Check if Puter.js is available
 * @returns {boolean}
 */
export const isPuterAvailable = () => {
  return typeof window !== 'undefined' && window.puter !== undefined
}

/**
 * Get file info from Puter
 * @param {string} filePath - Path to file
 * @returns {Promise<{name: string, size: number, path: string, is_dir: boolean}>}
 */
export const getPuterFileInfo = async (filePath) => {
  try {
    await loadPuterScript()
    const info = await window.puter.fs.stat(filePath)
    return info
  } catch (error) {
    console.error('Error getting file info from Puter:', error)
    throw error
  }
}

/**
 * Read file from Puter
 * @param {string} filePath - Path to file
 * @returns {Promise<Blob>}
 */
export const readFromPuter = async (filePath) => {
  try {
    await loadPuterScript()
    const blob = await window.puter.fs.read(filePath)
    return blob
  } catch (error) {
    console.error('Error reading from Puter:', error)
    throw error
  }
}

