const LOG_LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function formatEast8Timestamp(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const getValue = (type) => parts.find((item) => item.type === type)?.value ?? "";

  return `${getValue("year")}-${getValue("month")}-${getValue("day")}T${getValue("hour")}:${getValue("minute")}:${getValue("second")}+08:00`;
}

function normalizeLevel(level) {
  return LOG_LEVELS[level] ? level : "info";
}

function shouldWrite(currentLevel, targetLevel) {
  return LOG_LEVELS[targetLevel] >= LOG_LEVELS[currentLevel];
}

export function createLogger({
  level = "info",
  sink = (line) => console.log(line),
  now = () => new Date()
} = {}) {
  const normalizedLevel = normalizeLevel(level);

  function write(targetLevel, event, fields = {}) {
    if (!shouldWrite(normalizedLevel, targetLevel)) {
      return;
    }

    sink(
      JSON.stringify({
        ts: formatEast8Timestamp(now()),
        level: targetLevel,
        event,
        ...fields
      })
    );
  }

  return {
    debug(event, fields) {
      write("debug", event, fields);
    },
    info(event, fields) {
      write("info", event, fields);
    },
    warn(event, fields) {
      write("warn", event, fields);
    },
    error(event, fields) {
      write("error", event, fields);
    }
  };
}
