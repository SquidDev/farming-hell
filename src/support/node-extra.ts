import { Agent as HttpsAgent, get as httpsGet } from "https";
import { ClientRequest, Agent as HttpAgent, IncomingMessage, get as httpGet } from "http";
import { promises as fs } from "fs";
import { StringDecoder } from "string_decoder";
import { spawn } from "child_process";

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

const httpAgent = new HttpAgent({ keepAlive: true });
const httpsAgent = new HttpsAgent({ keepAlive: true });

const get = (url: string | URL, callback?: (res: IncomingMessage) => void): ClientRequest => {
  const isHttps = url instanceof URL ? url.protocol === "https" : url.startsWith("https://");
  return isHttps ? httpsGet(url, { agent: httpsAgent }, callback) : httpGet(url, { agent: httpAgent }, callback);
};

/** Download a remote URL and return it as a string. */
export const getAsString = (url: string): Promise<string> => new Promise((resolve, reject) => get(url, result => {
  if (result.statusCode !== 200) {
    reject(new Error(`Expected ${url} to return 200, got ${result.statusCode ?? "error"}`));
    return;
  }

  const builder = new StringDecoder("utf-8");
  let body = "";
  result.on("data", chunk => body += builder.write(chunk as Buffer));
  result.on("end", () => {
    body += builder.end();
    resolve(body);
  });
}).on("error", e => reject(e)));

/** Download a remote URL and save it to a file. This skips downloading if the file already exists, unless "force" is passed. */
export const getAsFile = async (url: string, path: string, force = false): Promise<void> => {
  if (await fileExists(path) && !force) return;

  log.info(`Downloading ${url} to ${path}`);
  await new Promise((resolve, reject) => {
    const doReject = async (e: unknown): Promise<void> => {
      try { await fs.unlink(path); } catch (e) { log.warn(`Not deleting ${path}: ${e}`) }
      reject(e);
    };

    get(url, result => {
      if (result.statusCode !== 200) {
        result.destroy();
        reject(new Error(`Expected ${url} to return 200, got ${result.statusCode ?? "error"}`));
        return;
      }

      fs.writeFile(path, result).then(resolve, doReject);
    }).on("error", e => void doReject(e));
  });
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
