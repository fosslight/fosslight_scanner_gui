import { FC } from 'react';
import Chip from '../atoms/LocalChip';
import IconButton from '../atoms/button/IconButton'; 

interface IListBoxItemProps {
  title: string;
  onRemoveClick: () => void;
}

const ListBoxItem: FC<IListBoxItemProps> = ({ title, onRemoveClick }) => {
  return (
    <div className="flex items-center gap-2">
      <Chip title={title} />
      <IconButton onClick={onRemoveClick}>X</IconButton>
    </div>
  );
}
export default ListBoxItem;

