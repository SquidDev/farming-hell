import { promises as fs } from "fs";
import { spawn } from "child_process";
import { Readable } from "stream";

const logMsg = (colour: string, level: string) => (message: string): void => {
  const fullLevel = " ".repeat(5 - level.length) + level;
  console.log(`\x1b[${colour};1m${fullLevel}\x1b[0m ${message}`);
};

export const log = {
  step: logMsg("94", "STEP"),
  info: logMsg("92", "INFO"),
  warn: logMsg("93", "WARN"),
  error: logMsg("91", "ERROR"),
};

/** Check if a file exists. */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

const requestOptions: RequestInit = {
  headers: { "user-agent": "SquidDev/farming-hell" },
};

/** Format an error message to a string. */
const formatError = (e: unknown): string => {
  if (e instanceof AggregateError) {
    return e.errors.map(x => formatError(x)).join(", ");
  } else if (e instanceof Error) {
    return `${e.name}: ${e.message}`;
  } else {
    return `${e}`;
  }
}

const get = async (url: string | URL): Promise<Response> => {
  for (var i = 0; i < 4; i++) {
    try {
      return await fetch(url, requestOptions)
    } catch (e) {
      log.warn(`${formatError(e)}. Retrying`);
    }
  }

  return await fetch(url, requestOptions)
};

/** Download a remote URL and return it as a string. */
export const getAsString = async (url: string): Promise<string> => {
  const result = await get(url);
  if (result.status !== 200) {
    throw new Error(`Expected ${url} to return 200, got ${result.status ?? "error"}`);
  }

  return await result.text()
};

/** Download a remote URL and save it to a file. This skips downloading if the file already exists, unless "force" is passed. */
export const getAsFile = async (url: string, path: string, force = false): Promise<void> => {
  if (await fileExists(path) && !force) return;

  log.info(`Downloading ${url} to ${path}`);
  const result = await get(url);
  try {
    if (result.status !== 200) {
        throw new Error(`Expected ${url} to return 200, got ${result.status ?? "error"}`);
      }

      if(result.body === null) throw new Error(`Response to ${url} has no body`);

      await fs.writeFile(path, Readable.fromWeb(result.body as any));
  } catch(e) {
    try { await fs.unlink(path); } catch (e) { log.warn(`Not deleting ${path}: ${e}`) }
    throw e;
  }
};

/** Run a command and wait for it to finish. */
export const runCommand = (program: string, ...args: Array<string>): Promise<void> => new Promise((resolve, reject) => {
  const process = spawn(program, args, {
    stdio: "ignore",
  });

  let done = false;
  process.on("error", e => {
    if (done) return;
    done = true;
    reject(e);
  });

  process.on("close", code => {
    if (done) return;
    done = true;

    if (code === 0) {
      resolve();
    } else {
      reject(`Process exited with ${code ?? "unknown error"}`);
    }
  });
});

export type Task = () => Promise<void>;
export type TaskQueue = Array<Task>;

/**
 * Run a list of tasks in parallel, with a limit on the maximum number of tasks run at once.
 */
export const runTasksInParallel = async (tasks: TaskQueue, workers = 8): Promise<void> => {
  let started = 0, finished = 0;

  const workerTasks = [];
  const worker = async (): Promise<void> => {
    while (true) {
      const task = tasks.pop();
      if (!task) return;

      started++; // We need a separate counter here as tasks might grow while this is running.

      const start = process.uptime();
      await task();
      finished++;
      const finish = process.uptime();
      if (finish - start > 0.1) log.info(`Run ${finished}/${started + tasks.length} tasks`);
    }
  };

  for (let i = 0; i < workers; i++) workerTasks.push(worker());
  await Promise.all(workerTasks);
};
