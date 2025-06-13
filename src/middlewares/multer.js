import multer from "multer";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

export const extensionTypes = {
  image: ["image/png", "image/jpg", "image/jpeg", "image/gif"],
  video: ["video/mp4", "video/mkv"],
  audio: ["audio/mp3", "audio/mpeg"],
  file: ["file/pdf", "file/doc", "file/txt"],
};

export const multerLocal = (customValidation = [], customPath = "general") => {
  const fullPath = path.resolve("./src/uploads/", customPath || "general");

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      cb(null, nanoid(4) + file.originalname);
    },
  });

  const fileFilter = (req, file, cb) => {
    customValidation.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Invalid file type"));
  };

  const upload = multer({ storage, fileFilter });

  return upload;
};

export const multerCloud = (customValidation = []) => {
  const storage = multer.diskStorage({});

  // Filter types of file
  const fileFilter = (req, file, cb) => {
    customValidation.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Invalid file type"));
  };

  const upload = multer({ storage, fileFilter });

  return upload;
};
