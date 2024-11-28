import React from "react";
import { useState } from "react";
import axios from "axios";
import QrImage from "./QrImage";
import plusImage from "../images/plus-symbol.png";

function Sender() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrData, setQrData] = useState(null);
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

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
        }
      );

      setQrData({
        downloadCode: response.data.downloadCode,
        qrCodeUrl: response.data.qrCodeUrl,
      });
      console.log(response.data.downloadCode);
      console.log(response.data.qrCodeUrl);

      //  console.log('File uploaded successfully:', response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div>
   <div className="upload-section">
      <label className="upload-label" for="file-upload">
        <span>Choose Files</span>{" "}
        <img src={plusImage} alt="Plus Icon"></img>
      </label>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="file"
          id="file-upload"
          style={{display: "none"}}
          onChange={handleFileChange}
        ></input>
        <button
         type="submit"
          className="upload-btn">
          Upload →
        </button>
      </form>
      
    </div>
    {qrData && (
        <QrImage
          qrCodeUrl={qrData.qrCodeUrl}
          downloadCode={qrData.downloadCode}
        />
      )}
    </div>
  );
}

export default Sender;
