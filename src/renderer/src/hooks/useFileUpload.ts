import { RefObject, useRef } from 'react';

interface IUseFileUpload {
  openFileUpload: () => void;
  fileUploadRef: RefObject<HTMLInputElement>;
}

const useFileUpload = (): IUseFileUpload => {
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const openFileUpload = () => {
    fileUploadRef.current?.click();
  };

  return { openFileUpload, fileUploadRef };
};

export default useFileUpload;
