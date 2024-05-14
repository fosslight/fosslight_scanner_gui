import { FC } from 'react';

interface ITextInputProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  dropdown;
  onClickButton?: () => void;
  onChange?: (value: any) => void;
}

const TextInput: FC = () => {
  return <div></div>;
};

export default TextInput;
