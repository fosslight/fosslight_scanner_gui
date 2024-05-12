import { RefObject, useCallback, useRef, useState } from 'react';
import useClickOutside from './useClickOutside';

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

  return { openModal, closeModal, modalRef };
};

export default useModal;
