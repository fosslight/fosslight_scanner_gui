interface AnalyzeCommandConfig {
  mode?: ('source' | 'binary' | 'dependency')[]; // default: ['source', 'binary', 'dependency'] (all)
  path: string[]; // default: '.' (current directory)
  excludedPath?: string[];
  outputFormat?: 'xlsx' | 'yaml'; // default: ['xlsx']
  outputPath?: string; // default: '.' (current directory)
  outputFileName?: string;
  extraOptions?: string;
}

interface CompareCommandConfig {
  reports?: [string, string]; // [report1, report2]
  outputFormat?: 'xlsx' | 'json' | 'yaml' | 'html'; // default: ['xlsx']
  outputPath?: string; // default: '.' (current directory)'
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
