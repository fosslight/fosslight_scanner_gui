import { FC } from 'react';
import Localchip from '../atoms/LocalChip';
import Githubchip from '../atoms/GithubChip';
import IconButton from '../atoms/button/IconButton';
import { FileDeleteIcon, FileEditIcon } from '../atoms/SVGIcons';
import { ITextInputOption } from '../organisms/TextInput';
import Text from '../atoms/text/Text';
import useModal from '@renderer/hooks/useModal';
import ModifyModal from '../organisms/modal/ModifyModal';
import Button from '../atoms/button/Button';

interface IListBoxItemProps {
  option: ITextInputOption['type'];
  path: string;
  onEditClick: () => void;
  onRemoveClick: () => void;
}

const ListBoxItem: FC<IListBoxItemProps> = ({ option, path, onEditClick, onRemoveClick }) => {
  // console.log('option:', option);

  return (
    <div className="flex h-9 w-full items-center gap-1.5 rounded-md bg-white p-1">
      {option === 'file' ? <Localchip /> : <Githubchip />}
      <div className="min-w-0 flex-grow overflow-hidden">
        <Text type="p50-r" color="PaleGray-900" className="truncate">
          {path}
        </Text>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <IconButton onClick={onEditClick}>
          <FileEditIcon />
        </IconButton>
        <IconButton onClick={onRemoveClick}>
          <FileDeleteIcon />
        </IconButton>
      </div>
    </div>
  );
};
export default ListBoxItem;