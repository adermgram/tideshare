import React from "react";
import { useState } from "react";
import axios from "axios";
import QrImage from "./QrImage";
import plusImage from "../images/plus-symbol.png";

function Sender() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit");
        setSelectedFile(null);
        event.target.value = null;
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        }
      );

      setQrData({
        downloadCode: response.data.downloadCode,
        qrCodeUrl: response.data.qrCodeUrl,
      });
      setSelectedFile(null);
      event.target.reset();
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(
        error.response?.data?.message || "Error uploading file. Please try again."
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="sender-container">
      <div className="upload-section">
        <label className="upload-label" htmlFor="file-upload">
          <span>{selectedFile ? selectedFile.name : "Choose Files"}</span>
          <img src={plusImage} alt="Plus Icon" />
        </label>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <input
            type="file"
            id="file-upload"
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <button
            type="submit"
            className="upload-btn"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? "Uploading..." : "Upload →"}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isUploading && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <span className="progress-text">{uploadProgress}%</span>
        </div>
      )}

      {qrData && (
        <div className="success-message">
          <p>File uploaded successfully! Share the QR code or download code with the recipient.</p>
          <QrImage
            qrCodeUrl={qrData.qrCodeUrl}
            downloadCode={qrData.downloadCode}
          />
        </div>
      )}
    </div>
  );
}

export default Sender;
