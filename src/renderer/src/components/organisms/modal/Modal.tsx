import { FC, ReactNode, RefObject } from 'react';
import Text from '../../atoms/text/Text';

interface IModalProps {
  modalRef: RefObject<HTMLDialogElement>;
  icon?: string;
  title: string;
  content?: string;
  children?: ReactNode;
  buttons?: ReactNode[];
}

const Modal: FC<IModalProps> = ({ modalRef, icon, title, content, children, buttons }) => {
  const handleCloseModal = () => {
    modalRef.current?.close();
  };

  return (
    <dialog ref={modalRef}>
      <div className="fixed top-1/2 z-20 flex w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col gap-9 overflow-hidden rounded-xl bg-white px-7 py-6 shadow-2xl">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-[6px]">
            {icon && <img src={icon} alt="icon" className="h-6 w-6" />}
            <Text type="p500-m" color="PaleGray-900">
              {title}
            </Text>
          </div>
          {content && (
            <Text type="p300-r" color="PaleGray-700">
              {content}
            </Text>
          )}
        </div>
        {children}
        <div className="flex justify-end gap-[9px]">{buttons}</div>
      </div>
      <div className="fixed inset-0 z-10 bg-[#454E5D] bg-opacity-40" onClick={handleCloseModal} />
    </dialog>
  );
};

export default Modal;
