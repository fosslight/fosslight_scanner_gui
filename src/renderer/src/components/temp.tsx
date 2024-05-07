import { FC, useState } from 'react';
import Button from './atoms/Button';
import IconButton from './atoms/IconButton';
import ModeToggle from './atoms/ModeToggle';
import Toggle from './atoms/Toggle';
import EditButton from './atoms/EditButton';
import DeleteButton from './atoms/DeleteButton';

const COMPARE = true;
const SCAN = false;

export const Page: FC = () => {
  const [mode, setMode] = useState(COMPARE);

  return (
    <div className="w-screen h-screen bg-white">
      <HeaderSection />
      {/* {mode === Mode.compare ? <CompareModeSection setMode={setMode} /> : <ScanModeSection />} */}
      <Button title="click meeeeeeeeeeeeeee" className="button-main" />
      <Button title="click meeeeeeeeeeeeeee" className="button-sub-color" />
      <Button title="click meeeeeeeeeeeeeee" className="button-sub-gray" />
      <IconButton />
      <EditButton />
      <DeleteButton />

      <OuptputSection />
      <ModeToggle toggled={mode} setToggled={setMode} />
      <Toggle toggled={mode} setToggled={setMode} />
    </div>
  );
};

const HeaderSection: FC = () => {
  return (
    <div>
      <h1>Header</h1>
    </div>
  );
};
interface IModeSection {
  setMode?: (mode: Mode) => void;
}
const CompareModeSection: FC<IModeSection> = ({ setMode, ...props }) => {
  const handleClick = () => {
    setMode!(Mode.scan);
    console.log('clicked');
  };

  return (
    <div>
      <button className="bg-Blue-500 text-Red-800" onClick={handleClick}>
        toggle
      </button>

      <h1 className="bg-Blue-500">CompareMode</h1>
    </div>
  );
};

const ScanModeSection: FC = () => {
  return (
    <div>
      <h1>ScanMode</h1>
    </div>
  );
};

const OuptputSection: FC = () => {
  return (
    <div>
      <h1>Output</h1>
    </div>
  );
};

export default Page;
