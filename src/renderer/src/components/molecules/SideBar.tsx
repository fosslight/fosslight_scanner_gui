import { FC } from 'react';
import Button from '../atoms/button/Button';
import SideBarTab from '../atoms/SideBarTab';

interface ISideBarProps {
  onChangeTab?: () => void;
}

const SideBar: FC<ISideBarProps> = ({ onChangeTab }) => {
  const handleClick = () => {
    console.log('Button clicked');
  };

  return (
    <div className="flex h-full w-[160px] flex-col gap-3 border-r border-r-PaleGray-300 bg-PaleGray-50 p-3">
      <SideBarTab menu="Scanner Option" />
      <SideBarTab menu="Private Token" />
    </div>
  );
};

export default SideBar;
