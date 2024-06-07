import os
import sys
import platform
import subprocess


def main():
    args = sys.argv[1:]
    scan_cmd = 'fosslight ' + ' '.join(args)
    venv_path = os.path.join(os.path.dirname(sys.executable), 'venv')
    activate_path = ''
    deactivate_path = ''

    if (platform.system() == 'Windows'):
        activate_path = os.path.join(venv_path, 'Scripts', 'activate')
        deactivate_path = os.path.join(venv_path, 'Scripts', 'deactivate')
    else:
        activate_path = os.path.join(venv_path, 'bin', 'activate')
        deactivate_path = os.path.join(venv_path, 'bin', 'deactivate')

    cmd_list = [activate_path, scan_cmd, deactivate_path]
    cmd = "&&".join(cmd_list)
    process = subprocess.Popen(cmd, shell=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    while process.poll() is None:
        log = process.stdout.readline()
        print(log, end='')


if __name__ == '__main__':
    main()
