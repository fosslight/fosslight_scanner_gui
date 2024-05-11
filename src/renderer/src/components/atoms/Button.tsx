import { ButtonHTMLAttributes, FC } from 'react';

interface IPropsButton {
  title: string;
  className?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

const Button: FC<IPropsButton> = ({ title, className = '', ...props }) => {
  return (
    <button
      className={`${className} inline-flex h-9 items-center justify-start rounded-lg px-4 text-xs font-medium`}
    >
      {title}
    </button>
  );
};

export default Button;

<div className="bg-stone-100 inline-flex h-9 w-[72px] items-center justify-start rounded-lg px-4">
  <div className="text-rose-800 font-['Spoqa Han Sans Neo'] text-xs font-medium">Button</div>
</div>;
