const APP = "bubble-shooter";
const SESSION_KEY = "bs.sessionId";

function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function basePayload(level, event, data = {}) {
  return {
    app: APP,
    level,
    event,
    ts: new Date().toISOString(),
    sessionId: getSessionId(),
    ...data,
  };
}

export function logInfo(event, data) {
  console.log(JSON.stringify(basePayload("info", event, data)));
}

export function logWarn(event, data) {
  console.warn(JSON.stringify(basePayload("warn", event, data)));
}

export function logError(event, data) {
  console.error(JSON.stringify(basePayload("error", event, data)));
}