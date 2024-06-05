import { FC, ReactNode, useEffect, useState } from 'react';
import TextInput, { ITextInputOption } from './TextInput';
import ListBox, { PathInfo } from './ListBox';
import Button, { ButtonType } from '../atoms/button/Button';
import useMeasure from '@renderer/hooks/useMeasure';
import ModifyModal from './modal/ModifyModal';
import useModal from '@renderer/hooks/useModal';


interface ISourceSelectorProps {
  label: string;
  required?: boolean;
  options: ITextInputOption[];
  placeholder?: ReactNode;
  addButtonConfig?: {
    type: ButtonType;
    title: string;
  };
  onChange?: (values: any) => void;
}

const SourceSelector: FC<ISourceSelectorProps> = ({
  label,
  required,
  options,
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

  const { openModal, closeModal, modalRef } = useModal();

  const handleAddClick = () => {
    if (!pathInfo) return;
    setPathInfoList([...pathInfoList, pathInfo]);
    setPathInfo(undefined);
  };

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const handleEditClick = (index: number) => {
    setEditIndex(index);
    console.log(`Edit item at index ${editIndex}`);
    pathInfoList.map((info,i)=>console.log(`PathList[${i}]: ${info.path}`));
    openModal();
  };

  const handleRemoveClick = (index: number) => {
    setPathInfoList((prevList) => prevList.filter((_, i) => i !== index));
    console.log(`Remove item at index ${index}`);
  };

  const handleElementChange = (value: string | null, type?: ITextInputOption['type']) => {
    if (editIndex === null) return;
    setPathInfoList((prevList) =>
      prevList.map((item, i) => (i === editIndex ? { option: type || item.option, path: value || item.path } : item))
    );
    console.log(`Modify item at index ${editIndex}`);
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
          options={options}
          suffix={
            <Button type={addButtonConfig?.type || 'primary'} onClick={handleAddClick}>
              {addButtonConfig?.title || 'Add'}
            </Button>
          }
          value={pathInfo?.path}
          onChange={handleInputChange}
        />
      </div>
      {ready && (
        <div style={{ width }}>
          <ListBox
            emptyText={placeholder}
            pathInfoList={pathInfoList}
            onEditClick={handleEditClick}
            onRemoveClick={handleRemoveClick}
          />
        </div>
      )}
      {editIndex !== null && (
        <ModifyModal
          isOpen={editIndex !== null}
          modalRef={modalRef}
          title="Modify Analysis Subject"
          content="The details such as the analysis list that you've added will be maintained."
          options={options}
          onClose={closeModal}
          value={pathInfoList[editIndex]?.path}
          onChange={handleElementChange}
        />
      
      )}
    </div>
  );
};

export default SourceSelector;
