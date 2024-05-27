import { FC, ReactNode } from 'react';

export type ButtonType = 'primary' | 'secondary' | 'tertiary';

interface IButtonProps {
  children: ReactNode;
  type: ButtonType;
  onClick?: () => void;
}

const classNames = {
  primary:
    'text-white bg-LGRed-600 hover:bg-LGRed-700 active:bg-LGRed-600 active:border active:border-LGRed-600',
  secondary:
    'text-LGRed-600 bg-LGRed-100 hover:bg-LGRed-300 active:bg-LGRed-100 active:border active:border-LGRed-500',
  tertiary:
    'text-PaleGray-900 bg-PaleGray-50 hover:bg-PaleGray-300 active:bg-PaleGray-100 active:border active:border-PaleGray-500'
};

const Button: FC<IButtonProps> = ({ children, type, onClick }) => {
  return (
    <button
      className={`${classNames[type]} h-9 rounded-lg px-4 text-xs font-medium`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
