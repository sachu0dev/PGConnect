type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel: Level = (process.env.LOG_LEVEL as Level | undefined) ?? "info";

function serialise(value: unknown): unknown {
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  return value;
}

/** Minimal structured JSON logger (one line per event, stdout/stderr). */
function write(level: Level, msg: string, fields?: Fields) {
  if (ORDER[level] < (ORDER[minLevel] ?? ORDER.info)) return;
  const entry: Fields = { level, time: new Date().toISOString(), msg };
  if (fields) for (const [key, value] of Object.entries(fields)) entry[key] = serialise(value);
  const line = `${JSON.stringify(entry)}\n`;
  if (level === "error" || level === "warn") process.stderr.write(line);
  else process.stdout.write(line);
}

export const logger = {
  debug: (msg: string, fields?: Fields) => write("debug", msg, fields),
  info: (msg: string, fields?: Fields) => write("info", msg, fields),
  warn: (msg: string, fields?: Fields) => write("warn", msg, fields),
  error: (msg: string, fields?: Fields) => write("error", msg, fields),
};
