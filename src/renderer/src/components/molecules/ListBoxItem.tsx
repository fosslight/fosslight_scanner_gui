import { FC } from 'react';
import Localchip from '../atoms/LocalChip';
import Githubchip from '../atoms/GithubChip';
import IconButton from '../atoms/button/IconButton'; 

interface IListBoxItemProps {
  option: string;
  path: string;
  onEditClick: () => void;
  onRemoveClick: () => void;
}

const ListBoxItem: FC<IListBoxItemProps> = ({ option, path, onEditClick, onRemoveClick }) => {
  return (
    <div className="w-[330px] h-9 p-1 bg-white rounded-md justify-start items-center gap-1.5 inline-flex">
      {option == 'local' ? <Localchip /> : <Githubchip />}
      <div className="w-[204px] grow shrink basis-0 flex flex-col justify-center items-start gap-1.5 self-stretch text-PaleGray-900 text-[11px] font-normal">{path}</div>
      <IconButton onClick={onEditClick}>e</IconButton>
      <IconButton onClick={onRemoveClick}>d</IconButton>
    </div>
  );
}
export default ListBoxItem;


<div className="w-[330px] h-9 p-1 bg-white rounded-md justify-start items-center gap-1.5 inline-flex">
<div className="h-[22px] p-1 bg-emerald-50 rounded-md justify-center items-center gap-2.5 flex">
<div className="text-teal-600 text-[11px] font-normal font-['Spoqa Han Sans Neo']">Tag</div>
</div>
<div className="w-[204px] grow shrink basis-0 flex-col justify-center items-start gap-1.5 inline-flex">
<div className="self-stretch text-zinc-700 text-[11px] font-normal font-['Spoqa Han Sans Neo']">Path</div>
</div>
<div className="w-7 h-7 bg-gray-100 rounded-md justify-center items-center flex">
<div className="w-4 h-4 relative" />
</div>
<div className="w-7 h-7 bg-gray-100 rounded-md justify-center items-center flex">
<div className="w-4 h-4 relative" />
</div>
</div>