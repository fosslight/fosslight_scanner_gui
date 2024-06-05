import { FC } from 'react';
import SideBarTab from '../atoms/SideBarTab';

interface ISideBarProps {
  activeTab: 'scanner' | 'token';
  onChangeTab: (tab: 'scanner' | 'token') => void;
}

const SideBar: FC<ISideBarProps> = ({ activeTab, onChangeTab }) => {
  return (
    <div className="flex h-full w-[160px] flex-col gap-3 border-r border-r-PaleGray-300 bg-PaleGray-50 p-3">
      <SideBarTab
        menu="Scanner Option"
        isActive={activeTab === 'scanner'}
        onClick={() => onChangeTab('scanner')}
      />
      <SideBarTab
        menu="Private Token"
        isActive={activeTab === 'token'}
        onClick={() => onChangeTab('token')}
      />
    </div>
  );
};

export default SideBar;
