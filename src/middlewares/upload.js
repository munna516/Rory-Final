import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("uploads", "admin");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "-");
        const uniqueName = `${Date.now()}-${safeName}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
};

export const uploadAdminProfileImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
});
