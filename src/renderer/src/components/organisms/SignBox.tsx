import { FC } from 'react';

const SignBox: FC = () => {
  return (
    <div className="h-full w-full border border-PaleGray-200 bg-PaleGray-50 py-6 pl-4 pr-6">
      <p className="text-sm text-PaleGray-500">{'No analysis is currently being conducted.'}</p>
    </div>
  );
};

export default SignBox;
