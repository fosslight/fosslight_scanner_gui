import { FC, RefObject } from 'react';
import Text from '../../atoms/text/Text';
import { FossLogo } from '../../../components/atoms/SVGIcons';

interface IInfoModalProps {
  modalRef: RefObject<HTMLDialogElement>;
}

const InfoModal: FC<IInfoModalProps> = ({ modalRef }) => {
  const handleCloseModal = () => {
    modalRef.current?.close();
  };

  const Header: FC = () => (
    <div className="flex items-center justify-between self-stretch border-b border-PaleGray-500 pb-3">
      <div className="flex items-center gap-2.5">
        <FossLogo />
        <Text type="p500-m" color="white">
          FOSSLight
        </Text>
      </div>
      <button onClick={handleCloseModal}>
        <img className="h-5 w-5" src="/src/assets/icons/x-small.svg" alt="close" />
      </button>
    </div>
  );
  return (
    <dialog ref={modalRef}>
      <div className="fixed top-1/2 z-30 flex h-[280px] w-[410px] -translate-x-1/2 -translate-y-1/2 flex-col items-start justify-center gap-2.5 overflow-y-auto whitespace-normal break-words rounded-xl bg-PaleGray-900 px-5 pb-5 pt-3 shadow">
        <Header />
        <div className="flex flex-col gap-3 text-xs font-normal text-PaleGray-300">
          <div className="flex gap-1">
            <span>FOSSLight :</span>
            <a href="https://fosslight.org/" className="underline">
              https://fosslight.org/
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <div>License:</div>
            <div>
              <a
                href="https://github.com/fosslight/fosslight_gui/blob/main/LICENSE"
                className="underline"
              >
                https://github.com/fosslight/fosslight_gui/blob/main/LICENSE
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div>Github:</div>
            <div>
              <a href="https://github.com/fosslight/fosslight_gui/" className="underline">
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
              >
                https://github.com/orgs/fosslight/people/lge-opensource
              </a>
              )
            </div>
            <div> - Yujin Jo, Jinan Jeong, Seongjun Jo, Sooyeon Yeom @SNU</div>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default InfoModal;
