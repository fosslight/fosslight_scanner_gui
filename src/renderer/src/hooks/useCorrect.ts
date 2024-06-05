import { useState } from 'react';

const useCorrect = () => {
  const [correct, setCorrect] = useState<'correction' | 'no_correction'>('no_correction');

  return {
    correct,
    setCorrect
  };
};

export default useCorrect;
