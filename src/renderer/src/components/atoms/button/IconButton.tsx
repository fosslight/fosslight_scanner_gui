import { FC, ReactNode } from 'react';

interface IIconButtonProps {
  children: ReactNode;
  onClick: () => void;
}

const IconButton: FC<IIconButtonProps> = ({ children, onClick }) => {
  return (
    <button
      className="flex h-7 w-7 items-center justify-center rounded-md bg-PaleGray-50 hover:bg-PaleGray-200"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default IconButton;
