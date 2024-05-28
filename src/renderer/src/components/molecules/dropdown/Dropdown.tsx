import { ChangeEvent, FC, useRef, useState } from 'react';
import Text from '../../atoms/text/Text';
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
    setOpened(!opened);
  };

  const handleOptionClick = (value: string) => () => {
    onChange?.(value);
    setOpened(false);
  };

  const handleClickOutside = () => {
    setOpened(false);
  };

  useClickOutside(dropdownRef, handleClickOutside, [toggleRef]);

  return (
    <div className="relative">
      <div
        className={`flex h-[28px] w-[96px] cursor-pointer items-center justify-between rounded-md p-[6px] ${opened ? 'bg-PaleGray-50 hover:bg-PaleGray-100' : 'bg-white hover:bg-PaleGray-50'}`}
        ref={toggleRef}
        onClick={handleToggle}
      >
        <Text type="p50-m" color="PaleGray-800">
          {selectedOption.label}
        </Text>
        {hasOptions &&
          (opened ? (
            <img src="/src/assets/icons/up-small.svg" alt="up-small" />
          ) : (
            <img src="/src/assets/icons/down-small.svg" alt="down-small" />
          ))}
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
