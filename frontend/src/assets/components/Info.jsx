import React from 'react'

function Info () {
  return (
    <div className='info-parent'>
        <div class="info-container-wrapper">
            <div class="info-container">
                <h2 class="info-header">What TideShare Does</h2>
                <p class="info-text">
                    TideShare provides a secure and private way to share encrypted files,
                    whether they’re images, videos, or documents. It protects your data with
                    AES-256 encryption and offers multiple sharing options via QR codes or
                    secure download codes, ensuring only the intended recipient can access
                    your files.
                </p>
            </div>
            
            <div class="info-container">
                <h2 class="info-header">How TideShare Works</h2>
                <p class="info-text">
                    Simply upload your file and TideShare will encrypt it with a unique password.<br></br>
                    A QR code or a 6-digit download code will be generated, which you can share
                    with your recipient. The file can be accessed only once, keeping your data
                    secure and private from unauthorized access.
                </p>
            </div>
        </div>
    </div>
  )
}

export default Info;