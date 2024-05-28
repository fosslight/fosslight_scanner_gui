import React, { ChangeEvent, FC, useRef } from 'react';

const UploadButton: FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('file upload', files[0]);
    }
  };

  return (
    <div>
      <button
        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-PaleGray-100 hover:bg-PaleGray-200"
        onClick={handleButtonClick}
      >
        <img className="h-4 w-4" src="/src/assets/more-horizontal.png" alt="upload" />
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
