import { FC, useRef } from 'react';

const FileUpload: FC = () => {
  return (
    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
  );
};

export default FileUpload;
