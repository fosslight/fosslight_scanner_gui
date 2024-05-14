import { FC } from 'react';
import Button from '../atoms/button/Button';

interface ISideBarProps {
  onChangeTab?: () => void;
}

const SideBar: FC<ISideBarProps> = ({ onChangeTab }) => {
  const handleClick = () => {
    console.log('Button clicked');
  };

  return (
    <div className="flex h-full w-[160px] flex-col gap-3 border-r border-r-PaleGray-300 bg-PaleGray-50 p-3">
      <SideBarTab />
      <SideBarTab />
    </div>
  );
};

export default SideBar;

const SideBarTab: FC = () => {
  return (
    <div>
      <Button type="primary">Button</Button>
    </div>
  );
};
