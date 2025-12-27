const DEFAULT_ENV_ALLOWLIST = [
  "PATH",
  "HOME",
  "USER",
  "SHELL",
  "TMPDIR",
  "TMP",
  "TEMP",
  "TERM",
  "COLORTERM",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
];

export const DEFAULT_COLS = 80;
export const DEFAULT_ROWS = 30;

export const getLastLine = (text: string): string => {
  const index = text.lastIndexOf("\n");
  return index === -1 ? text : text.slice(index + 1);
};

export const countNewlines = (text: string): number => {
  let count = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "\n") count += 1;
  }
  return count;
};

const applyEnv = (target: Record<string, string>, source?: Record<string, string>) => {
  if (!source) return;
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string") target[key] = value;
  }
};

export const buildEnv = (
  configEnv?: Record<string, string>,
  overrideEnv?: Record<string, string>,
  allowlist: string[] = [],
): Record<string, string> => {
  const env: Record<string, string> = {};
  const mergedAllowlist = new Set([...DEFAULT_ENV_ALLOWLIST, ...allowlist]);
  for (const key of mergedAllowlist) {
    const value = process.env[key];
    if (typeof value === "string") env[key] = value;
  }
  applyEnv(env, configEnv);
  applyEnv(env, overrideEnv);
  return env;
};

export const withNewline = (input: string): string => (input.endsWith("\n") ? input : `${input}\n`);
