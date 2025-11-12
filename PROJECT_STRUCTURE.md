# 📁 Cấu trúc dự án

## Tổng quan

Dự án đã được tổ chức lại để tách biệt code và documentation.

## Cấu trúc thư mục

```
News/
├── 📄 README.md                    # README chính của dự án
├── 📄 PROJECT_STRUCTURE.md          # File này - giải thích cấu trúc
│
├── 📁 src/                          # Source code chính
│   ├── components/                 # Vue components
│   ├── views/                       # Vue views/pages
│   ├── stores/                      # Pinia stores
│   ├── router/                     # Vue Router
│   ├── config/                     # Config files (Firebase, etc.)
│   └── utils/                      # Utility functions
│
├── 📁 public/                       # Public assets
│   ├── audio/                      # Audio files
│   └── *.png, *.html               # Static files
│
├── 📁 docs/                         # 📚 Tài liệu
│   ├── setup/                      # Hướng dẫn setup
│   ├── deployment/                  # Hướng dẫn deploy
│   ├── troubleshooting/             # Xử lý lỗi
│   └── testing/                     # Hướng dẫn test
│
├── 📁 firestore-rules/              # 🔥 Firestore Security Rules
│   └── *.txt, *.md                 # Các file rules
│
├── 📁 tests/                        # 🧪 Test files
│   └── *.html, *.js                 # Các file test
│
└── 📁 node_modules/                 # Dependencies (tự động tạo)
```

## Chi tiết các thư mục

### 📁 `src/` - Source Code
Chứa toàn bộ source code của ứng dụng:
- Vue components, views, stores
- Router configuration
- Firebase config
- Utility functions

### 📁 `docs/` - Documentation
Chứa tất cả tài liệu hướng dẫn:

#### `docs/setup/` - Setup & Configuration
- Hướng dẫn setup Firebase
- Hướng dẫn cấu hình GitHub Pages
- Giải thích về Firebase data

#### `docs/deployment/` - Deployment
- Hướng dẫn deploy lên GitHub Pages
- Checklist trước khi deploy
- Quick start guide

#### `docs/troubleshooting/` - Troubleshooting
- Tổng hợp các lỗi thường gặp
- Hướng dẫn fix từng loại lỗi
- Fix Firestore rules, Storage CORS, etc.

#### `docs/testing/` - Testing
- Hướng dẫn test
- Test suite guide
- Cách test an toàn

### 📁 `firestore-rules/` - Firestore Rules
Chứa các file Firestore Security Rules:
- Rules đầy đủ
- Rules đơn giản (cho development)
- Rules đã fix các lỗi

### 📁 `tests/` - Test Files
Chứa các file test:
- HTML test files
- JavaScript test files

## File quan trọng ở root

- `README.md` - README chính (giữ lại ở root)
- `package.json` - Dependencies và scripts
- `vite.config.js` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `index.html` - Entry point HTML

## Lợi ích của cấu trúc mới

### ✅ Tổ chức rõ ràng
- Code và documentation tách biệt
- Dễ tìm file cần thiết
- Cấu trúc logic và dễ hiểu

### ✅ Dễ bảo trì
- Dễ cập nhật documentation
- Dễ quản lý Firestore rules
- Dễ quản lý test files

### ✅ Dễ sử dụng
- Mỗi thư mục có README giải thích
- Phân loại rõ ràng theo mục đích
- Dễ tìm hướng dẫn cần thiết

## Cách sử dụng

### Tìm tài liệu
1. **Setup mới?** → `docs/setup/`
2. **Deploy?** → `docs/deployment/`
3. **Gặp lỗi?** → `docs/troubleshooting/`
4. **Cần test?** → `docs/testing/`

### Tìm Firestore Rules
→ `firestore-rules/` - Chọn file rules phù hợp

### Tìm Test Files
→ `tests/` - Các file test HTML/JS

## Lưu ý

- ✅ **README.md** ở root vẫn là file chính
- ✅ Tất cả documentation đã được di chuyển vào `docs/`
- ✅ Firestore rules đã được di chuyển vào `firestore-rules/`
- ✅ Test files đã được di chuyển vào `tests/`
- ✅ Source code vẫn ở `src/` như cũ

## Cập nhật

Cấu trúc này được tạo vào: **2025-11-12**

Nếu có thay đổi về cấu trúc, vui lòng cập nhật file này.

