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
        'w-auto h-9 p-2 bg-white hover:bg-PaleGray-50 border rounded-lg justify-start items-center gap-2 inline-flex'
      }
      onClick={handleClick}
    >
      <div className="w-6 h-6">{clicked ? <CheckOnIcon /> : <CheckOffIcon />}</div>
      <div className="text-PaleGray-1000 text-sm font-medium font-SpoqaHanSansNeo-Regular">
        {title}
      </div>
    </button>
  );
};

export default SelectCheckbox;
