import { FC, RefObject } from 'react';

interface IModalProps {
  modalRef: RefObject<HTMLDialogElement>;
}

const SettingModal: FC<IModalProps> = ({ modalRef }) => {
  const handleCloseModal = () => {
    modalRef.current?.close();
  };

  return (
    <dialog ref={modalRef}>
      <div className="fixed top-1/2 z-20 flex h-[540px] w-[960px] -translate-x-1/2 -translate-y-1/2 flex-col gap-9 overflow-hidden rounded-3xl bg-white px-7 py-6 shadow">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-[6px]"></div>
        </div>
      </div>
      <div className="fixed inset-0 z-10 bg-[#454E5D] bg-opacity-40" onClick={handleCloseModal} />
    </dialog>
  );
};

export default SettingModal;
