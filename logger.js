const APP = "bubble-shooter";
const SESSION_KEY = "bs.sessionId";

function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid =
      crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function payload(level, event, data = {}) {
  return {
    app: APP,
    level,
    event,
    ts: new Date().toISOString(),
    sessionId: getSessionId(),
    ...data,
  };
}

function sendToServer(obj) {
  // en test / node : fetch peut ne pas exister
  if (typeof fetch !== "function") return;

  fetch("/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
    keepalive: true,
  }).catch(() => {});
}

export function logInfo(event, data) {
  const obj = payload("info", event, data);
  console.log(JSON.stringify(obj)); // navigateur
  sendToServer(obj); // server -> render -> betterstack
}

export function logWarn(event, data) {
  const obj = payload("warn", event, data);
  console.warn(JSON.stringify(obj));
  sendToServer(obj);
}

export function logError(event, data) {
  const obj = payload("error", event, data);
  console.error(JSON.stringify(obj));
  sendToServer(obj);
}
