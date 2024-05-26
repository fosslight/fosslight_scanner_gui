import { FC, ReactNode } from 'react';

interface ITextProps {
  type: TextType;
  color?: ColorType;
  inner?: boolean;
  className?: string;
  children: ReactNode;
}

const Text: FC<ITextProps> = ({
  type,
  color,
  inner = false,
  className: inputClassName,
  children
}) => {
  const [size, weight] = type.split('-');
  const className = `${sizeClass[size]} ${weightClass[weight]} ${colorClass[color!]} ${inputClassName}`;
  const props = { className, children };

  if (inner) return <span {...props} />;
  if (size[0] === 'p') return <p {...props} />;
  if (size === 'h700') return <h4 {...props} />;
  if (size === 'h800') return <h3 {...props} />;
  if (size === 'h900') return <h2 {...props} />;
  if (size === 'h1000') return <h1 {...props} />;
  throw new Error('Invalid text type');
};

export default Text;

type TextType =
  | 'p50-r'
  | 'p50-m'
  | 'p50-b'
  | 'p100-r'
  | 'p100-m'
  | 'p100-b'
  | 'p200-r'
  | 'p200-m'
  | 'p200-b'
  | 'p300-r'
  | 'p300-m'
  | 'p300-b'
  | 'p400-r'
  | 'p400-m'
  | 'p400-b'
  | 'p500-r'
  | 'p500-m'
  | 'p500-b'
  | 'p600-r'
  | 'p600-m'
  | 'p600-b'
  | 'h700-r'
  | 'h700-m'
  | 'h700-b'
  | 'h800-r'
  | 'h800-m'
  | 'h800-b'
  | 'h900-r'
  | 'h900-m'
  | 'h900-b'
  | 'h1000-r'
  | 'h1000-m'
  | 'h1000-b';

type ColorType =
  | 'transparent'
  | 'white'
  | 'black'
  | 'LGRed-100'
  | 'LGRed-200'
  | 'LGRed-300'
  | 'LGRed-400'
  | 'LGRed-500'
  | 'LGRed-600'
  | 'LGRed-700'
  | 'LGRed-800'
  | 'LGRed-900'
  | 'LGRed-1000'
  | 'LGGray-100'
  | 'LGGray-200'
  | 'LGGray-300'
  | 'LGGray-400'
  | 'LGGray-500'
  | 'LGGray-600'
  | 'LGGray-700'
  | 'LGGray-800'
  | 'LGGray-900'
  | 'LGGray-1000'
  | 'PaleGray-50'
  | 'PaleGray-100'
  | 'PaleGray-200'
  | 'PaleGray-300'
  | 'PaleGray-400'
  | 'PaleGray-500'
  | 'PaleGray-600'
  | 'PaleGray-700'
  | 'PaleGray-800'
  | 'PaleGray-900'
  | 'PaleGray-1000'
  | 'Red-100'
  | 'Red-200'
  | 'Red-300'
  | 'Red-400'
  | 'Red-500'
  | 'Red-600'
  | 'Red-700'
  | 'Red-800'
  | 'Red-900'
  | 'Red-1000'
  | 'Yellow-100'
  | 'Yellow-200'
  | 'Yellow-300'
  | 'Yellow-400'
  | 'Yellow-500'
  | 'Yellow-600'
  | 'Yellow-700'
  | 'Yellow-800'
  | 'Yellow-900'
  | 'Yellow-1000'
  | 'Teal-100'
  | 'Teal-200'
  | 'Teal-300'
  | 'Teal-400'
  | 'Teal-500'
  | 'Teal-600'
  | 'Teal-700'
  | 'Teal-800'
  | 'Teal-900'
  | 'Teal-1000'
  | 'Blue-100'
  | 'Blue-200'
  | 'Blue-300'
  | 'Blue-400'
  | 'Blue-500'
  | 'Blue-600'
  | 'Blue-700'
  | 'Blue-800'
  | 'Blue-900'
  | 'Blue-1000'
  | 'Purple-100'
  | 'Purple-200'
  | 'Purple-300'
  | 'Purple-400'
  | 'Purple-500'
  | 'Purple-600'
  | 'Purple-700'
  | 'Purple-800'
  | 'Purple-900'
  | 'Purple-1000';

// Since tailwindcss does not support dynamic class names, we need to define the class names manually.
const sizeClass = {
  p50: 'text-[11px]',
  p100: 'text-[12px]',
  p200: 'text-[13px]',
  p300: 'text-[15px]',
  p400: 'text-[17px]',
  p500: 'text-[20px]',
  p600: 'text-[24px]',
  h700: 'text-[32px]',
  h800: 'text-[40px]',
  h900: 'text-[60px]',
  h1000: 'text-[76px]'
};

