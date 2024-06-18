import * as Path from 'path';

const commandParser = {
  parseCmd2Args: (command: Command): string[][] => {
    // format example: args[0] = modes, args[1] = paths, args[2] = links,
    //                 args[3] = other options, args[4] = output dir & file, args[5] = excluded paths
    const args: string[][] = [[], [], [], [], [], []];
    let config: CommandConfig;
    let mode: string;
    let path: string[] = [];
    const link: string[] = [];
    let excludedPath: string = '';
    const excludedPathArray: string[] = [];
    let extraOptions: string = '';

    if (command.type === 'analyze') {
      const analConfig = command.config as AnalyzeCommandConfig;
      mode =
        !analConfig.mode ||
        analConfig.mode.length === 0 ||
        (analConfig.mode.includes('source') &&
          analConfig.mode.includes('binary') &&
          analConfig.mode.includes('dependency'))
          ? 'all'
          : analConfig.mode.join(' ');
      if (analConfig.subjects) {
        for (const sub of analConfig.subjects) {
          sub.type === 'dir' ? path.push(sub.path) : link.push(sub.path);
        }
      }
      if (analConfig.exclusions) {
        for (const exclusion of analConfig.exclusions) {
          excludedPath = exclusion.path + ' ' + excludedPath;
          excludedPathArray.push(exclusion.path);
        }
        excludedPath = '-e ' + excludedPath;
      }
      extraOptions = analConfig.extraOptions ?? '';
      config = analConfig;
    } else {
      const comConfig = command.config as CompareCommandConfig;
      mode = 'compare';
      path = [comConfig.reports!.join(' ')];
      config = comConfig;
    }

    const outputFormat: string = config.outputFormat ? '-f ' + config.outputFormat : '';
    const outputFileName: string = config.outputFileName ?? '';
    const outputPath: string = config.outputPath ?? '';
    let output = Path.join(outputPath, outputFileName);
    output = output ? '-o ' + output : '';

    args[0].push(mode);
    if (path.length > 0) args[1] = Array.from(path);
    if (link.length > 0) args[2] = Array.from(link);
    args[3].push(outputFormat, output, excludedPath, extraOptions);
    args[4].push(outputPath, outputFileName);
    args[5] = Array.from(excludedPathArray);

    return args;
  },

  parseCmd2Setting: (args: string[][], type: 'analyze' | 'compare'): Setting => {
    const setting: Setting = {
      path: [],
      link: [],
      dep_argument: '',
      outputDir: '',
      outputFile: '',
      exclude_path: [],
      format: '',
      db_url: '',
      timer: false,
      raw: false,
      core: -1,
      no_correction: false,
      correct_fpath: '',
      ui: false,
      type: type
    };
    const paths = args[1];
    const links = args[2];
    const otherOptions = args[3];
    setting.path = paths[0] === 'undefined' ? [] : Array.from(paths);
    setting.link = links.length > 0 ? Array.from(links) : [];
    setting.outputDir = args[4][0];
    setting.outputFile = args[4][1];
    setting.exclude_path = args[5];

    if (type === 'analyze') {
      otherOptions.forEach((opt, _) => {
        if (opt.startsWith('-f')) {
          setting.format = opt.replace('-f ', '');
        } else if (opt.startsWith('-d')) {
          setting.format = opt.replace('-d ', '');
        } else if (opt.startsWith('-r')) {
          setting.raw = true;
        } else if (opt.startsWith('-t')) {
          setting.timer = true;
        } else if (opt.startsWith('--ui')) {
          setting.ui = true;
        } else if (opt.startsWith('--no_correction')) {
          setting.no_correction = true;
        } else if (opt.startsWith('--correct_fpath')) {
          setting.correct_fpath = opt.replace('--correct_fpath ', '');
        } else if (opt.startsWith('-u')) {
          setting.db_url = opt.replace('-u ', '');
        } else if (opt.startsWith('-c')) {
          setting.core = parseInt(opt.replace('-c ', ''));
        }
      });
    } else {
      otherOptions.forEach((opt, _) => {
        if (opt.startsWith('-f')) setting.format = opt.replace('-f ', '');
      });
    }

    return setting;
  }
};

export default commandParser;
