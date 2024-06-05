interface AnalyzeCommandConfig {
  mode?: ('source' | 'binary' | 'dependency')[]; // default: ['source', 'binary', 'dependency'] (all)
  path?: string; // default: '.' (current directory)
  excludedPath?: string[];
  outputFormat?: 'excel' | 'yaml'; // default: ['excel']
  outputPath?: string; // default: '.' (current directory)
  extraOptions?: string; // "-r -d "-a 'source /test/Projects/venv/bin/activate' -d 'deactivate'""
}

interface CompareCommandConfig {
  reports: [string, string]; // [path/to/report1, path/to/report2]
  outputFormat?: 'excel' | 'json' | 'yaml' | 'html'; // default: ['excel']
  outputPath?: string; // default: '.' (current directory)
  extraOptions?: string; // "-r -c 10"
}

type CommandConfig = AnalyzeCommandConfig | CompareCommandConfig;

interface Command {
  type: 'analyze' | 'compare';
  config: CommandConfig;
}

interface CommandResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface ICommandManager {
  executeCommand: (command: Command) => Promise<CommandResponse>;
}
