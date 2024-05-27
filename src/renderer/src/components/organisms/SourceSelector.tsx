import { FC, useState } from 'react';
import TextInput from './TextInput';
import ListBox, {PathInfo} from './ListBox';
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
  const [pathValue, setPathValue] = useState<string | undefined>(undefined); //여기를 path option 따로 받거나
  const [optionValue, setOptionValue] = useState<string | undefined>(undefined); //여기를 path option 따로 받거나
  const [path_list, setPathList] = useState<PathInfo[]>([]); // [PathInfo, ...

  const handleInputChange = (value: string) => {
    setPathValue(value);
    setOptionValue(value);
    onChange && onChange(value);
  };

  const handleAddClick = () => {
    if (!pathValue)  return;
    
    setPathValue('');
    console.log(`Add '${pathValue}' to list`);
    setPathList([...path_list, {option: 'local', path: pathValue || ''}]); // Provide a default value for inputValue
  };

  const handleEditClick = (index: number) => {
    console.log(`Edit item at index ${index}`);
  };

  const handleRemoveClick = (index: number) => {
    console.log(`Remove item at index ${index}`);
  };

  // option 이랑 path(inputvalue)를 받아서 리스트에 추가 해야함 => 구조체나 객체나 튜플로 받아서 처리해야할듯
  // add 버튼 누르면 리스트에 추가됨
  // 어쨋튼 리스트는 여기서 관리가 되고 있을테니, 그 리스트를 ListBox로 넘겨주면 될듯
  // ListBox에서는 리스트를 받아서 렌더링만 해주면 됨
  // path_list : [(option, path), (option, path), ...]


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
        value={pathValue}
        onChange={handleInputChange}
      />
      <ListBox path_list={path_list} onEditClick={handleEditClick} onRemoveClick={handleRemoveClick}/>
    </div>
  );
};

export default SourceSelector;
