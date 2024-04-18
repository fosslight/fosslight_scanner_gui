import { ButtonHTMLAttributes, FC } from 'react';

interface IPropsButton {
  type?: 'light' | 'dark';
  title: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

const Button: FC<IPropsButton> = ({ type = 'light', title, ...props }) => {
  // const handleClickButton = () => {
  //   console.log('Button clicked');
  //   fosslight_analyze(config: {
  //     mode: ['source', 'binary', 'dependency'],
  //     path: ['.'],
  //     excludedPath: [],
  //   });
  // };

  const style = type === 'light' ? 'bg-white text-black' : 'bg-black text-white';

  return (
    <button className={style} {...props}>
      {title}
    </button>
  );
};

export default Button;
