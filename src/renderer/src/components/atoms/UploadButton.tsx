import React, { useRef } from 'react';

const UploadButton: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('file upload', files[0]);
    }
  };

  return (
    <div>
      <button
        className="w-7 h-7 bg-PaleGray-100 hover:bg-PaleGray-200 rounded-md justify-center items-center inline-flex"
        onClick={handleButtonClick}
      >
        <img className="w-4 h-4 relative" src="./src/assets/more-horizontal.png" alt="Upload" />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default UploadButton;
