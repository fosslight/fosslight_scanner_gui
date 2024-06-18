import { FC, ReactNode, RefObject } from 'react';
import Text from '../../atoms/text/Text';
import ModalIcon from '../../atoms/ModalIcon';

interface IModalProps {
  modalRef: RefObject<HTMLDialogElement>;
  title: string;
  icon?: ReactNode;
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
      <div className="fixed top-1/2 z-30 flex w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col gap-9 overflow-hidden rounded-xl bg-white px-7 py-6 shadow-2xl">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ModalIcon>{icon}</ModalIcon>
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
        <div className="w-full">{children}</div>
        <div className="flex justify-end gap-[9px]">{buttons}</div>
      </div>
      <div className="fixed inset-0 z-20 bg-[#454E5D] bg-opacity-40" onClick={handleCloseModal} />
    </dialog>
  );
};

export default Modal;
