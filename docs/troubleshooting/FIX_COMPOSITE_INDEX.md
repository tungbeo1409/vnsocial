# 🔧 Sửa lỗi Composite Index cho Conversations

## Vấn đề
Nếu thấy lỗi "The query requires an index" khi load conversations, cần tạo composite index.

## Giải pháp: Tạo Composite Index

### Cách 1: Tự động (Khuyến nghị)

1. **Khi gặp lỗi, Firebase sẽ hiển thị link:**
   - Click vào link trong error message
   - Firebase sẽ tự động tạo index cho bạn
   - Đợi vài phút để index được tạo

### Cách 2: Thủ công

1. **Vào Firebase Console:**
   - https://console.firebase.google.com/
   - Chọn project: **news-eff0b**
   - Vào **Firestore Database** > **Indexes**

2. **Tạo Composite Index:**
   - Click **"Create Index"**
   - Collection ID: `conversations`
   - Fields:
     - Field 1: `participants` - Array
     - Field 2: `lastMessageTime` - Descending
   - Click **"Create"**

3. **Đợi index được tạo:**
   - Thường mất 1-5 phút
   - Status sẽ chuyển từ "Building" → "Enabled"

---

## Code đã được sửa

Code đã được cập nhật để:
- ✅ Tự động fallback nếu index chưa có
- ✅ Sort manually nếu không có orderBy
- ✅ Handle errors gracefully

Nếu index chưa có, conversations vẫn sẽ load được (chỉ không sort theo thời gian).

---

## Kiểm tra

Sau khi tạo index:
1. Refresh trang Messages
2. Conversations sẽ tự động sort theo tin nhắn mới nhất
3. Không còn lỗi trong Console

---

## Lưu ý

- Index chỉ cần tạo 1 lần
- Sau khi tạo, sẽ hoạt động mãi mãi
- Không tốn phí (trong free tier)

