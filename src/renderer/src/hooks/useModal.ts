import { RefObject, useCallback, useState, useEffect, useRef } from 'react';

interface IUseModal {
  openModal: (type: string) => void;
  closeModal: () => void;
  modalRef: RefObject<HTMLDialogElement>;
  modalType: string | null;
}

const useModal = (): IUseModal => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [modalType, setModalType] = useState<string | null>(null);

  const openModal = useCallback((type: string) => {
    setModalType(type);
    modalRef.current?.showModal();
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
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
  }, []);

  return { openModal, closeModal, modalRef, modalType };
};

export default useModal;
