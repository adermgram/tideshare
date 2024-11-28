import React, { useState } from "react";
import axios from "axios";
import flashImage from "../images/flash-image.png";
import mime from 'mime-types'

function Receiver() {
  const [downloadCode, setDownloadCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (event) => {
    setDownloadCode(event.target.value);
    setErrorMessage(""); // Clear error message on input change
  };


  const handleDownload = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3000/download-by-code",
        { code: downloadCode },
        { responseType: "blob" }
      );



      const contentDisposition = response.headers["content-disposition"];
      const filenameMatch =
      contentDisposition && contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)/i);
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : `downloaded-file.${mime.extension(response.headers["content-type"]) || "bin"}`;
    

      const mimeType =
        response.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: mimeType });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);

      if (error.response && error.response.status === 404) {
        setErrorMessage("Invalid or expired code.");
      } else if (error.response && error.response.status === 400) {
        setErrorMessage("This file has already been downloaded.");
      } else {
        setErrorMessage("Error downloading the file. Please try again.");
      }
    }
  };

  return (
    <div className="receiver-container">
      <main class="main-content">
        <h1>Receive Your Files </h1>
        <h1>
          <span className="highlight">In a Flash </span>
          <img className="flash-image" src={flashImage} alt=""></img>
        </h1>
        <p>Enter a 6 digit displayed on the sender’s device</p>
      </main>
      <form onSubmit={handleDownload}>
        <label htmlFor="code">Download Code:</label>
        <input
          className="code-input"
          type="text"
          id="code"
          name="code"
          value={downloadCode}
          onChange={handleInputChange}
          required
          minLength="6"
          maxLength="6"
        />
        <button type="submit" className="download-btn btn">
          Download <span class="arrow">→</span>
        </button>
      </form>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );
}

export default Receiver;
