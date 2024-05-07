import React from 'react';

const IconButton: React.FC = () => {
  return (
    <button className="w-7 h-7 bg-PaleGray-100 hover:bg-PaleGray-200 rounded-md justify-center items-center inline-flex">
      <img className="w-4 h-4 relative" src="./src/assets/more-horizontal.png"></img>
    </button>
  );
};

export default IconButton;
