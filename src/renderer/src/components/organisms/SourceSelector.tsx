import { FC, useState } from 'react';
import TextInput from './TextInput';
import ListBox from './ListBox';
import Button, { ButtonType } from '../atoms/button/Button';

interface ISourceSelectorProps {
  label: string;
  required?: boolean;
  options?: any[];
  addButtonConfig?: {
    type: ButtonType;
    title: string;
  };
  onChange?: (values: any) => void;
}

const SourceSelector: FC<ISourceSelectorProps> = ({
  label,
  required,
  addButtonConfig,
  onChange
}) => {
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    onChange && onChange(value);
  };

  const handleAddClick = () => {
    setInputValue('');
    console.log(`Add '${inputValue}' to list`);
  };

  return (
    <div className="flex w-fit flex-col gap-4">
      <TextInput
        label={label}
        required={required}
        options={[]}
        suffix={
          <Button type={addButtonConfig?.type || 'primary'} onClick={handleAddClick}>
            {addButtonConfig?.title || 'Add'}
          </Button>
        }
        value={inputValue}
        onChange={handleInputChange}
      />
      <ListBox />
    </div>
  );
};

export default SourceSelector;
