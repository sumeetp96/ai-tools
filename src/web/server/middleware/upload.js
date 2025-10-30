import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import uploadConfig from "../config/uploads.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (uploadConfig.isAllowed(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"), false);
  }
};

// Size limits
const limits = {
  fileSize: Math.max(...Object.values(uploadConfig.maxFileSizes)),
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

export default upload;
