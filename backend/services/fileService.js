import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';
import { AppError } from '../middleware/errorHandler.js';
import config from '../config/config.js';

export class FileService {
    static async encryptFile(filePath, password) {
        try {
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(password, config.security.encryptionSalt, 32);
            const iv = crypto.randomBytes(16);

            const cipher = crypto.createCipheriv(algorithm, key, iv);
            const input = fs.createReadStream(filePath, { encoding: null });
            const output = fs.createWriteStream(filePath + '.enc', { encoding: null });

            await pipeline(input, cipher, output);

            return {
                encryptedPath: filePath + '.enc',
                iv: iv.toString('hex')
            };
        } catch (error) {
            throw new AppError('Error encrypting file', 500);
        }
    }

    static async decryptFile(encryptedPath, password, ivHex) {
        try {
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(password, config.security.encryptionSalt, 32);
            const iv = Buffer.from(ivHex, 'hex');

            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            const input = fs.createReadStream(encryptedPath, { encoding: null });
            const output = fs.createWriteStream(encryptedPath.replace('.enc', ''), { encoding: null });

            await pipeline(input, decipher, output);

            return encryptedPath.replace('.enc', '');
        } catch (error) {
            throw new AppError('Error decrypting file', 500);
        }
    }

    static async cleanupFiles(filePaths) {
        try {
            await Promise.all(filePaths.map(filePath => 
                fs.promises.unlink(filePath).catch(() => {})
            ));
        } catch (error) {
            console.error('Error cleaning up files:', error);
        }
    }

    static generateDownloadCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    static generateFileId() {
        return crypto.randomBytes(4).toString('hex');
    }
} 