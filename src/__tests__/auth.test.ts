import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from '../routes/auth'; // Import routes cần test
import User from '../models/User';

// Tạo một app Express giả để test
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Bắt đầu nhóm test cho Auth
describe('Auth API Endpoints', () => {

  // Test case cho việc đăng ký
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'password123',
        });
      
      // Kiểm tra status code
      expect(res.statusCode).toEqual(201);
      // Kiểm tra nội dung response
      expect(res.body).toHaveProperty('email', 'testuser@example.com');

      // Kiểm tra xem user có thực sự được tạo trong DB không
      const user = await User.findOne({ username: 'testuser' });
      expect(user).not.toBeNull();
      expect(user?.username).toBe('testuser');
    });

    it('should return 400 if username already exists', async () => {
      // Đầu tiên, tạo một user
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'existinguser', email: 'existinguser@example.com', password: 'password123' });

      // Sau đó, cố gắng đăng ký lại với cùng username
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'existinguser', email: 'existinguser@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'User already exists');
    });
  });

  // Test case cho việc đăng nhập
  describe('POST /api/auth/login', () => {
    // Chạy trước mỗi test trong nhóm này
    beforeEach(async () => {
      // Tạo sẵn một user để test đăng nhập
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'loginuser', email: 'loginuser@example.com', password: 'password123' });
    });

    it('should log in an existing user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('email');
      expect(res.body.email).toBe('loginuser@example.com');
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

});