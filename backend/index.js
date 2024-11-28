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

// Initialize app and Node Cache
const app = express();
const cache = new NodeCache({ stdTTL: 600 });  // Cache expiry set to 600 seconds (10 minutes)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors());
app.use(express.json());
// Configure file upload
const upload = multer({ dest: 'uploads/' });

function encryptFile(filePath, password, callback) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, 'salt', 32); 
    const iv = crypto.randomBytes(16); 

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(filePath + '.enc');

    input.pipe(cipher).pipe(output);

    output.on('finish', () => {
        callback(filePath + '.enc', iv.toString('hex'));
    });
}

// Decrypt file function remains the same
function decryptFile(encryptedPath, password, ivHex, callback) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, 'salt', 32); 
    const iv = Buffer.from(ivHex, 'hex'); 

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const input = fs.createReadStream(encryptedPath);
    const output = fs.createWriteStream(encryptedPath.replace('.enc', ''));

    input.pipe(decipher).pipe(output);

    output.on('finish', () => {
        callback(encryptedPath.replace('.enc', ''));
    });
}

// Home route remains the same
app.get('/', (req, res) => {
    res.send('<h2>Welcome to the File Sharing Service!</h2><form action="/upload" method="POST" enctype="multipart/form-data"><input type="file" name="file"><button type="submit">Upload File</button></form>');
});




app.post('/upload', upload.single('file'), (req, res) => {

    const file = req.file;
    const password = crypto.randomBytes(16).toString('hex'); 
    const downloadCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code


    encryptFile(file.path, password, (encryptedFilePath, iv) => {
        const fileID = crypto.randomBytes(4).toString('hex'); 
        const originalFileName = path.basename(file.originalname); 

        // Store file info, password, IV, and download code in Node Cache
        cache.set(fileID, { path: encryptedFilePath, password, iv, originalFileName, downloadCode });

        // Generate QR code for direct download URL
        const downloadUrl = `http://10.1.42.103:3000/download/${fileID}`;
        QRCode.toDataURL(downloadUrl, (err, qrCodeUrl) => {
            if (err) {
                return res.status(501).send({message:"Error generating code"});
            }
            res.json({
                qrCodeUrl: qrCodeUrl,
                downloadCode: downloadCode
            })
         
        });
    });
});


app.get('/download/:fileID', (req, res) => {
    const fileID = req.params.fileID;

    // Fetch file info from Node Cache
    const fileData = cache.get(fileID);
    if (!fileData) {
        console.log('File not found or expired');
        return res.status(404).send('File link expired or not found');
    }

    // Check if file has already been downloaded
    if (fileData.downloaded) {
        return res.status(400).send('This file has already been downloaded.');
    }

    console.log('File data retrieved:', fileData);

    decryptFile(fileData.path, fileData.password, fileData.iv, (decryptedFilePath) => {
        if (!decryptedFilePath) {
            console.log('File decryption failed');
            return res.status(500).send('Error decrypting file');
        }
        console.log('Decrypted file path:', decryptedFilePath);

        const mimeType = mime.lookup(fileData.originalFileName) || 'application/octet-stream';
        console.log('MIME Type:', mimeType);

        // Set headers using the original file name
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalFileName}"`);

        // Stream file to client
        const fileStream = fs.createReadStream(decryptedFilePath);
        fileStream.pipe(res);

        fileStream.on('end', () => {
            console.log('File successfully downloaded');

            // Mark as downloaded and clean up files
            fileData.downloaded = true;
            cache.set(fileID, fileData);  // Update cache to mark as downloaded
            fs.unlinkSync(decryptedFilePath);
            fs.unlinkSync(fileData.path);
        });

        fileStream.on('error', (err) => {
            console.log('Error streaming file:', err);
            return res.status(500).send('Error streaming file');
        });
    });
});



//download using code
app.post('/download-by-code', (req, res) => {
    const { code } = req.body;

    const fileID = cache.keys().find(key => {
        const fileData = cache.get(key);
        return fileData && fileData.downloadCode === code;
    });

    if (!fileID) {
        return res.status(404).send('Invalid or expired code.');
    }

    const fileData = cache.get(fileID);
    if (fileData.downloaded) {
        return res.status(400).send('This file has already been downloaded.');
    }

    decryptFile(fileData.path, fileData.password, fileData.iv, (decryptedFilePath) => {
        if (!decryptedFilePath) {
            return res.status(500).send('Error decrypting file');
        }

        const mimeType = mime.lookup(fileData.originalFileName) || 'application/octet-stream';
        const fileSize = fs.statSync(decryptedFilePath).size;

        // Set appropriate headers
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.originalFileName)}"`);
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Accept-Ranges', 'bytes');

        // Stream the file in chunks
        const fileStream = fs.createReadStream(decryptedFilePath);
        fileStream.pipe(res);

        fileStream.on('end', () => {
            fileData.downloaded = true;
            cache.set(fileID, fileData);
            fs.unlinkSync(decryptedFilePath);
            fs.unlinkSync(fileData.path);
        });

        fileStream.on('error', (err) => {
            console.error("File streaming error:", err);
            return res.status(500).send('Error streaming file');
        });
    });
});



// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});



