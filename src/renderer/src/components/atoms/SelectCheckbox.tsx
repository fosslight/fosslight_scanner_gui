import { useState, FC } from 'react';
import { CheckOnIcon, CheckOffIcon } from './SVGIcons';

interface ISelectProps {
  title: string;
  onCheckboxClick: (checked: boolean) => void;
}

const SelectCheckbox: FC<ISelectProps> = ({ title, onCheckboxClick }) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    const Boxclicked = !clicked;
    setClicked(Boxclicked);
    onCheckboxClick(Boxclicked);
  };

  return (
    <button
      className={
        'inline-flex h-9 w-auto items-center justify-start gap-2 rounded-lg border bg-white p-2 hover:bg-PaleGray-50'
      }
      onClick={handleClick}
    >
      <div className="h-6 w-6">{clicked ? <CheckOnIcon /> : <CheckOffIcon />}</div>
      <div className="font-SpoqaHanSansNeo-Regular text-sm font-medium text-PaleGray-1000">
        {title}
      </div>
    </button>
  );
};

export default SelectCheckbox;
