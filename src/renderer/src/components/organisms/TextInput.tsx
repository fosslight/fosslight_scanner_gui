import { FC, ReactNode, useState } from 'react';
import Text from '../atoms/text/Text';
import Dropdown, { IDropdownOption } from '../molecules/dropdown/Dropdown';
import Input from '../atoms/input/Input';

export interface ITextInputOption {
  value: string;
  label: string;
  type: 'text' | 'file';
  placeholder?: string;
}

interface ITextInputProps {
  label?: string;
  required?: boolean;
  options: ITextInputOption[];
  suffix?: ReactNode;
  value?: string;
  onChange?: (value: any) => void;
}

const TextInput: FC<ITextInputProps> = ({
  label,
  required = false,
  options,
  suffix,
  value,
  onChange
}) => {
  const dropdownOptions: IDropdownOption[] = [
    { value: 'github', label: 'GitHub repo' }, // Change this option to 'Link' later
    { value: 'local', label: 'Local path' }
  ];
  const [selectedValue, setSelectedValue] = useState<string>(dropdownOptions[0].value);

  const handleDropdownChange = (value: string) => {
    setSelectedValue(value);
  };

  const handleInputChange = (value: string) => {
    console.log(value);
    onChange && onChange(value);
  };

  return (
    <div className="flex flex-col gap-[6px]">
      {label && (
        <div className="flex gap-[2px] bg-transparent">
          <Text type="p200-m" color="PaleGray-900">
            {label}
          </Text>
          {required && (
            <Text type="p200-m" color="LGRed-600">
              *
            </Text>
          )}
        </div>
      )}
      <div className="flex w-full gap-2">
        <div className="flex h-[36px] w-full min-w-[280px] items-center rounded-lg border border-PaleGray-300 bg-white px-1">
          <div className="mr-2">
            <Dropdown
              options={dropdownOptions}
              onChange={handleDropdownChange}
              value={selectedValue}
            />
          </div>
          <div className="h-[16px] w-[1px] bg-PaleGray-300" />
          <div className="flex h-full w-full items-center px-[6px]">
            <Input placeholder="placeholder" value={value} onChange={handleInputChange} />
          </div>
        </div>
        {suffix}
      </div>
    </div>
  );
};

export default TextInput;
