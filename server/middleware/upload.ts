import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in server/uploads directory
    cb(null, path.join(process.cwd(), 'server', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid-timestamp.ext
    const ext = path.extname(file.originalname);
    const filename = `${randomUUID()}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// File filter - accept only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});
