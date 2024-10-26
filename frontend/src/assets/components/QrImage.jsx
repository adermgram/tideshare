import React from 'react';

function QrImage({ qrCodeUrl, downloadCode }) {
  console.log(downloadCode);
  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h3>File Uploaded Successfully</h3>
      <p>Scan the QR code or use the code below to download the file.</p>
      <img src={qrCodeUrl} id = "qr-image" alt="QR Code" style={{ width: '300px', height: '300px', margin: '10px' }} /><br />
      <div className='code-container'><h2 style={{ fontSize: '50px', color: '#00000', fontFamily:"poppins" }}>{downloadCode}</h2></div>
    </div>
  );
}

export default QrImage;
