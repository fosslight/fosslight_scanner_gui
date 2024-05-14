import React from 'react';
import { FileEditIcon } from '@renderer/components/atoms/SVGIcons';

const EditButton: React.FC = () => {
  return (
    <button className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-PaleGray-100 hover:bg-PaleGray-200">
      <FileEditIcon />
    </button>
  );
};

export default EditButton;
