import { FC } from 'react';
import Text from './text/Text';

interface ISideBarTabProps {
  menu: string;
  isActive: boolean;
  onClick?: () => void;
}

const SideBarTab: FC<ISideBarTabProps> = ({ menu, isActive, onClick }) => {
  return (
    <button
      className={`flex h-8 items-center justify-start gap-2.5 rounded-md p-2 
    ${isActive ? 'bg-PaleGray-300 text-LGRed-600' : 'bg-PaleGray-50 text-PaleGray-600'}
    hover:bg-PaleGray-300 active:text-LGRed-600`}
      onClick={onClick}
    >
      <Text type="p200-r"> {menu}</Text>
    </button>
  );
};

export default SideBarTab;
