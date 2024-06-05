import { FC } from 'react';
import Text from './text/Text';

interface ISideBarTabProps {
  //children: ReactNode;
  menu: string;
  onClick?: () => void;
}

const SideBarTab: FC<ISideBarTabProps> = ({ menu, onClick }) => {
  return (
    <button
      className="flex h-8 items-center justify-start gap-2.5 rounded-md bg-PaleGray-50
      p-2 text-PaleGray-600 hover:bg-PaleGray-300 active:bg-PaleGray-200
        active:text-LGRed-600"
      onClick={onClick}
    >
      <Text type="p200-r"> {menu}</Text>
    </button>
  );
};

export default SideBarTab;
