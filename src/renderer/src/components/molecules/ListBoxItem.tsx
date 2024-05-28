import { FC } from 'react';
import Localchip from '../atoms/LocalChip';
import Githubchip from '../atoms/GithubChip';
import IconButton from '../atoms/button/IconButton'; 
import { FileDeleteIcon, FileEditIcon } from '../atoms/SVGIcons';

interface IListBoxItemProps {
  option: string;
  path: string;
  onEditClick: () => void;
  onRemoveClick: () => void;
}

const ListBoxItem: FC<IListBoxItemProps> = ({ option, path, onEditClick, onRemoveClick }) => {
  console.log('option:', option);
  return (
    <div className="w-[330px] h-9 p-1 bg-white rounded-md justify-start items-center gap-1.5 inline-flex">
        {option === 'local' ? <Localchip /> : <Githubchip />}
      <div className="w-[204px] grow shrink basis-0 flex flex-col justify-center items-start gap-1.5 self-stretch text-PaleGray-900 text-[11px] font-normal">{path}</div>
      <IconButton onClick={onEditClick}><FileEditIcon/></IconButton>
      <IconButton onClick={onRemoveClick}><FileDeleteIcon/></IconButton>
    </div>
  );
}
export default ListBoxItem;


