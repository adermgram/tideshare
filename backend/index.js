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
    origin: ['https://tideshare-adermgrams-projects.vercel.app', 'http://localhost:5173'],
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
    },
    preservePath: true
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
            // Check if the request is from a browser
            const isBrowser = req.headers['accept']?.includes('text/html');
            if (isBrowser) {
                return res.status(404).send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>File Not Found</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                                background-color: #f5f5f5;
                            }
                            .error-container {
                                text-align: center;
                                padding: 2rem;
                                background: white;
                                border-radius: 10px;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                max-width: 400px;
                            }
                            h1 {
                                color: #e74c3c;
                                margin-bottom: 1rem;
                            }
                            p {
                                color: #666;
                                margin-bottom: 1.5rem;
                            }
                            .icon {
                                font-size: 48px;
                                margin-bottom: 1rem;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="error-container">
                            <div class="icon">⚠️</div>
                            <h1>File Not Found</h1>
                            <p>This file has either expired or has already been downloaded.</p>
                            <p>Please request a new download link from the sender.</p>
                        </div>
                    </body>
                    </html>
                `);
            }
            throw new AppError('File not found or expired', 404);
        }

        if (fileData.downloaded) {
            // Check if the request is from a browser
            const isBrowser = req.headers['accept']?.includes('text/html');
            if (isBrowser) {
                return res.status(400).send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>File Already Downloaded</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                                background-color: #f5f5f5;
                            }
                            .error-container {
                                text-align: center;
                                padding: 2rem;
                                background: white;
                                border-radius: 10px;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                max-width: 400px;
                            }
                            h1 {
                                color: #e74c3c;
                                margin-bottom: 1rem;
                            }
                            p {
                                color: #666;
                                margin-bottom: 1.5rem;
                            }
                            .icon {
                                font-size: 48px;
                                margin-bottom: 1rem;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="error-container">
                            <div class="icon">⚠️</div>
                            <h1>File Already Downloaded</h1>
                            <p>This file has already been downloaded and is no longer available.</p>
                            <p>Please request a new download link from the sender.</p>
                        </div>
                    </body>
                    </html>
                `);
            }
            throw new AppError('This file has already been downloaded', 400);
        }

        const decryptedFilePath = await FileService.decryptFile(
            fileData.path,
            fileData.password,
            fileData.iv
        );

        // Get the file extension and MIME type
        const fileExtension = path.extname(fileData.originalFileName).toLowerCase();
        const mimeType = mime.lookup(fileExtension) || 'application/octet-stream';
        const fileSize = fs.statSync(decryptedFilePath).size;

        // Set headers
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalFileName}"`);
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        // Stream the file
        const fileStream = fs.createReadStream(decryptedFilePath);
        fileStream.pipe(res);

        fileStream.on('end', async () => {
            fileData.downloaded = true;
            cache.set(fileID, fileData);
            await FileService.cleanupFiles([decryptedFilePath, fileData.path]);
        });

        fileStream.on('error', (err) => {
            console.error('Stream error:', err);
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

        // Get the file extension and MIME type
        const fileExtension = path.extname(fileData.originalFileName).toLowerCase();
        const mimeType = mime.lookup(fileExtension) || 'application/octet-stream';
        const fileSize = fs.statSync(decryptedFilePath).size;

        // Set headers
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalFileName}"`);
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        // Stream the file
        const fileStream = fs.createReadStream(decryptedFilePath);
        fileStream.pipe(res);

        fileStream.on('end', async () => {
            fileData.downloaded = true;
            cache.set(fileID, fileData);
            await FileService.cleanupFiles([decryptedFilePath, fileData.path]);
        });

        fileStream.on('error', (err) => {
            console.error('Stream error:', err);
            next(new AppError('Error streaming file', 500));
        });
    } catch (error) {
        console.error('Download error:', error);
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



