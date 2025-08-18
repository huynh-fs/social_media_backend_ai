import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../utils/cloudinary';

// Tạo thư mục uploads tạm thời
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer để lưu file tạm thời
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Wrap multer với Cloudinary upload
const uploadMiddleware = (req: any, res: any, next: any) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: 'File upload error' });
    }

    // Upload to Cloudinary nếu có file
    if (req.file) {
      try {
        console.log('Uploading to Cloudinary...');
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'social-media-posts',
          resource_type: 'auto'
        });

        // Thay thế local path bằng Cloudinary URL
        req.file.cloudinaryUrl = result.secure_url;
        req.file.publicId = result.public_id;

        // Xóa file local sau khi upload lên Cloudinary
        fs.unlinkSync(req.file.path);
        
        console.log('Cloudinary upload success:', result.secure_url);
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        // Nếu Cloudinary lỗi, giữ file local
        req.file.cloudinaryUrl = req.file.path;
      }
    }

    next();
  });
};

export default uploadMiddleware;