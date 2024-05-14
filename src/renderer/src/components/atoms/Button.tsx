import { ButtonHTMLAttributes, FC } from 'react';

interface IPropsButton {
  title: string;
  className?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

const Button: FC<IPropsButton> = ({ title, className = '', ...props }) => {


  return (
    <button
      className={`${className} h-9 px-4 rounded-lg text-xs font-medium justify-start items-center inline-flex`}
    >
      {title}
    </button>
  );
};

export default Button;
