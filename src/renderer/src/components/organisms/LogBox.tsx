import { FC } from 'react';

const LogBox: FC = () => {
  return (
    <div className="h-full w-full bg-PaleGray-1000 py-6 pl-4 pr-6">
      <p className="text-sm text-PaleGray-500">{'> No analysis is currently being conducted.'}</p>
    </div>
  );
};

export default LogBox;
