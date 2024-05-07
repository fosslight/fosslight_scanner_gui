import React, { useState } from 'react';

interface IToggleProps {
  toggled: boolean;
  setToggled: (value: boolean) => void;
}

const Toggle: React.FC<IToggleProps> = ({ toggled, setToggled }) => {
  const toggle = () => {
    console.log('toggled');
    setToggled(!toggled);
  };

  return (
    <button
      className={`w-[54px] h-[32px] p-[2px] rounded-full flex ${toggled ? 'justify-start bg-PaleGray-300' : 'justify-end bg-LGRed-600'}`}
      onClick={toggle}
    >
      <div className="w-[28px] h-[28px] rounded-full flex justify-center items-center bg-PaleGray-100"></div>
    </button>
  );
};

export default Toggle;

