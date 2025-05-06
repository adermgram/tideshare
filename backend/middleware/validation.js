import { AppError } from './errorHandler.js';
import config from '../config/config.js';

export const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return next(new AppError('No file uploaded', 400));
    }

    const { size, mimetype } = req.file;

    // Check file size
    if (size > config.security.maxFileSize) {
        return next(new AppError(`File size exceeds the limit of ${config.security.maxFileSize / (1024 * 1024)}MB`, 400));
    }

    // Check file type
    if (!config.security.allowedFileTypes.includes(mimetype)) {
        return next(new AppError(`File type ${mimetype} is not allowed`, 400));
    }

    next();
};

export const validateDownloadCode = (req, res, next) => {
    const { code } = req.body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
        return next(new AppError('Invalid download code format', 400));
    }

    next();
}; 