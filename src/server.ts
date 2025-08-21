import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";

// Import routes
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import userRoutes from "./routes/userRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import chatRoutes from "./routes/chatRoutes"; // ✨ Import chat routes
import swaggerUi from "swagger-ui-express"; // ✨ Import swagger-ui
import swaggerSpec from "./config/swagger"; // ✨ Import file cấu hình

// Import socket logic
import { initializeSocketIO } from "./sockets/socketHandlers"; // ✨ Import socket handler

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Thiết lập Socket.IO Server
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Nên dùng biến môi trường
    methods: ["GET", "POST"],
  },
});

// Khởi tạo toàn bộ logic Socket.IO từ file riêng
initializeSocketIO(io);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Cấu hình cors chi tiết hơn nếu cần
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Route này nên được đặt trước các route API chính
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes); // ✨ Sử dụng chat routes

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// 404 handler - nên đặt trước error handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
      message: err.message || "Something went wrong!",
      stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
    });
  }
);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
