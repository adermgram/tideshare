import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import NodeCache from 'node-cache'
import mime from 'mime-types'
import bodyParser from "body-parser";
import rateLimit from 'express-rate-limit';
import config from './config/config.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { validateFileUpload, validateDownloadCode } from './middleware/validation.js';
import { FileService } from './services/fileService.js';

// Initialize app and Node Cache
const app = express();
const cache = new NodeCache({ stdTTL: config.cache.ttl });

// Middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({
    origin: ['https://tideshare-f3ewc4e2b-adermgrams-projects.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Configure file upload
const upload = multer({
    dest: config.uploads.directory,
    limits: {
        fileSize: config.security.maxFileSize
    }
});

// Ensure uploads directory exists
if (!fs.existsSync(config.uploads.directory)) {
    fs.mkdirSync(config.uploads.directory, { recursive: true });
}

// Home route
app.get('/', (req, res) => {
    res.send('<h2>Welcome to the File Sharing Service!</h2><form action="/upload" method="POST" enctype="multipart/form-data"><input type="file" name="file"><button type="submit">Upload File</button></form>');
});

app.post('/upload', upload.single('file'), validateFileUpload, async (req, res, next) => {
    try {
        const file = req.file;
        const password = crypto.randomBytes(16).toString('hex');
        const downloadCode = FileService.generateDownloadCode();
        const fileID = FileService.generateFileId();

        const { encryptedPath, iv } = await FileService.encryptFile(file.path, password);
        const originalFileName = path.basename(file.originalname);

        // Store file info in cache
        cache.set(fileID, {
            path: encryptedPath,
            password,
            iv,
            originalFileName,
            downloadCode,
            downloaded: false
        });

        // Generate QR code
        const downloadUrl = `${req.protocol}://${req.get('host')}/download/${fileID}`;
        const qrCodeUrl = await QRCode.toDataURL(downloadUrl);

        res.json({
            qrCodeUrl,
            downloadCode
        });
    } catch (error) {
        next(error);
    }
});

app.get('/download/:fileID', async (req, res, next) => {
    try {
        const fileID = req.params.fileID;
        const fileData = cache.get(fileID);

        if (!fileData) {
            throw new AppError('File not found or expired', 404);
        }

        if (fileData.downloaded) {
            throw new AppError('This file has already been downloaded', 400);
        }

        const decryptedFilePath = await FileService.decryptFile(
            fileData.path,
            fileData.password,
            fileData.iv
        );

        const mimeType = mime.lookup(fileData.originalFileName) || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalFileName}"`);

        const fileStream = fs.createReadStream(decryptedFilePath);
        fileStream.pipe(res);

        fileStream.on('end', async () => {
            fileData.downloaded = true;
            cache.set(fileID, fileData);
            await FileService.cleanupFiles([decryptedFilePath, fileData.path]);
        });

        fileStream.on('error', (err) => {
            next(new AppError('Error streaming file', 500));
        });
    } catch (error) {
        next(error);
    }
});

app.post('/download-by-code', validateDownloadCode, async (req, res, next) => {
    try {
        const { code } = req.body;
        const fileID = cache.keys().find(key => {
            const fileData = cache.get(key);
            return fileData && fileData.downloadCode === code;
        });

        if (!fileID) {
            throw new AppError('Invalid or expired code', 404);
        }

        const fileData = cache.get(fileID);
        if (fileData.downloaded) {
            throw new AppError('This file has already been downloaded', 400);
        }

        const decryptedFilePath = await FileService.decryptFile(
            fileData.path,
            fileData.password,
            fileData.iv
        );

        const mimeType = mime.lookup(fileData.originalFileName) || 'application/octet-stream';
        const fileSize = fs.statSync(decryptedFilePath).size;

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.originalFileName)}"`);
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Accept-Ranges', 'bytes');

        const fileStream = fs.createReadStream(decryptedFilePath);
        fileStream.pipe(res);

        fileStream.on('end', async () => {
            fileData.downloaded = true;
            cache.set(fileID, fileData);
            await FileService.cleanupFiles([decryptedFilePath, fileData.path]);
        });

        fileStream.on('error', (err) => {
            next(new AppError('Error streaming file', 500));
        });
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const PORT = config.server.port;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



