import { FC } from 'react';
import { ModeScanIcon } from '../SVGIcons';
import { ModeCompareIcon } from '../SVGIcons';

interface IToggleProps {
  type?: 'default' | 'for-mode';
  toggled?: boolean;
  onToggle?: (toggled: boolean) => void;
}

const Toggle: FC<IToggleProps> = ({ type = 'default', toggled = false, onToggle }) => {
  const handleClick = () => {
    onToggle?.(!toggled);
  };

  return (
    <button
      className={`flex h-[32px] w-[54px] rounded-full p-[2px] ${toggled ? 'justify-end bg-LGRed-600' : 'justify-start bg-PaleGray-300'}`}
      onClick={handleClick}
    >
      <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white">
        {type === 'for-mode' && <>{toggled ? <ModeCompareIcon /> : <ModeScanIcon />}</>}
      </div>
    </button>
  );
};
export default Toggle;
