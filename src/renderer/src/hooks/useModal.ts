import { RefObject, useCallback, useEffect, useRef } from 'react';

interface IUseModal {
  openModal: () => void;
  closeModal: () => void;
  modalRef: RefObject<HTMLDialogElement>;
}

const useModal = (): IUseModal => {
  const modalRef = useRef<HTMLDialogElement>(null);

  const openModal = useCallback(() => {
    modalRef.current?.show();
  }, []);

  const closeModal = useCallback(() => {
    modalRef.current?.close();
  }, []);

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

  return { openModal, closeModal, modalRef };
};

export default useModal;
