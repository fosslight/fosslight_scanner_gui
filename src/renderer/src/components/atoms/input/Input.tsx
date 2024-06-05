import { ChangeEvent, FC } from 'react';

interface IInputProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

const Input: FC<IInputProps> = ({ value, placeholder, onChange }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <input
      className="w-full overflow-ellipsis text-[12px] font-normal text-PaleGray-1000 placeholder:text-PaleGray-500"
      type="text"
      value={value}
      placeholder={placeholder}
      spellCheck={false}
      onChange={handleChange}
    />
  );
};

export default Input;
