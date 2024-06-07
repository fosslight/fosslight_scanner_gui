import * as Path from 'path';

const commandParser = {
  parseCmd2Args: (command: Command): string[] => {
    const args: string[] = [];
    let config: CommandConfig;
    let mode: string;
    let path: string[];
    let link: string[] = [];
    let excludedPath: string = '';
    let extraOptions: string = '';

    if (command.type === 'analyze') {
      config = command.config as AnalyzeCommandConfig;
      mode =
        !config.mode || config.mode.includes('source' && 'binary' && 'dependency')
          ? 'all'
          : config.mode.join(' ');
      path = config.path ? config.path : ['undefined'];
      link = config.link ? config.link : [];
      excludedPath = config.excludedPath ? '-e ' + config.excludedPath.join(' ') : '';
      extraOptions = config.extraOptions ? config.extraOptions : '';
    } else {
      config = command.config as CompareCommandConfig;
      mode = 'compare';
      path = [config.reports.join(' ')];
    }

    const outputFormat: string = config.outputFormat ? '-f ' + config.outputFormat : '';
    const outputFileName: string = config.outputFileName ? config.outputFileName : '';
    let outputPath: string = config.outputPath ? config.outputPath : '';
    outputPath = '-o ' + Path.join(outputPath, outputFileName);

    // Must push the 'mode' first
    args.push(mode, outputFormat, outputPath);
    if (excludedPath) args.push(excludedPath);
    if (extraOptions) args.push(extraOptions);

    return args;
  },

  parseCmd2Setting: (args: string[], type: 'analyze' | 'compare'): Setting => {
    const setting: Setting = {
      path: '',
      link: '',
      dep_argument: '',
      output: '',
      exclude_path: [],
      format: '',
      db_url: '',
      timer: false,
      raw: false,
      core: -1,
      no_correction: false,
      correct_fpath: '',
      ui: false,
      type: 'analyze'
    };

    if (type === 'analyze') {
      setting.type = type;
      args.forEach((arg, _) => {
        if (arg.startsWith('-p')) {
          setting.path = arg.replace('-p ', '');
        } else if (arg === '-w') {
          setting.link = arg.replace('-w ', '');
        } else if (arg === '-o') {
          setting.output = arg.replace('-o ', '');
        } else if (arg === '-e') {
          setting.exclude_path = arg.replace('-e ', '').split(' ');
        } else if (arg === '-f') {
          setting.format = arg.replace('-f ', '');
        } else {
          if (arg.startsWith('-')) {
            // startsWith('-') is needed to avoid the 'mode' in args.
            if (arg.includes('"')) {
              // -d option is contained; Make sure the command does not contain double quotation(") except '-d' option.
              const extractedDepArgs = arg.split('"');
              setting.dep_argument = extractedDepArgs[1];
            }
            const splittedArgs = arg.split(' ');
            splittedArgs.forEach((splittedArg, index) => {
              if (splittedArg === '-r') {
                setting.raw = true;
              } else if (splittedArg === '-t') {
                setting.timer = true;
              } else if (splittedArg === '--ui') {
                setting.ui = true;
              } else if (splittedArg === '--no_correction') {
                setting.no_correction = true;
              } else if (splittedArg === '--correct_fpath') {
                setting.correct_fpath = splittedArgs[index + 1];
              } else if (splittedArg === '-u') {
                setting.db_url = splittedArgs[index + 1];
              } else if (splittedArg === '-c') {
                setting.core = parseInt(splittedArgs[index + 1]);
              }
            });
          }
        }
      });
    } else {
      setting.type = type;
      args.forEach((arg, _) => {
        // compare mode uses only three options.
        if (arg.startsWith('-p')) {
          setting.path = arg.replace('-p ', '');
        } else if (arg === '-o') {
          setting.output = arg.replace('-o ', '');
        } else if (arg === '-f') {
          setting.format = arg.replace('-f ', '');
        }
      });
    }

    return setting;
  }
};

export default commandParser;
