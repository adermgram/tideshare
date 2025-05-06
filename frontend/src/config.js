const config = {
  development: {
    apiUrl: 'http://localhost:3000'
  },
  production: {
    apiUrl: process.env.VITE_API_URL || 'https://your-backend-url.onrender.com'
  }
};

export default config[import.meta.env.MODE || 'development']; 