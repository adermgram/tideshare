# Secure File Sharing Service

A secure file sharing service that allows users to upload files, encrypt them, and share them via QR codes or download codes. The service ensures that files can only be downloaded once and are automatically deleted after download.

## Features

- Secure file upload with encryption
- One-time download links via QR codes
- Download codes for easy sharing
- Automatic file cleanup after download
- Rate limiting to prevent abuse
- File type and size validation
- Environment-based configuration
- Responsive design for all devices
- Progress tracking for uploads and downloads
- Enhanced error handling and user feedback
- Touch-optimized interface

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jallow13/Script-Sorcerers-Hack-9.git
cd Script-Sorcerers-Hack-9
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3000
NODE_ENV=development
ENCRYPTION_SALT=your-secure-salt-here
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,text/plain
CACHE_TTL=600
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## User Interface Features

### Sender Interface
- Drag and drop file upload
- File size validation (max 10MB)
- Upload progress tracking
- QR code generation
- Download code display
- Success/error notifications

### Receiver Interface
- 6-digit code input validation
- Download progress tracking
- Success/error notifications
- Automatic file download
- Responsive design for all screen sizes

## API Endpoints

### Upload File
- **POST** `/upload`
- **Body**: `multipart/form-data` with `file` field
- **Response**: 
  ```json
  {
    "qrCodeUrl": "data:image/png;base64,...",
    "downloadCode": "123456"
  }
  ```

### Download by File ID
- **GET** `/download/:fileID`
- **Response**: File download

### Download by Code
- **POST** `/download-by-code`
- **Body**: `{ "code": "123456" }`
- **Response**: File download

## Security Features

- Files are encrypted using AES-256-CBC
- One-time download links
- Rate limiting
- File type validation
- File size limits
- Automatic file cleanup
- Input validation and sanitization
- Secure error handling

## Responsive Design

The application is fully responsive and optimized for:
- Mobile devices (portrait and landscape)
- Tablets
- Desktop screens
- Touch devices

## Development

### Running Tests
```bash
cd backend
npm test
```

### Code Style
The project uses ESLint for code style enforcement. Run the linter:
```bash
cd frontend
npm run lint
```

## Browser Support

The application is tested and supported on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## License

ISC 