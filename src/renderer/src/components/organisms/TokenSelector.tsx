import { FC, ReactNode, useEffect, useState } from 'react';
import TextInput, { ITextInputOption } from './TextInput';
import ListBox, { PathInfo } from './ListBox';
import Button, { ButtonType } from '../atoms/button/Button';
import useMeasure from '@renderer/hooks/useMeasure';
import TokenBox from './TokenBox';

interface ITokenSelectorProps {
  label: string;
  required?: boolean;

  placeholder?: ReactNode;
  addButtonConfig?: {
    type: ButtonType;
    title: string;
  };
  onChange?: (values: any) => void;
}

const SourceSelector: FC<ITokenSelectorProps> = ({
  label,
  required,
  addButtonConfig,
  placeholder,
  onChange
}) => {
  const { ref, width, ready } = useMeasure();

  const [pathInfo, setPathInfo] = useState<PathInfo | undefined>(undefined); //여기를 path option 따로 받거나
  const [pathInfoList, setPathInfoList] = useState<PathInfo[]>([]); // [PathInfo, ...

  const handleInputChange = (value: string | null, type?: ITextInputOption['type']) => {
    if (!value || !type) {
      setPathInfo(undefined);
    } else {
      setPathInfo({ option: type, path: value });
    }
  };

  const handleAddClick = () => {
    if (!pathInfo) return;
    setPathInfoList([...pathInfoList, pathInfo]);
    setPathInfo(undefined);
  };

  const handleRemoveClick = (index: number) => {
    setPathInfoList((prevList) => prevList.filter((_, i) => i !== index));
    console.log(`Remove item at index ${index}`);
  };

  // option 이랑 path(inputvalue)를 받아서 리스트에 추가 해야함 => 구조체나 객체나 튜플로 받아서 처리해야할듯
  // add 버튼 누르면 리스트에 추가됨
  // 어쨋튼 리스트는 여기서 관리가 되고 있을테니, 그 리스트를 ListBox로 넘겨주면 될듯
  // ListBox에서는 리스트를 받아서 렌더링만 해주면 됨
  // path_list : [(option, path), (option, path), ...]

  return (
    <div className="flex w-fit flex-col gap-4">
      <div ref={ref}>
        <TextInput
          label={label}
          required={required}
          suffix={
            <Button type={addButtonConfig?.type || 'primary'} onClick={handleAddClick}>
              {addButtonConfig?.title || 'Add'}
            </Button>
          }
          value={pathInfo?.path}
          onChange={handleInputChange}
          options={[]}
        />
      </div>
      {ready && (
        <div style={{ width }}>
          <TokenBox
            emptyText={placeholder}
            pathInfoList={pathInfoList}
            onRemoveClick={handleRemoveClick}
          />
        </div>
      )}
    </div>
  );
};

export default SourceSelector;
