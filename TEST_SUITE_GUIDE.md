# 🧪 Hướng dẫn Test Suite

## Tổng quan

Test Suite tự động kiểm tra tất cả chức năng của ứng dụng:
- ✅ Authentication (Đăng nhập, Profile)
- ✅ Posts (Tạo, Like, Comment, Xóa)
- ✅ Friends (Kết bạn, Hủy, Chấp nhận, Từ chối)
- ✅ Messages (Gửi tin nhắn, Conversations)

## Cách sử dụng

### 1. Mở Test Suite
- Vào: http://localhost:5173/test-suite
- Hoặc click "🧪 Test Suite" trong header

### 2. Chạy Tests

**Chạy tất cả tests:**
- Click "▶️ Chạy Tất Cả Tests"

**Chạy từng category:**
- 🔐 Test Auth - Chỉ test authentication
- 📝 Test Posts - Chỉ test posts
- 👥 Test Friends - Chỉ test friends
- 💬 Test Messages - Chỉ test messages

### 3. Xem kết quả

- **Summary**: Tổng số tests, passed, failed, skipped
- **Test Results**: Chi tiết từng test
- **Log**: Log chi tiết của quá trình test

## Các Tests được chạy

### 🔐 Authentication Tests
1. ✅ User is authenticated
2. ✅ User profile exists in Firestore
3. ✅ User profile has all required fields
4. ✅ Auth store isAuthenticated is true

### 📝 Posts Tests
1. ✅ Can read posts collection
2. ✅ Can create a new post
3. ✅ Can like a post
4. ✅ Can add comment to post
5. ✅ Can delete own post

### 👥 Friends Tests
1. ✅ Can find other users
2. ✅ Can get friendship status
3. ✅ Can send friend request
4. ✅ Can cancel friend request
5. ✅ Can search users
6. ✅ Can load friend requests
7. ✅ Can load friends list

### 💬 Messages Tests
1. ✅ Can find other users for messaging
2. ✅ Can send a message
3. ✅ Can generate conversation ID
4. ✅ Can subscribe to messages
5. ✅ Can subscribe to conversations

## Thêm Tests mới

### Cách thêm test cho chức năng mới

1. **Tạo function test:**
```javascript
async function runNewFeatureTests() {
  addLog('', 'text-gray-500')
  addLog('🆕 NEW FEATURE TESTS', 'text-yellow-400 font-bold')
  addLog('='.repeat(50), 'text-gray-500')
  
  await runTest(async () => {
    // Your test code here
    if (somethingWrong) {
      throw new Error('Test failed reason')
    }
  }, 'newfeature', 'Test name')
}
```

2. **Thêm vào test runner:**
```javascript
if (category === 'newfeature' || category === 'all') {
  await runNewFeatureTests()
}
```

3. **Thêm button trong UI:**
```vue
<button @click="runTestCategory('newfeature')" class="btn-secondary">
  🆕 Test New Feature
</button>
```

4. **Cập nhật helper functions:**
```javascript
function getCategoryIcon(cat) {
  const icons = {
    // ... existing
    newfeature: '🆕'
  }
  return icons[cat] || '📦'
}

function getCategoryName(cat) {
  const names = {
    // ... existing
    newfeature: 'New Feature'
  }
  return names[cat] || cat
}
```

## Test Helper Functions

### `runTest(testFn, category, name)`
Chạy một test và tự động log kết quả.

**Parameters:**
- `testFn`: Async function chứa test logic
- `category`: Category của test ('auth', 'posts', 'friends', 'messages')
- `name`: Tên test để hiển thị

**Example:**
```javascript
await runTest(async () => {
  const result = await someFunction()
  if (!result.success) {
    throw new Error('Test failed')
  }
}, 'friends', 'Can send friend request')
```

### `addLog(message, type)`
Thêm log message.

**Types:**
- `text-gray-300` - Normal
- `text-green-400` - Success
- `text-red-400` - Error
- `text-yellow-400` - Warning
- `text-blue-400` - Info

### `addTestResult(category, name, status, error, duration)`
Thêm kết quả test vào summary.

**Status:**
- `'passed'` - Test passed
- `'failed'` - Test failed
- `'skipped'` - Test skipped

## Best Practices

1. **Mỗi test nên độc lập:**
   - Không phụ thuộc vào thứ tự chạy
   - Có thể chạy riêng lẻ

2. **Test cả success và failure cases:**
   - Test khi thành công
   - Test khi thất bại (invalid input, permissions, etc.)

3. **Clean up sau test:**
   - Xóa dữ liệu test nếu cần
   - Reset state nếu cần

4. **Skip tests khi không thể chạy:**
   ```javascript
   if (condition) {
     addTestResult('category', 'Test name', 'skipped', 'Reason')
     return
   }
   ```

5. **Log rõ ràng:**
   - Log từng bước
   - Log error chi tiết
   - Log thời gian chạy

## Troubleshooting

### Test failed với "Missing or insufficient permissions"
→ Cần cập nhật Firestore Rules

### Test failed với "User not authenticated"
→ Cần đăng nhập trước khi chạy test

### Test skipped
→ Có thể do điều kiện không đủ (ví dụ: không có user khác để test)

### Test chạy quá lâu
→ Có thể do network delay, thêm timeout hoặc retry logic

## Mở rộng

Test Suite được thiết kế để dễ mở rộng:
- Thêm category mới: Chỉ cần thêm vào `testResults` và tạo function test
- Thêm test mới: Chỉ cần gọi `runTest()` với category và name
- Customize UI: Dễ dàng thêm buttons, filters, export results, etc.

## Export Results

Có thể mở rộng để export kết quả:
- Export JSON
- Export CSV
- Gửi report qua email
- Lưu vào database

