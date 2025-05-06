const config = {
  development: {
    apiUrl: 'http://localhost:3000'
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL
  }
};

console.log('API URL:', import.meta.env.VITE_API_URL);
export default config[import.meta.env.MODE || 'development']; 