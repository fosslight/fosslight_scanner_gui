import React from 'react';

const IconButton: React.FC = () => {
  return (
    <button className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-PaleGray-100 hover:bg-PaleGray-200">
      <img className="relative h-4 w-4" src="@renderer/assets/more-horizontal.png"></img>
    </button>
  );
};

export default IconButton;
