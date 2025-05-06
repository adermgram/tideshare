import React, { useState } from "react";
import axios from "axios";
import flashImage from "../images/flash-image.png";
import mime from 'mime-types'
import config from '../../config';

function Receiver() {
  const [downloadCode, setDownloadCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (event) => {
    const value = event.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setDownloadCode(value);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!downloadCode) {
      setErrorMessage('Please enter a download code');
      return;
    }

    setIsDownloading(true);
    setErrorMessage(null);
    setDownloadProgress(0);

    try {
      const response = await axios.post(
        `${config.apiUrl}/download-by-code`,
        { code: downloadCode },
        {
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(progress);
          }
        }
      );

      console.log('Response headers:', response.headers);
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Content-Disposition:', response.headers['content-disposition']);

      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'downloaded-file';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // If no filename was found, try to determine it from the content type
      if (filename === 'downloaded-file') {
        const contentType = response.headers['content-type'];
        const extension = contentType.split('/')[1];
        if (extension) {
          filename = `downloaded-file.${extension}`;
        }
      }

      console.log('Using filename:', filename);

      // Create blob with the correct type
      const contentType = response.headers['content-type'];
      console.log('Creating blob with type:', contentType);
      const blob = new Blob([response.data], { type: contentType });
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = filename;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage('File downloaded successfully!');
      setDownloadCode('');
    } catch (error) {
      if (error.response?.status === 404) {
        setErrorMessage('Invalid download code');
      } else if (error.response?.status === 400) {
        setErrorMessage('File has already been downloaded');
      } else {
        setErrorMessage('Error downloading file');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="receiver-container">
      <main className="main-content">
        <h1>Receive Your Files</h1>
        <h1>
          <span className="highlight">In a Flash</span>
          <img className="flash-image" src={flashImage} alt="Flash" />
        </h1>
        <p>Enter the 6-digit code displayed on the sender's device</p>
      </main>

      <form onSubmit={handleDownload} className="download-form">
        <div className="input-group">
          <label htmlFor="code">Download Code:</label>
          <input
            className="code-input"
            type="text"
            id="code"
            name="code"
            value={downloadCode}
            onChange={handleInputChange}
            placeholder="Enter 6-digit code"
            disabled={isDownloading}
            required
          />
        </div>

        <button
          type="submit"
          className="download-btn btn"
          disabled={isDownloading || downloadCode.length !== 6}
        >
          {isDownloading ? "Downloading..." : "Download"} 
          <span className="arrow">→</span>
        </button>
      </form>

      {errorMessage && (
        <div className="error-message">
          <p>{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      {isDownloading && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${downloadProgress}%` }}
          ></div>
          <span className="progress-text">{downloadProgress}%</span>
        </div>
      )}
    </div>
  );
}

export default Receiver;
