import { FC, useEffect, useState } from 'react';

const Spinner: FC = () => {
  const spinnerElements = ['-90', '-135', '180', '135', '90', '45', '0', '-45'];
  const spinRate = 0.1; // seconds
  const [currIndex, setCurrIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrIndex((prevIndex) => (prevIndex + 1) % spinnerElements.length);
    }, spinRate * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <img
      className="flex h-4 w-4 items-center justify-center"
      src={`/src/assets/icons/angles/angle=${spinnerElements[currIndex]}.svg`}
      alt="spinner"
    />
  );
};

export default Spinner;
