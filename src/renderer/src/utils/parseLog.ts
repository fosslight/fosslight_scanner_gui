const converter = {
  '\x1b[33m': '<span class="text-Yellow-600">',
  '\x1b[31m': '<span class="text-Red-600">',
  '\x1b[0m': '</span>'
};

export const convertLogToHtml = (log: string): { __html: string } => ({
  /* eslint-disable-next-line no-control-regex */
  __html: log.replace(/\x1b\[\d+m/g, (match) => converter[match] ?? match)
});

export type ScannerType = 'source' | 'binary' | 'dependency';

export const parseLog = (log: string): ScannerType | null => {
  if (log.includes('## Start to run Source Analysis')) return 'source';
  if (log.includes('## Start to run Binary Analysis')) return 'binary';
  if (log.includes('## Start to run Dependency Analysis')) return 'dependency';
  return null;
};
