import React, { useState } from "react";
import axios from 'axios';
import QrImage from "./assets/components/QrImage";
import Home from "./assets/components/Home";
import Sender from "./assets/components/Sender";
import Receiver from "./assets/components/Receiver";
import Info from "./assets/components/Info";
import Footer from "./assets/components/Footer";

function App() {
  const [selectedFile, setSelectedFile] = useState(null); 
  const [qrData, setQrData] = useState(null); 
  const [isSending, setIsSending] = useState(false);

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
      const response = await axios.post("http://localhost:3000/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      
      setQrData({
        downloadLink: response.data.downloadLink,
        qrCodeUrl: response.data.qrCodeUrl
      });

  
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div>
       <Home/>
       <button id="senderBtn" className="btn home-btn" onClick={()=>setIsSending(true)}>send</button>
       <button id ="receiverBtn" className="btn home-btn" onClick={()=>setIsSending(false)}>receive</button>
    { isSending ? <Sender/>:<Receiver/> }
     <Info/>
    <Footer/>
    </div>
  );
}

export default App;
