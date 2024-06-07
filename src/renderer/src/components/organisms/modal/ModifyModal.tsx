import { FC, RefObject, useState, useEffect } from 'react';
import Text from '../../atoms/text/Text';
import Input from '../../atoms/input/Input';
import Dropdown, { IDropdownOption } from '../../molecules/dropdown/Dropdown';
import useFileUpload from '@renderer/hooks/useFileUpload';
import IconButton from '../../atoms/button/IconButton';
import FileUpload from '../../atoms/upload/FileUpload';
import Button from '../../atoms/button/Button';

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
  const [selectedOption, setSelectedOption] = useState<ITextInputOption>(options[0]);
  const [path, setPath] = useState<string | null>(value || null);

  console.log('rerender');

  useEffect(() => {
    if (options.length > 0) {
      setSelectedOption(options[0]);
    }
    setPath(value || null);
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

  return (
    <dialog ref={modalRef} open={isOpen}>
      <div className="fixed top-1/2 z-30 flex w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col gap-9 overflow-hidden rounded-xl bg-white px-7 py-6 shadow-2xl">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-[6px]">
            {icon && <img src={icon} alt="icon" className="h-6 w-6" />}
            <Text type="p500-m" color="PaleGray-900">
              {title}
            </Text>
          </div>

          {content && (
            <div className="flex w-full flex-col gap-3 px-[6px]">
              <div className="flex gap-2">
                <Dropdown
                  options={options}
                  onChange={handleDropdownChange}
                  value={selectedOption.value}
                />
              </div>
              {selectedOption.type === 'file' && (
                <div className="flex w-full items-center overflow-hidden px-[6px]">
                  <Text type="p100-r" color={`PaleGray-${path ? 1000 : 500}`} className="truncate">
                    {path || selectedOption.placeholder}
                  </Text>
                  <IconButton onClick={openFileUpload}>
                    <img
                      className="h-4 w-4"
                      src="/src/assets/icons/more-horizontal.svg"
                      alt="upload"
                    />
                  </IconButton>
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
        {/* {buttons && <div className="flex justify-end gap-[9px]">{buttons}</div>} */}

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
      <div className="fixed inset-0 z-20 bg-[#454E5D] bg-opacity-40" onClick={onClose} />
      <FileUpload fileUploadRef={fileUploadRef} onChange={handleFileChange} />
    </dialog>
  );
};

export default ModifyModal;
