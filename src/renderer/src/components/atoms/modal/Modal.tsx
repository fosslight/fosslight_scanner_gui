import useClickOutside from '@renderer/hooks/useClickOutside';
import { FC, ReactNode, RefObject, useEffect, useRef } from 'react';

interface IModalProps {
  modalRef: RefObject<HTMLDialogElement>;
  icon?: string;
  title: string;
  content?: string;
  children?: ReactNode;
  buttons?: ReactNode;
}

const Modal: FC<IModalProps> = ({ modalRef, icon, title, content, children, buttons }) => {
  const handleCloseModal = () => {
    modalRef.current?.close();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modalRef.current?.close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalRef]);

  return (
    <>
      <dialog className="fixed inset-0" ref={modalRef}>
        <div className="relative z-20 w-[560px] flex-col rounded-3xl bg-white px-7 py-6 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {icon && <img src={icon} alt="icon" className="h-6 w-6" />}
              <h2 className="ml-3 text-lg font-bold">{title}</h2>
            </div>
          </div>
          {content && <p className="text-gray-500 mt-3 text-sm">{content}</p>}
          {children}
          {buttons}
        </div>
        <div
          className="bg-gray fixed inset-0 z-10 bg-[#454E5D] bg-opacity-40"
          onClick={handleCloseModal}
        />
      </dialog>
    </>
  );
};

export default Modal;