const weightClass = {
  r: 'font-normal',
  m: 'font-medium',
  b: 'font-bold'
};

const colorClass = {
  transparent: 'text-transparent',
  white: 'text-white',
  black: 'text-black',
  'LGRed-100': 'text-LGRed-100',
  'LGRed-200': 'text-LGRed-200',
  'LGRed-300': 'text-LGRed-300',
  'LGRed-400': 'text-LGRed-400',
  'LGRed-500': 'text-LGRed-500',
  'LGRed-600': 'text-LGRed-600',
  'LGRed-700': 'text-LGRed-700',
  'LGRed-800': 'text-LGRed-800',
  'LGRed-900': 'text-LGRed-900',
  'LGRed-1000': 'text-LGRed-1000',
  'LGGray-100': 'text-LGGray-100',
  'LGGray-200': 'text-LGGray-200',
  'LGGray-300': 'text-LGGray-300',
  'LGGray-400': 'text-LGGray-400',
  'LGGray-500': 'text-LGGray-500',
  'LGGray-600': 'text-LGGray-600',
  'LGGray-700': 'text-LGGray-700',
  'LGGray-800': 'text-LGGray-800',
  'LGGray-900': 'text-LGGray-900',
  'LGGray-1000': 'text-LGGray-1000',
  'PaleGray-50': 'text-PaleGray-50',
  'PaleGray-100': 'text-PaleGray-100',
  'PaleGray-200': 'text-PaleGray-200',
  'PaleGray-300': 'text-PaleGray-300',
  'PaleGray-400': 'text-PaleGray-400',
  'PaleGray-500': 'text-PaleGray-500',
  'PaleGray-600': 'text-PaleGray-600',
  'PaleGray-700': 'text-PaleGray-700',
  'PaleGray-800': 'text-PaleGray-800',
  'PaleGray-900': 'text-PaleGray-900',
  'PaleGray-1000': 'text-PaleGray-1000',
  'Red-100': 'text-Red-100',
  'Red-200': 'text-Red-200',
  'Red-300': 'text-Red-300',
  'Red-400': 'text-Red-400',
  'Red-500': 'text-Red-500',
  'Red-600': 'text-Red-600',
  'Red-700': 'text-Red-700',
  'Red-800': 'text-Red-800',
  'Red-900': 'text-Red-900',
  'Red-1000': 'text-Red-1000',
  'Yellow-100': 'text-Yellow-100',
  'Yellow-200': 'text-Yellow-200',
  'Yellow-300': 'text-Yellow-300',
  'Yellow-400': 'text-Yellow-400',
  'Yellow-500': 'text-Yellow-500',
  'Yellow-600': 'text-Yellow-600',
  'Yellow-700': 'text-Yellow-700',
  'Yellow-800': 'text-Yellow-800',
  'Yellow-900': 'text-Yellow-900',
  'Yellow-1000': 'text-Yellow-1000',
  'Teal-100': 'text-Teal-100',
  'Teal-200': 'text-Teal-200',
  'Teal-300': 'text-Teal-300',
  'Teal-400': 'text-Teal-400',
  'Teal-500': 'text-Teal-500',
  'Teal-600': 'text-Teal-600',
  'Teal-700': 'text-Teal-700',
  'Teal-800': 'text-Teal-800',
  'Teal-900': 'text-Teal-900',
  'Teal-1000': 'text-Teal-1000',
  'Blue-100': 'text-Blue-100',
  'Blue-200': 'text-Blue-200',
  'Blue-300': 'text-Blue-300',
  'Blue-400': 'text-Blue-400',
  'Blue-500': 'text-Blue-500',
  'Blue-600': 'text-Blue-600',
  'Blue-700': 'text-Blue-700',
  'Blue-800': 'text-Blue-800',
  'Blue-900': 'text-Blue-900',
  'Blue-1000': 'text-Blue-1000',
  'Purple-100': 'text-Purple-100',
  'Purple-200': 'text-Purple-200',
  'Purple-300': 'text-Purple-300',
  'Purple-400': 'text-Purple-400',
  'Purple-500': 'text-Purple-500',
  'Purple-600': 'text-Purple-600',
  'Purple-700': 'text-Purple-700',
  'Purple-800': 'text-Purple-800',
  'Purple-900': 'text-Purple-900',
  'Purple-1000': 'text-Purple-1000'
};
