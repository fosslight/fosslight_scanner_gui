import { FC, ReactNode } from 'react';

interface IModalIconProps {
  children: ReactNode;
}

const ModalIcon: FC<IModalIconProps> = ({ children }) => {
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-LGRed-600">
      {children}
    </div>
  );
};
export default ModalIcon;
