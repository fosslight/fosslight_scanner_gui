const commandParser = {
  parseCommand: (command: Command): string[] => {
    const args: string[] = [];
    let config: CommandConfig;
    let mode: string;
    let path: string;
    let excludedPath: string = '';

    if (command.type === 'analyze') {
      config = command.config as AnalyzeCommandConfig;
      mode =
        !config.mode || config.mode.includes('source' && 'binary' && 'dependency')
          ? 'all'
          : config.mode.join(' ');
      path = config.path ? '-p ' + config.path : '-p .';
      excludedPath = config.excludedPath ? '-e ' + config.excludedPath.join(' ') : '';
    } else {
      config = command.config as CompareCommandConfig;
      mode = 'compare';
      path = config.reports.join(' ');
    }

    const outputFormat: string = config.outputFormat ? '-f ' + config.outputFormat : '';
    const outputPath: string = config.outputPath ? '-o ' + config.outputPath : '';
    const extraOptions: string = config.extraOptions ? config.extraOptions : '';
    // Must push the 'mode' first
    args.push(mode, path, outputFormat, outputPath, extraOptions);
    if (excludedPath) args.push(excludedPath);

    return args;
  }
};

export default commandParser;
