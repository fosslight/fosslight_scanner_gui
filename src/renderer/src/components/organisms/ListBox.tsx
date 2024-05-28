import { FC } from 'react';
import ListBoxItem from '../molecules/ListBoxItem';

export type PathInfo = {
  option: string;
  path: string;
};

type ListBoxProps = {
  path_list: PathInfo[]; 
  onEditClick: (index: number) => void;
  onRemoveClick: (index: number) => void;
 children: any;
};

const ListBox: FC<ListBoxProps> = ({ children, path_list, onEditClick, onRemoveClick }) => {
  return (
    <div className="w-[346px] h-44 p-2 bg-white rounded-lg border border-PaleGray-300 flex flex-col justify-start items-start gap-0.5">
      <div className="self-stretch grow shrink basis-0 flex-col justify-center items-center gap-1.5 flex">
       {path_list.length === 0 ? (
       <div className=" text-center text-PaleGray-500 text-xs font-normal">{children}</div>
      ) : (
        path_list.map((path, index) => (
          <ListBoxItem
            option={path.option}
            path={path.path}
            onRemoveClick={() => onRemoveClick(index)}
            onEditClick={() => onEditClick(index)}
            key={index}
          />
        ))
      )}
    </div></div>
  );
};

export default ListBox;


