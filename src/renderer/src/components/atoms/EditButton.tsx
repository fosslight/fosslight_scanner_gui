import React from 'react';
import { FileEditIcon } from './SVGIcons';

const EditButton: React.FC = () => {
  return (
    <button className="w-7 h-7 bg-PaleGray-100 hover:bg-PaleGray-200 rounded-md justify-center items-center inline-flex">
      <FileEditIcon />
    </button>
  );
};

export default EditButton;
