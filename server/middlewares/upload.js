import multer from "multer";

const storage = multer.memoryStorage(); // store in memory before Cloudinary upload
const upload = multer({ storage });

export default upload;
