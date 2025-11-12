# 🔥 Firestore Rules

Thư mục này chứa các file Firestore Security Rules cho dự án.

## Các file rules

### 📋 Rules đầy đủ
- `FIRESTORE_RULES_COMPLETE_ALL.txt` - Rules đầy đủ cho tất cả collections
- `FIRESTORE_RULES_COMPLETE.txt` - Rules đầy đủ (phiên bản khác)
- `FIRESTORE_RULES_WITH_NOTIFICATIONS.txt` - Rules bao gồm notifications

### 🎯 Rules đơn giản
- `FIRESTORE_RULES_ULTRA_SIMPLE.txt` - Rules cực kỳ đơn giản (khuyến nghị cho development)
- `FIRESTORE_RULES_SIMPLE.txt` - Rules đơn giản
- `FIRESTORE_RULES_SIMPLE_FIX.txt` - Rules đơn giản đã fix

### 🔧 Rules đã fix
- `FIRESTORE_RULES_FIXED.txt` - Rules đã được fix các lỗi
- `FIRESTORE_RULES_DEV.txt` - Rules cho development

### 📝 Rules cho Messages
- `FIRESTORE_RULES_MESSAGES.md` - Rules chi tiết cho messages collection

## Cách sử dụng

1. **Chọn file rules phù hợp** (khuyến nghị: `FIRESTORE_RULES_ULTRA_SIMPLE.txt` cho development)
2. **Copy nội dung** từ file
3. **Vào Firebase Console** → Firestore Database → Rules
4. **Paste nội dung** vào editor
5. **Click "Publish"** để áp dụng

## Lưu ý

- ⚠️ **Luôn test rules trước khi publish** trong production
- ✅ Sử dụng Firebase Rules Playground để test
- 📖 Xem thêm trong `docs/troubleshooting/` nếu gặp lỗi permissions

## Khuyến nghị

- **Development**: Sử dụng `FIRESTORE_RULES_ULTRA_SIMPLE.txt`
- **Production**: Sử dụng `FIRESTORE_RULES_COMPLETE_ALL.txt` hoặc custom rules phù hợp với nhu cầu

