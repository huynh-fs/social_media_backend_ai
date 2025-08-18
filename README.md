# Social Media Backend AI

Backend API cho ứng dụng social media được xây dựng với TypeScript, Node.js, Express và Mongoose.

## Công nghệ sử dụng

- **TypeScript** - Ngôn ngữ lập trình
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **JWT** - Xác thực
- **Multer** - Upload file
- **Cloudinary** - Cloud storage cho images

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd social_media_backend_ai
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `env.example`:
```bash
cp env.example .env
```

4. Cập nhật các biến môi trường trong file `.env`

5. Khởi động MongoDB

6. Chạy ứng dụng:
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký user
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin profile (protected)

### Posts
- `POST /api/posts` - Tạo post mới (protected)
- `GET /api/posts` - Lấy danh sách posts (protected)
- `POST /api/posts/:id/like` - Like/Unlike post (protected)
- `POST /api/posts/:id/comments` - Thêm comment (protected)

## Cấu trúc dự án

```
src/
├── server.ts              # Entry point
├── config/
│   └── db.ts             # MongoDB connection
├── models/                # Mongoose models
│   ├── User.ts
│   ├── Post.ts
│   ├── Comment.ts
│   └── Like.ts
├── routes/                # API routes
│   ├── auth.ts
│   └── posts.ts
├── controllers/           # Route controllers
│   ├── authController.ts
│   └── postController.ts
├── middleware/            # Custom middleware
│   ├── auth.ts
│   └── upload.ts
├── utils/                 # Utility functions
│   ├── cloudinary.ts
│   └── validation.ts
└── @types/                # TypeScript type definitions
    └── express/
        └── index.d.ts
```

## Tính năng

- ✅ User authentication với JWT
- ✅ CRUD operations cho posts
- ✅ Like/Unlike posts
- ✅ Comment system
- ✅ File upload với Multer
- ✅ Cloud storage với Cloudinary
- ✅ TypeScript support
- ✅ MongoDB với Mongoose
- ✅ Input validation
- ✅ Error handling

## License

MIT
