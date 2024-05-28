import { FC } from 'react';
import Localchip from '../atoms/LocalChip';
import Githubchip from '../atoms/GithubChip';
import IconButton from '../atoms/button/IconButton';
import { FileDeleteIcon, FileEditIcon } from '../atoms/SVGIcons';
import { ITextInputOption } from '../organisms/TextInput';
import Text from '../atoms/text/Text';

interface IListBoxItemProps {
  option: ITextInputOption['type'];
  path: string;
  onEditClick: () => void;
  onRemoveClick: () => void;
}

const ListBoxItem: FC<IListBoxItemProps> = ({ option, path, onEditClick, onRemoveClick }) => {
  console.log('option:', option);
  return (
    <div className="flex h-9 w-full items-center justify-start gap-1.5 rounded-md bg-white p-1">
      {option === 'file' ? <Localchip /> : <Githubchip />}
      <div className="w-full overflow-hidden">
        <Text type="p50-r" color="PaleGray-900" className="truncate">
          {path}
        </Text>
      </div>
      <IconButton onClick={onEditClick}>
        <FileEditIcon />
      </IconButton>
      <IconButton onClick={onRemoveClick}>
        <FileDeleteIcon />
      </IconButton>
    </div>
  );
};
export default ListBoxItem;
