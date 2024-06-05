import { FC, ReactNode, useState } from 'react';
import Text from '../atoms/text/Text';
import Dropdown, { IDropdownOption } from '../molecules/dropdown/Dropdown';
import Input from '../atoms/input/Input';
import IconButton from '../atoms/button/IconButton';
import useFileUpload from '@renderer/hooks/useFileUpload';
import FileUpload from '../atoms/upload/FileUpload';

export interface ITextInputOption extends IDropdownOption {
  type: 'text' | 'file';
  placeholder?: string;
}

interface ITextInputProps {
  label?: string;
  required?: boolean;
  showDropdown?: boolean;
  showInput?: boolean;
  options: ITextInputOption[];
  suffix?: ReactNode;
  value?: string;
  onChange?: (value: string | null, type?: ITextInputOption['type']) => void;
}

const TextInput: FC<ITextInputProps> = ({
  label,
  required = false,
  showDropdown = true,
  showInput = true,
  options,
  suffix,
  value,
  onChange
}) => {
  const { openFileUpload, fileUploadRef } = useFileUpload();
  const [selectedOption, setSelectedOption] = useState<ITextInputOption>(options[0]);

  const handleDropdownChange = (value: string) => {
    setSelectedOption(options.find((option) => option.value === value) || options[0]);
    onChange?.(null);
  };

  const handleInputChange = (value: string) => {
    onChange?.(value, selectedOption.type);
  };

  const handleFileChange = (files: File[]) => {
    onChange?.(files[0].path, selectedOption.type); // Fix: should handle both ordinary file and directory
  };

  return options.length === 0 ? null : (
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
        {showInput && (
          <div className="flex h-[36px] w-[280px] min-w-[280px] items-center rounded-lg border border-PaleGray-300 bg-white px-1">
            {showDropdown && (
              <>
                <div className="mr-2">
                  <Dropdown
                    options={options}
                    onChange={handleDropdownChange}
                    value={selectedOption.value}
                  />
                </div>
                <div className="h-[16px] w-[1px] bg-PaleGray-300" />
              </>
            )}
            {selectedOption.type === 'file' && (
              <>
                <div className="flex w-full items-center overflow-hidden px-[6px]">
                  <Text type="p100-r" color={`PaleGray-${value ? 1000 : 500}`} className="truncate">
                    {value || selectedOption.placeholder}
                  </Text>
                </div>
                <IconButton onClick={openFileUpload}>
                  <img
                    className="h-4 w-4"
                    src="/src/assets/icons/more-horizontal.svg"
                    alt="upload"
                  />
                </IconButton>
              </>
            )}
            {selectedOption.type === 'text' && (
              <div className="flex w-full items-center px-[6px]">
                <Input
                  placeholder={selectedOption.placeholder}
                  value={value ?? ''}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </div>
        )}
        {suffix}
      </div>

      <FileUpload fileUploadRef={fileUploadRef} onChange={handleFileChange} />
    </div>
  );
};

export default TextInput;
