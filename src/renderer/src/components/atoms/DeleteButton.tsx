import React from 'react';
import { FileDeleteIcon } from './SVGIcons';

const DeleteButton: React.FC = () => {
  return (
    <button className="w-7 h-7 bg-PaleGray-100 hover:bg-PaleGray-200 rounded-md justify-center items-center inline-flex">
      <FileDeleteIcon />
    </button>
  );
};

export default DeleteButton;
