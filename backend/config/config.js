import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const config = {
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
    },
    security: {
        encryptionSalt: process.env.ENCRYPTION_SALT || 'default-salt-change-in-production',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
        allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf,text/plain').split(','),
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL) || 600, // 10 minutes default
    },
    rateLimit: {
        windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // 15 minutes default
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window default
    },
    uploads: {
        directory: path.join(process.cwd(), 'uploads'),
    }
};

export default config; 