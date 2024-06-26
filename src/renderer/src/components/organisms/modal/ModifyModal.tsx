import { FC, RefObject, useState, useEffect } from 'react';
import Text from '../../atoms/text/Text';
import Input from '../../atoms/input/Input';
import Dropdown, { IDropdownOption } from '../../molecules/dropdown/Dropdown';
import useFileUpload from '@renderer/hooks/useFileUpload';
import IconButton from '../../atoms/button/IconButton';
import FileUpload from '../../atoms/upload/FileUpload';
import Button from '../../atoms/button/Button';
import ModalIcon from '@renderer/components/atoms/ModalIcon';
import { ModifyModalIcon, BrowseIcon } from '@renderer/components/atoms/SVGIcons';

interface ITextInputOption extends IDropdownOption {
  type: 'text' | 'file';
  placeholder?: string;
}

interface IModalProps {
  modalRef: RefObject<HTMLDialogElement>;
  isOpen: boolean;
  icon?: string;
  title: string;
  content?: string;
  options: ITextInputOption[];
  value?: string;
  onChange?: (value: string | null, type?: ITextInputOption['type']) => void;
  onClose: () => void;
}

const ModifyModal: FC<IModalProps> = ({
  modalRef,
  isOpen,
  icon,
  title,
  content,
  options,
  value,
  onChange,
  onClose
}) => {
  const { openFileUpload, fileUploadRef } = useFileUpload();

  const determineInitialOption = (): ITextInputOption => {
    if (value && options.some((option) => option.type === 'file' && value.includes('\\'))) {
      return options.find((option) => option.type === 'file') || options[0];
    }
    return options.find((option) => option.type === 'text') || options[0];
  };

  const [selectedOption, setSelectedOption] = useState<ITextInputOption>(determineInitialOption());
  const [path, setPath] = useState<string | null>(value || null);

  useEffect(() => {
    if (isOpen) {
      setSelectedOption(determineInitialOption());
      setPath(value || null);
    }
  }, [options, value, isOpen]);

  const handleDropdownChange = (value: string) => {
    const selected = options.find((option) => option.value === value) || options[0];
    setSelectedOption(selected);
    onChange?.(null, selected.type);
  };

  const handleInputChange = (inputValue: string) => {
    setPath(inputValue);
  };

  const handleModifyClick = () => {
    onChange?.(path, selectedOption.type);
    onClose();
  };

  const handleFileChange = (files: File[]) => {
    setPath(files[0].path);
  };

  const fileOptions = options.filter((option) => option.type === 'file');
  const textOptions = options.filter((option) => option.type === 'text');

  return (
    <dialog ref={modalRef} open={isOpen}>
      <div className="fixed top-1/2 z-30 flex w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col gap-9 overflow-hidden rounded-xl bg-white px-7 py-6 shadow-2xl">
        <div className="flex flex-col gap-9">
          <div className="flex items-center gap-2">
            <ModalIcon>
              <ModifyModalIcon />
            </ModalIcon>
            <Text type="p500-m" color="PaleGray-900">
              {title}
            </Text>
          </div>

          {content && (
            <div className="flex h-9 w-[504px] items-center rounded-lg border border-PaleGray-300 bg-white px-1">
              <div className="flex gap-2">
                <Dropdown
                  options={selectedOption.type === 'file' ? fileOptions : textOptions}
                  onChange={handleDropdownChange}
                  value={selectedOption.value}
                />
              </div>
              <div className="h-[16px] w-[1px] bg-PaleGray-400" />
              {selectedOption.type === 'file' && (
                <div className="flex w-full items-center overflow-hidden px-[6px]">
                  <div className="min-w-0 flex-grow overflow-hidden">
                    <Text
                      type="p100-r"
                      color={`PaleGray-${path ? 1000 : 500}`}
                      className="truncate"
                    >
                      {path || selectedOption.placeholder}
                    </Text>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <IconButton onClick={openFileUpload}>
                      <BrowseIcon />
                    </IconButton>
                  </div>
                </div>
              )}
              {selectedOption.type === 'text' && (
                <div className="flex w-full items-center px-[6px]">
                  <Input
                    placeholder={selectedOption.placeholder}
                    value={path ?? ''}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        {/* buttons */}
        <div className="flex justify-end gap-[9px]">
          <Button key="close" type="tertiary" onClick={onClose}>
            Close
          </Button>
          ,
          <Button key="modify" type="primary" onClick={handleModifyClick}>
            Modify
          </Button>
        </div>
      </div>
      <FileUpload fileUploadRef={fileUploadRef} onChange={handleFileChange} />
    </dialog>
  );
};

export default ModifyModal;
