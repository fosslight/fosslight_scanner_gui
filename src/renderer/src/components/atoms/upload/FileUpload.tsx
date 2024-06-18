import { ChangeEvent, FC, RefObject } from 'react';

interface IFileUploadProps {
  fileUploadRef: RefObject<HTMLInputElement>;
  directory?: boolean;
  onChange?: (files: File[]) => void;
  onPathChange?: (path: string) => void;
}

const FileUpload: FC<IFileUploadProps> = ({
  fileUploadRef,
  directory = false,
  onChange,
  onPathChange
}) => {
  const directoryProps = directory ? { webkitdirectory: '', mozdirectory: '', directory: '' } : {};

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    onChange?.(files);

    if (directory) {
      const filePath = files[0].path;
      const dirPath = filePath.substring(0, filePath.lastIndexOf('\\'));
      console.log('path:', dirPath);
      onPathChange?.(dirPath);
    } else {
      const filePath = files[0].path;
      console.log('path:', filePath);
      onPathChange?.(filePath);
    }
  };

  return (
    <input ref={fileUploadRef} type="file" hidden {...directoryProps} onChange={handleChange} />
  );
};

export default FileUpload;
