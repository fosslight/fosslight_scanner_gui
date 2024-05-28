import { useState, FC } from 'react';
import { CheckOffIcon, CheckOnIcon } from '../SVGIcons';

interface ISelectCheckboxProps {
  title: string;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const SelectCheckbox: FC<ISelectCheckboxProps> = ({
  title,
  selected: inputSelected = false,
  onSelect
}) => {
  const [selected, setSelected] = useState<boolean>(inputSelected);

  const handleClick = () => {
    setSelected(!selected);
    onSelect?.(!selected);
  };

  return (
    <button
      className="flex h-9 w-fit items-center gap-2 rounded-lg bg-white p-2 hover:bg-PaleGray-50"
      onClick={handleClick}
    >
      <div className="h-6 w-6">{selected ? <CheckOnIcon /> : <CheckOffIcon />}</div>
      <p className="text-[13px] font-medium text-PaleGray-1000">{title}</p>
    </button>
  );
};

export default SelectCheckbox;
