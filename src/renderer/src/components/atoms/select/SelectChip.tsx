import { FC } from 'react';
import { CheckIcon, CheckSelectedIcon } from '../SVGIcons';

interface ISelectChipProps {
  title: string;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const SelectChip: FC<ISelectChipProps> = ({ title, selected = false, onSelect }) => {
  const bgClassName = selected
    ? 'bg-LGRed-100 hover:bg-LGRed-200'
    : 'bg-PaleGray-50 hover:bg-PaleGray-100';

  const handleClick = () => {
    onSelect?.(!selected);
  };

  return (
    <button
      className={`${bgClassName} flex h-9 min-w-fit items-center gap-[2px] rounded-lg pl-[6px] pr-[10px]`}
      onClick={handleClick}
    >
      {selected ? <CheckSelectedIcon /> : <CheckIcon />}
      <p className="text-[12px] font-medium text-PaleGray-900">{title}</p>
    </button>
  );
};

export default SelectChip;
