import { ChangeEvent, FC, RefObject } from 'react';

interface IFileUploadProps {
  fileUploadRef: RefObject<HTMLInputElement>;
  directory?: boolean;
  onChange?: (files: File[]) => void;
}

const FileUpload: FC<IFileUploadProps> = ({ fileUploadRef, directory = false, onChange }) => {
  const directoryProps = directory ? { webkitdirectory: '', mozdirectory: '', directory: '' } : {};

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    onChange && onChange(files);
  };

  return (
    <input ref={fileUploadRef} type="file" hidden {...directoryProps} onChange={handleChange} />
  );
};

export default FileUpload;