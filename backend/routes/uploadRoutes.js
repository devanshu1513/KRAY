import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file
const router = express.Router();

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup using memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

router.post('/', (req, res, next) => {
    upload.single('image')(req, res, (error) => {
        if (error) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'Choose a product image under 3 MB.'
                : error.message || 'Unable to process that image.';
            return res.status(400).json({ message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Function to handle the stream upload to Cloudinary
        // Converts file buffer to readable stream and uploads to Cloudinary
        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else { 
                        reject(error); 
                    }
                });
                // Use streamifier to create a readable stream from the file buffer
                streamifier.createReadStream(fileBuffer).pipe(stream);
            });
        };
        // Call the stream upload function
        const result = await streamUpload(req.file.buffer);

        // Respond with the URL of the uploaded image
        res.json({ imageUrl: result.secure_url });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
