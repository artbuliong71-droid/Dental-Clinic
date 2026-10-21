const path = require("path");
const { spawn } = require("child_process");

const SPARK_DIR = path.join(__dirname, "../../pyspark-analytics");
const PYTHON = path.join(SPARK_DIR, ".venv", "Scripts", "python.exe");
const JDK =
  process.env.JAVA_HOME_PATH ||
  "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.101-hotspot";
const PORT = 5001;
const BASE = `http://127.0.0.1:${PORT}`;
const DEBOUNCE_MS = 1500;
const MAX_RETRIES = 6; // 6 x 5s = 30s para hintayin ang pag-start ng Spark

let child = null;
let stopping = false;
let running = false; // may compute na tumatakbo
let pending = false; // may nagbago habang tumatakbo, ulitin pagkatapos
let timer = null;

const startService = () => {
  if (child || process.env.ANALYTICS_AUTOSTART === "false") return;

  child = spawn(PYTHON, ["clinic_analytics.py", "--serve", String(PORT)], {
    cwd: SPARK_DIR,
    windowsHide: true,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
      JAVA_HOME: JDK,
      PATH: `${JDK}\\bin;${process.env.PATH}`,
    },
  });

  child.stdout.on("data", (d) =>
    console.log("[analytics]", d.toString().trim()),
  );
  child.stderr.on("data", (d) => {
    const msg = d.toString().trim();
    if (/ERROR/.test(msg)) console.error("[analytics]", msg);
  });
  child.on("exit", (code) => {
    child = null;
    if (!stopping) {
      console.error(
        `[analytics] service stopped (code ${code}), restarting in 5s`,
      );
      setTimeout(startService, 5000);
    }
  });
};

// taskkill /T para mapatay pati ang Java na anak ng Python
const stopService = () => {
  stopping = true;
  if (child) spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
  child = null;
};
process.on("exit", stopService);
["SIGINT", "SIGTERM"].forEach((s) =>
  process.on(s, () => {
    stopService();
    process.exit();
  }),
);

// Hindi nagbabato ng error; ligtas tawagin kahit saan
const runNow = async (attempt = 0) => {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  let retry = false;
  try {
    const res = await fetch(`${BASE}/run`, { method: "POST" });
    if (!res.ok) console.error("[analytics] run failed:", res.status);
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      retry = true; // hindi pa handa ang service, subukan ulit
    } else {
      console.error("[analytics] service not reachable:", err.message);
    }
  } finally {
    running = false;
  }

  if (retry) {
    setTimeout(() => runNow(attempt + 1), 5000);
  } else if (pending) {
    pending = false;
    runNow();
  }
};

// Debounce: kung maraming nagbago sa loob ng 1.5s, isang takbo lang
const triggerAnalytics = () => {
  clearTimeout(timer);
  timer = setTimeout(() => runNow(), DEBOUNCE_MS);
};

const isRunning = () => running;

module.exports = { startService, triggerAnalytics, runNow, isRunning };
