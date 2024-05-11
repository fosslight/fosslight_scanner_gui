import { FC, ReactNode } from 'react';

interface IModalProps {
  isOpen: boolean;
  icon?: string;
  title: string;
  content?: string;
  children?: ReactNode;
  buttons?: ReactNode;
}

const Modal: FC<IModalProps> = ({ isOpen = false, icon, title, content, children, buttons }) => {
  return !isOpen ? null : (
    <div className="bg-white px-7 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon && <img src={icon} alt="icon" className="h-6 w-6" />}
          <h2 className="ml-3 text-lg font-bold">{title}</h2>
        </div>
      </div>
      {content && <p className="text-gray-500 mt-3 text-sm">{content}</p>}
      {children}
      {buttons}
    </div>
  );
};

export default Modal;
