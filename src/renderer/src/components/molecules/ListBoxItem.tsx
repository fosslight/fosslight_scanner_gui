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
    <div className="flex items-center gap-2">
      {option == 'local' ? <Localchip /> : <Githubchip />}
      <div className="self-stretch text-[11px] font-normal">{path}</div>
      <IconButton onClick={onEditClick}>e</IconButton>
      <IconButton onClick={onRemoveClick}>d</IconButton>
    </div>
  );
}
export default ListBoxItem;

