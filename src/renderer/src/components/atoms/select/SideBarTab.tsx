import { FC, ReactNode } from 'react';

interface ISideBarTabProps {
  children: ReactNode;
  onClick?: () => void;
}

const SideBarTab: FC<ISideBarTabProps> = ({ children, onClick }) => {
  return (
    <button
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-PaleGray-50 hover:bg-PaleGray-200"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default SideBarTab;
