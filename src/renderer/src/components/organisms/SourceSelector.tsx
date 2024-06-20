import { FC, ReactNode, useEffect, useState } from 'react';
import TextInput, { ITextInputOption } from './TextInput';
import ListBox from './ListBox';
import Button, { ButtonType } from '../atoms/button/Button';
import useMeasure from '@renderer/hooks/useMeasure';
import useModal from '@renderer/hooks/useModal';
import Modal from './modal/Modal';
import { ModifyModalIcon } from '../atoms/SVGIcons';

interface ISourceSelectorProps {
  label: string;
  required?: boolean;
  options: ITextInputOption[];
  placeholder?: ReactNode;
  addButtonConfig?: {
    type: ButtonType;
    title: string;
  };
  values?: PathInfo[];
  onChange?: (values: PathInfo[]) => void;
}

const SourceSelector: FC<ISourceSelectorProps> = ({
  label,
  required,
  options,
  addButtonConfig,
  placeholder,
  values,
  onChange
}) => {
  const { ref, width, ready } = useMeasure();

  const [pathInfo, setPathInfo] = useState<PathInfo | undefined>(undefined);
  const [pathInfoList, setPathInfoList] = useState<PathInfo[]>(values ?? []);

  const handleInputChange = (value?: string, type?: ITextInputOption['type']) => {
    if (!value || !type) {
      setPathInfo(undefined);
    } else {
      setPathInfo({ type: type, path: value });
    }
  };

  const { openModal, closeModal, modalRef } = useModal();

  const handleAddClick = () => {
    if (!pathInfo) return;
    const newPathInfoList = [...pathInfoList, pathInfo];
    setPathInfoList(newPathInfoList);
    setPathInfo(undefined);
    onChange?.(newPathInfoList);
  };

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editPath, setEditPath] = useState<string | null>(null);

  const handleEditClick = (index: number) => {
    setEditIndex(index);
    setEditPath(pathInfoList[index].path);
    openModal();
  };

  const handleRemoveClick = (index: number) => {
    const newPathInfoList = pathInfoList.filter((_, i) => i !== index);
    setPathInfoList(newPathInfoList);
    onChange?.(newPathInfoList);
  };

  const handleElementChange = (index: number | null) => (value?: string) => {
    if (index === null) return;
    setEditPath(value ?? '');
  };

  const handleCloseClick = () => {
    setEditIndex(null);
    setEditPath(null);
    closeModal();
  };

  const handleModifyClick = () => {
    if (editIndex === null) return;
    const newPathInfoList = [...pathInfoList];
    newPathInfoList[editIndex].path = editPath || '';
    setPathInfoList(newPathInfoList);
    onChange?.(newPathInfoList);
    setEditIndex(null);
    setEditPath(null);
    closeModal();
  };

  useEffect(() => {
    if (values) {
      setPathInfoList(values);
    }
  }, [values]);

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
      {/* {editIndex !== null && (
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
      )} */}
      {editIndex !== null && (
        <Modal
          modalRef={modalRef}
          title="Modify Analysis Subject"
          icon={<ModifyModalIcon />}
          buttons={[
            <Button key="close" type="tertiary" onClick={handleCloseClick}>
              Close
            </Button>,
            <Button key="modify" type="primary" onClick={handleModifyClick}>
              Modify
            </Button>
          ]}
        >
          <TextInput
            fullWidth
            options={[
              {
                type: pathInfoList[editIndex]?.type,
                label: pathInfoList[editIndex]?.type === 'text' ? 'Github repo' : 'Local directory',
                value: 'fixed',
                placeholder: pathInfoList[editIndex]?.type === 'text' ? 'https://github/' : '~/'
              }
            ]}
            value={pathInfoList[editIndex]?.path}
            onChange={handleElementChange(editIndex)}
          />
        </Modal>
      )}
    </div>
  );
};

export default SourceSelector;
