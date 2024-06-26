import { FC, RefObject, MouseEvent } from 'react';
import Text from '../../atoms/text/Text';
import { FossLogo, AppCloseIcon } from '../../../components/atoms/SVGIcons';

interface IInfoModalProps {
  modalRef: RefObject<HTMLDialogElement>;
}

const InfoModal: FC<IInfoModalProps> = ({ modalRef }) => {
  const handleCloseModal = () => {
    modalRef.current?.close();
  };

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const url = e.currentTarget.href;
    window.open(url, '_blank');
  };

  const Header: FC = () => (
    <div className="flex items-center justify-between self-stretch border-b border-PaleGray-500 pb-2">
      <div className="flex items-center gap-1.5">
        <FossLogo />
        <Text type="p500-m" color="white" className="pl-0.5">
          FOSSLight
        </Text>
      </div>
      <button onClick={handleCloseModal}>
        <AppCloseIcon />
      </button>
    </div>
  );
  return (
    <dialog ref={modalRef} className="modal">
      <div className="fixed top-1/2 z-30 flex h-[280px] w-[400px] -translate-x-1/2 -translate-y-1/2 flex-col items-start justify-center gap-2.5 overflow-y-auto rounded-xl bg-PaleGray-900 px-5 pb-5 pt-4 shadow">
        <Header />
        <div className="flex flex-col gap-3 text-xs font-normal text-PaleGray-300">
          <div className="flex gap-1">
            <span>FOSSLight :</span>
            <a href="https://fosslight.org/" className="underline" onClick={handleLinkClick}>
              https://fosslight.org/
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <div>License:</div>
            <div>
              <a
                href="https://github.com/fosslight/fosslight_gui/blob/main/LICENSE"
                className="underline"
                onClick={handleLinkClick}
              >
                https://github.com/fosslight/fosslight_gui/blob/main/LICENSE
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div>Github:</div>
            <div>
              <a
                href="https://github.com/fosslight/fosslight_gui/"
                className="underline"
                onClick={handleLinkClick}
              >
                https://github.com/fosslight/fosslight_gui/
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div>Contributors:</div>
            <div>
              - LGE OSPO (
              <a
                href="https://github.com/orgs/fosslight/people/lge-opensource"
                className="underline"
                onClick={handleLinkClick}
              >
                https://github.com/orgs/fosslight/people/lge-opensource
              </a>
              )
            </div>
            <div> - Jinan Jeong, Seongjun Jo, Yujin Jo, Sooyeon Yeom @SNU</div>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default InfoModal;
