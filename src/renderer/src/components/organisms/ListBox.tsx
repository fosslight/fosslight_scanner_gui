import { FC } from 'react';
import ListBoxItem from '../molecules/ListBoxItem';

export type PathInfo ={
  option: string;
  path: string;
}


type ListBoxProps = {
  path_list: PathInfo[]; // Replace 'any[]' with the appropriate type for 'path_list'
  onEditClick: (int) => void;
  onRemoveClick: (int) => void;
};

const ListBox: FC<ListBoxProps> = ({ path_list,onEditClick, onRemoveClick }) => {
  return (
    <div>
      {path_list.map((path, index) => (
        <ListBoxItem option={path.option} path={path.path} onRemoveClick={() => onRemoveClick(index)} onEditClick={() => onEditClick(index)} key={index} />
      ))}
    </div>
  );
};

export default ListBox;
