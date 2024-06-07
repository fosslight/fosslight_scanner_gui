interface AnalyzeCommandConfig {
  mode?: ('source' | 'binary' | 'dependency')[]; // default: ['source', 'binary', 'dependency'] (all)
  path: string[]; // default: '.' (current directory)
  excludedPath?: string[];
  outputFormat?: 'excel' | 'yaml'; // default: ['excel']
  outputPath?: string; // default: '.' (current directory)
  outputFileName?: string;
  extraOptions?: string; // "-r -d "-a 'source /test/Projects/venv/bin/activate' -d 'deactivate'""
}

interface CompareCommandConfig {
  reports?: [string, string]; // [path/to/report1, path/to/report2]
  outputFormat?: 'excel' | 'json' | 'yaml' | 'html'; // default: ['excel']
  outputPath?: string; // default: '.' (current directory)
  outputFileName?: string;
}

type CommandConfig = AnalyzeCommandConfig | CompareCommandConfig;

interface AnalyzeCommand {
  type: 'analyze';
  config: AnalyzeCommandConfig;
}

interface CompareCommand {
  type: 'compare';
  config: CompareCommandConfig;
}

type Command = AnalyzeCommand | CompareCommand;

interface CommandResponse {
  success: boolean;
  message?: string;
  data?: any;
}
