import {FC} from 'react';

interface ITextprops{
  value: string;
}

const ListboxText: FC<ITextprops> = ({value}) => {
  return(<div className=" text-center text-PaleGray-500 text-xs font-normal"> {value} </div>);
}

export default ListboxText;

