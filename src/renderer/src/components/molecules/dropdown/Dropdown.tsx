import { FC, useRef, useState } from 'react';
import Text from '../../atoms/text/Text';
import { ArrowDownIcon, ArrowUpIcon } from '../../atoms/SVGIcons';
import useClickOutside from '@renderer/hooks/useClickOutside';

export interface IDropdownOption {
  value: string;
  label: string;
}

interface IDropdownProps {
  options: IDropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
}

const Dropdown: FC<IDropdownProps> = ({ options, value, onChange }) => {
  const [opened, setOpened] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value) || options[0];
  const hasOptions = options.length > 1;

  const handleToggle = () => {
    hasOptions && setOpened(!opened);
  };

  const handleOptionClick = (value: string) => () => {
    onChange?.(value);
    setOpened(false);
  };

  const handleClickOutside = () => {
    setOpened(false);
  };

  useClickOutside(dropdownRef, handleClickOutside, [toggleRef]);

  const dropdownClassName = hasOptions
    ? opened
      ? 'bg-PaleGray-50 hover:bg-PaleGray-100 cursor-pointer'
      : 'bg-white hover:bg-PaleGray-50 cursor-pointer'
    : 'bg-white cursor-auto';

  return (
    <div className="relative">
      <div
        className={`${dropdownClassName} flex h-[28px] w-[96px] items-center justify-between rounded-md p-[6px]`}
        ref={toggleRef}
        onClick={handleToggle}
      >
        <Text type="p50-m" color="PaleGray-800" className="truncate">
          {selectedOption.label}
        </Text>
        {hasOptions && (opened ? <ArrowUpIcon /> : <ArrowDownIcon />)}
      </div>
      {opened && hasOptions && (
        <div
          className="absolute top-9 z-10 flex w-[110px] flex-col gap-[6px] rounded-lg bg-white p-[6px] shadow-300"
          ref={dropdownRef}
        >
          {options.map((option) => (
            <div
              className="flex cursor-pointer items-center rounded-md p-[6px] text-PaleGray-800 hover:bg-LGRed-100 hover:text-LGRed-600 active:bg-LGRed-200"
              key={option.value}
              onClick={handleOptionClick(option.value)}
            >
              <Text type="p50-r">{option.label}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
