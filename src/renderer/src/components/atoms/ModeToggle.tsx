import React, { useState } from 'react';
import { ModeScanIcon } from './SVGIcons';
import { ModeCompareIcon } from './SVGIcons';

interface IModeToggleProps {
  toggled: boolean;
  setToggled: (value: boolean) => void;
}

const ModeToggle: React.FC<IModeToggleProps> = ({ toggled, setToggled }) => {
  const toggle = () => {
    console.log('toggled');
    setToggled(!toggled);
  };

  return (
    <button
      className={`w-[54px] h-[32px] p-[2px] rounded-full flex ${toggled ? 'justify-start bg-PaleGray-300' : 'justify-end bg-LGRed-600'}`}
      onClick={toggle}
    >
      <div className="w-[28px] h-[28px] rounded-full flex justify-center items-center bg-PaleGray-100">
        {toggled ? <ModeScanIcon /> : <ModeCompareIcon />}
      </div>
    </button>
  );
};

export default ModeToggle;

{
  /*import { ButtonHTMLAttributes, FC } from 'react';

interface IPropsButton {
  type?: 'light' | 'dark';
  title: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

const modeToggle: FC<IPropsButton> = ({ type = 'light', title, ...props }) => {
  // const handleClickButton = () => {
  //   console.log('Button clicked');
  //   fosslight_analyze(config: {
  //     mode: ['source', 'binary', 'dependency'],
  //     path: ['.'],
  //     excludedPath: [],
  //   });
  // };

  const style = type === 'light' ? 'bg-[#F2F4F5] text-black' : 'bg-[#A50034] text-white';

  return (
    <button
      className={`${style} h-9 px-4 rounded-lg justify-start items-center inline-flex`}
      style={{ width: '72px' }}
    >
      {title}
    </button>
  );
};

export default modeToggle; */
}
