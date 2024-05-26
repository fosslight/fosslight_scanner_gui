import { FC, useState } from 'react';
import { ModeScanIcon } from '../SVGIcons';
import { ModeCompareIcon } from '../SVGIcons';

interface IToggleProps {
  type?: 'default' | 'for-mode';
  isToggled?: boolean;
  onToggle?: (isToggled: boolean) => void;
}

const Toggle: FC<IToggleProps> = ({ type = 'default', isToggled = false, onToggle }) => {
  const [toggled, setToggled] = useState<boolean>(isToggled);

  const handleToggleClick = () => {
    setToggled(!toggled);
    onToggle && onToggle(!toggled);
  };

  return (
    <button
      className={`flex h-[32px] w-[54px] rounded-full p-[2px] ${toggled ? 'justify-end bg-LGRed-600' : 'justify-start bg-PaleGray-300'}`}
      onClick={handleToggleClick}
    >
      <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-PaleGray-100">
        {type === 'for-mode' && <>{toggled ? <ModeCompareIcon /> : <ModeScanIcon />}</>}
      </div>
    </button>
  );
};

export default Toggle;
