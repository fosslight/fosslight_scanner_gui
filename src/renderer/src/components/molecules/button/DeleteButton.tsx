import React, { FC } from 'react';
import { FileDeleteIcon } from '@renderer/components/atoms/SVGIcons';
import IconButton from '@renderer/components/atoms/button/IconButton';

interface IDeletButtonProps {
  onClick: () => void;
}

const DeleteButton: FC<IDeletButtonProps> = ({ onClick }) => {
  return (
    <IconButton onClick={onClick}>
      <FileDeleteIcon />
    </IconButton>
  );
};

export default DeleteButton;
