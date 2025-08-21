# Ứng dụng mạng xã hội - Backend API

Đây là mã nguồn cho phần backend của ứng dụng mạng xã hội, được xây dựng trên nền tảng **Node.js**, **Express**, **TypeScript**, và **MongoDB**. API này cung cấp các dịch vụ đa dạng, bao gồm xác thực người dùng, quản lý bài viết, tương tác xã hội và chat real-time.

---

## ✨ Các Tính Năng Chính

- **Xác thực người dùng:** Đăng ký và đăng nhập an toàn với JWT (JSON Web Tokens).
- **Quản lý bài viết:** Cho phép người dùng tạo, xem, chỉnh sửa và xóa bài viết. Hỗ trợ tải ảnh lên **Cloudinary** để lưu trữ.
- **Tương tác xã hội:**
  - **Like/Unlike** bài viết.
  - **Bình luận** trên các bài viết.
  - **Follow/Unfollow** người dùng khác.
- **Chat Real-time:**
  - Nhắn tin 1-1 theo thời gian thực sử dụng **Socket.IO**.
  - Xem lịch sử trò chuyện.
- **Thông báo Real-time:** Gửi thông báo tức thì (khi có like, comment, follow mới) qua **Socket.IO**.
- **Khám phá:**
  - API gợi ý những người dùng tiềm năng để theo dõi.
  - API tìm kiếm người dùng và bài viết.

---

## 🛠️ Công Nghệ Sử Dụng

- **Runtime:** [Node.js](https://nodejs.org/) (v18+)
- **Framework:** [Express.js](https://expressjs.com/)
- **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org/)
- **Cơ sở dữ liệu:** [MongoDB](https://www.mongodb.com/) với [Mongoose](https://mongoosejs.com/)
- **Real-time:** [Socket.IO](https://socket.io/)
- **Lưu trữ ảnh:** [Cloudinary](https://cloudinary.com/)
- **Xác thực:** [JSON Web Token](https://jwt.io/) (`jsonwebtoken`)
- **Mã hóa mật khẩu:** `bcryptjs`
- **Quản lý biến môi trường:** `dotenv`

---

## 🚀 Bắt Đầu

### Yêu Cầu Tiên Quyết

- **Node.js** (phiên bản 18 trở lên)
- **npm** hoặc **yarn**
- Một tài khoản **MongoDB** (có thể sử dụng [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) miễn phí)
- Một tài khoản **Cloudinary** (gói miễn phí là đủ)

### Cài Đặt

1.  **Clone repository:**

    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Cài đặt các dependencies:**

    ```bash
    npm install
    # hoặc
    yarn install
    ```

3.  **Thiết lập biến môi trường:**
    Tạo một file `.env` ở thư mục gốc và điền các thông tin cần thiết. Bạn có thể tham khảo file `.env.example` để biết các biến cần thiết.

    ```env
    # Cổng server
    PORT=5000

    # MongoDB Connection String
    MONGO_URI="your_mongodb_connection_string"

    # JWT Secret Key
    JWT_SECRET="your_super_secret_key_for_jwt"

    # Cloudinary URL
    CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

    # URL của Frontend (cho CORS)
    CLIENT_URL="http://localhost:3000"
    ```

### Chạy Ứng Dụng

- **Chế độ phát triển (Development):** Tự động reload khi có thay đổi.

  ```bash
  npm run dev
  ```

- **Chế độ production:**
  ```bash
  npm run build
  npm start
  ```
  Server sẽ chạy tại `http://localhost:5000`.

---

## 📝 API Documentation

API được thiết kế theo chuẩn **RESTful**. Bạn có thể xem chi tiết các endpoints trong thư mục `src/routes/`.

**Các endpoints chính:**

- `/api/auth`: Đăng ký, đăng nhập.
- `/api/users`: Quản lý thông tin người dùng, follow/unfollow, gợi ý.
- `/api/posts`: Quản lý bài viết, tương tác like, bình luận.
- `/api/chat`: Lấy lịch sử trò chuyện, gửi tin nhắn.
- `/api/notifications`: Quản lý thông báo.

---

## 📂 Cấu Trúc Thư Mục
    /src
    ├── config/ # Cấu hình kết nối cơ sở dữ liệu
    ├── controllers/ # Chứa logic xử lý các request
    ├── middleware/ # Các middlewares (xác thực, xử lý lỗi,...)
    ├── models/ # Các schemas (mô hình dữ liệu) của Mongoose
    ├── routes/ # Định nghĩa các endpoints API
    ├── sockets/ # Xử lý logic Socket.IO
    └── server.ts # Điểm khởi đầu của ứng dụng

