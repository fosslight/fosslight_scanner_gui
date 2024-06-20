import { FC } from 'react';
import Localchip from '../atoms/LocalChip';
import Githubchip from '../atoms/GithubChip';
import IconButton from '../atoms/button/IconButton';
import { FileDeleteIcon } from '../atoms/SVGIcons';
import { ITextInputOption } from '../organisms/TextInput';
import Text from '../atoms/text/Text';

interface ITokenBoxItemProps {
  type: ITextInputOption['type'];
  path: string;
  token: string;
  onRemoveClick: () => void;
}

const TokenBoxItem: FC<ITokenBoxItemProps> = ({ type: option, path, token, onRemoveClick }) => {
  return (
    <div className="flex h-9 w-full items-center justify-start gap-1.5 rounded-md bg-white p-1">
      {option === 'file' ? <Localchip /> : <Githubchip />}
      <div className="w-full overflow-hidden">
        <Text type="p50-r" color="PaleGray-900" className="truncate">
          {path}
        </Text>
        <Text type="p50-r" color="PaleGray-900" className="truncate">
          {token}
        </Text>
      </div>
      <IconButton onClick={onRemoveClick}>
        <FileDeleteIcon />
      </IconButton>
    </div>
  );
};
export default TokenBoxItem;
