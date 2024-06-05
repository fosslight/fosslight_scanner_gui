import os
import sys
import shutil
import platform
import subprocess
from datetime import datetime


def copy_folder(src, dst):
    try:
        shutil.copytree(src, dst, dirs_exist_ok=True)
    except Exception as e:
        print(f"Copy venv failed: {e}")
        exit(1)


def main():
    args = sys.argv[1:]  # args should be from GUI, describing the app path.
    start_time = datetime.now().strftime('%y%m%d_%H%M')
    cur_path = os.path.dirname(sys.executable)
    # sys._MEIPASS: User's system AppData path; only available this '_MEIPASS' attribute when running in exe.
    src_venv_path = os.path.join(sys._MEIPASS, 'venv')  # bundled venv path.
    temp_venv_path = os.path.join(cur_path, f'temp_venv_{start_time}')  # copied venv path, will be deleted after running.
    temp_venv_python = ''
    venv_path = os.path.join(os.path.dirname(sys.executable), 'venv')  # final venv path for the scanner.
    venv_python = ''

    # Copy the bundled venv when GUI sends arguments.
    if args:
        copy_folder(src_venv_path, temp_venv_path)

        if (platform.system() == 'Windows'):
            temp_venv_python = os.path.join(temp_venv_path, 'Scripts', 'python')
        else:
            temp_venv_python = os.path.join(temp_venv_path, 'bin', 'python')

        # Must create a new venv because the copied venv's environment is set to the bundled venv, which will be deleted after running.
        try:
            subprocess.check_call(temp_venv_python + ' -m venv ' + venv_path, shell=True)
        except Exception as e:
            print(f"Create venv failed: {e}")
            exit(1)

        try:
            shutil.rmtree(temp_venv_path)
        except Exception as e:
            print(f"Remove copied venv failed: {e}")

    if (platform.system() == 'Windows'):
        venv_python = os.path.join(venv_path, 'Scripts', 'python')
    else:
        venv_python = os.path.join(venv_path, 'bin', 'python')

    try:  # Always install fosslight_scanner, for update version.
        subprocess.check_call(venv_python + ' -m pip install --upgrade pip', shell=True)
        subprocess.check_call(venv_python + ' -m pip install fosslight_scanner', shell=True)
    except Exception as e:
        print(f"Install fosslight_scanner failed: {e}")
        exit(1)


if __name__ == '__main__':
    main()
