"use strict";

document.documentElement.classList.add("has-js");

const sidebar = document.getElementById("sidebar");
const menu = document.querySelector(".mobile-menu");
const menuScrim = document.querySelector(".menu-scrim");
const screens = [...document.querySelectorAll("[data-screen]")];
const home = document.getElementById("home");
const navLinks = [...sidebar.querySelectorAll(".nav-link")];
const breadcrumb = document.getElementById("breadcrumb");

function setMenu(open) {
  sidebar.classList.toggle("is-open", open);
  menu.setAttribute("aria-expanded", String(open));
  menuScrim.hidden = !open;
}

for (const lesson of document.querySelectorAll("[data-lesson]")) {
  const contents = document.createElement("nav");
  contents.className = "lesson-toc";
  contents.setAttribute("aria-label", "本章目录");
  for (const heading of lesson.querySelectorAll(".lesson-body > h2[id]")) {
    heading.tabIndex = -1;
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    contents.append(link);
  }
  lesson.querySelector(".lesson-head").append(contents);
}

function showScreen(moveFocus) {
  const anchor = document.getElementById(location.hash.slice(1));
  if (anchor?.id === "main" && moveFocus) return;

  const screen = anchor?.closest("[data-screen]") ?? home;
  for (const candidate of screens) {
    candidate.hidden = candidate !== screen;
  }
  for (const link of navLinks) {
    if (link.hash === `#${screen.id}`) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
  breadcrumb.textContent = screen.dataset.title;
  document.title = screen === home ? "3FS Reading · 中文学习手册" : `${screen.dataset.title} · 3FS Reading`;
  setMenu(false);

  const isNestedAnchor = anchor && anchor !== screen && screen.contains(anchor);
  if (moveFocus) {
    const focusArea = isNestedAnchor ? anchor : screen;
    const heading = focusArea.matches("[tabindex='-1']") ? focusArea : focusArea.querySelector("[tabindex='-1']");
    heading?.focus({ preventScroll: true });
  }
  if (isNestedAnchor) {
    anchor.scrollIntoView();
  } else if (moveFocus) {
    window.scrollTo(0, 0);
  }
}

menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  setMenu(open);
  if (open) sidebar.querySelector("[aria-current='page']")?.focus();
});

sidebar.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link || !sidebar.classList.contains("is-open")) return;
  setMenu(false);
  if (link.hash === location.hash) menu.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
    setMenu(false);
    menu.focus();
  }
});

menuScrim.addEventListener("click", () => {
  setMenu(false);
  menu.focus();
});

document.querySelector(".mobile-brand").addEventListener("click", () => setMenu(false));
window.matchMedia("(max-width: 700px)").addEventListener?.("change", () => setMenu(false));
window.addEventListener("hashchange", () => showScreen(true));
showScreen(false);

const lessonIds = screens.filter((screen) => screen.hasAttribute("data-lesson")).map((screen) => screen.id);
const progressPrefix = "3fs-reading.completed.";
const completed = new Set();
let storesProgress = true;

try {
  for (const id of lessonIds) {
    if (localStorage.getItem(progressPrefix + id) === "1") completed.add(id);
  }
} catch {
  storesProgress = false;
}

const progressBar = document.getElementById("course-progress");
const progressCount = document.getElementById("progress-count");
const progressCaption = document.getElementById("progress-caption");
const homeProgress = document.getElementById("home-progress");
const startLink = document.getElementById("start-learning");
const marks = [...document.querySelectorAll("[data-mark]")];
const completions = [...document.querySelectorAll("[data-completion]")];

function renderProgress() {
  const count = `${completed.size} / ${lessonIds.length}`;
  progressBar.max = lessonIds.length;
  progressBar.value = completed.size;
  progressBar.textContent = count;
  progressCount.textContent = count;
  progressCaption.textContent = storesProgress ? "完成一章后可手动标记" : "进度仅保留在当前页面";
  homeProgress.hidden = completed.size === 0;
  homeProgress.textContent = `已完成 ${count}`;

  for (const button of marks) {
    const done = completed.has(button.dataset.mark);
    button.setAttribute("aria-pressed", String(done));
    button.textContent = done ? "已完成 · 点击撤销" : "标记为已完成";
  }
  for (const mark of completions) {
    mark.hidden = !completed.has(mark.dataset.completion);
  }
  for (const link of navLinks) {
    link.classList.toggle("is-complete", completed.has(link.hash.slice(1)));
  }

  const next = lessonIds.find((id) => !completed.has(id));
  startLink.href = `#${next ?? lessonIds[0]}`;
  startLink.textContent = !next ? "复习课程" : completed.size ? "继续学习" : "开始学习";
}

for (const button of marks) {
  button.addEventListener("click", () => {
    const id = button.dataset.mark;
    const done = !completed.delete(id);
    if (done) completed.add(id);
    try {
      if (done) {
        localStorage.setItem(progressPrefix + id, "1");
      } else {
        localStorage.removeItem(progressPrefix + id);
      }
    } catch {
      storesProgress = false;
    }
    renderProgress();
  });
}

window.addEventListener("storage", (event) => {
  if (event.key === null) {
    completed.clear();
  } else if (event.key.startsWith(progressPrefix)) {
    const id = event.key.slice(progressPrefix.length);
    if (!lessonIds.includes(id)) return;
    if (event.newValue === "1") {
      completed.add(id);
    } else {
      completed.delete(id);
    }
  } else {
    return;
  }
  renderProgress();
});

renderProgress();

const conceptQuery = document.getElementById("concept-query");
const conceptCount = document.getElementById("concept-count");
const conceptEmpty = document.getElementById("concept-empty");
const concepts = [...document.querySelectorAll("[data-concept]")];

function filterConcepts() {
  const words = conceptQuery.value.trim().toLowerCase().split(/\s+/);
  let matches = 0;
  for (const concept of concepts) {
    const passage = concept.textContent.toLowerCase();
    concept.hidden = !words.every((word) => passage.includes(word));
    if (!concept.hidden) matches += 1;
  }
  conceptCount.textContent = `${matches} / ${concepts.length} 个知识点`;
  conceptEmpty.hidden = matches > 0;
}

conceptQuery.addEventListener("input", filterConcepts);
filterConcepts();

const map = document.querySelector(".topology-map");
const canvas = map.querySelector("canvas");
const pathButtons = [...document.querySelectorAll("[data-path]")];
const pathCaption = document.getElementById("path-caption");
const pathPhase = document.getElementById("path-phase");
const pathInfo = {
  open: { nodes: ["client", "meta", "foundation"], color: "#c6f783", phase: "元数据", caption: "路径需要解析时，客户端向 Meta 查询 inode 和布局。" },
  read: { nodes: ["client", "storage", "ssd"], color: "#c6f783", phase: "数据 I/O", caption: "客户端用布局和路由定位可读副本，Storage 从 SSD 取回数据。" },
  write: { nodes: ["client", "storage", "ssd"], color: "#ffd68c", phase: "副本提交", caption: "数据块写入从对应链的 Head 开始，经过逐跳复制和提交确认。" },
  routing: { nodes: ["client", "manager"], color: "#9adee6", phase: "集群控制", caption: "Mgmtd 发布各链的成员、版本和状态，客户端缓存路由用于寻址。" },
};
const topologyNodes = [...map.querySelectorAll("[data-node]")];
let requestPath = "open";

function drawTopology() {
  const bounds = map.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(bounds.width * scale);
  canvas.height = Math.round(bounds.height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);

  const points = {};
  for (const node of topologyNodes) {
    const rect = node.getBoundingClientRect();
    const { node: name } = node.dataset;
    points[name] = {
      x: rect.left - bounds.left + rect.width / 2,
      y: rect.top - bounds.top + rect.height / 2,
      left: rect.left - bounds.left,
      right: rect.right - bounds.left,
      top: rect.top - bounds.top,
      bottom: rect.bottom - bounds.top,
    };
  }

  function stroke(pointsToDraw, active = false, dashed = false) {
    context.beginPath();
    context.setLineDash(dashed ? [3, 4] : []);
    context.lineJoin = "round";
    context.lineWidth = active ? 1.8 : 1;
    context.strokeStyle = active ? pathInfo[requestPath].color : "#668373";
    context.moveTo(...pointsToDraw[0]);
    for (const point of pointsToDraw.slice(1)) context.lineTo(...point);
    context.stroke();
  }

  const { client, meta, manager, storage, foundation, ssd } = points;
  const branch = (client.bottom + meta.top) / 2;
  stroke([[client.x, client.bottom], [manager.x, manager.top]], false, true);
  stroke([[meta.right, meta.y], [manager.left, manager.y]], false, true);
  stroke([[manager.right, manager.y], [storage.left, storage.y]], false, true);

  const channels = [
    { active: requestPath === "open", service: meta, endpoint: foundation },
    { active: requestPath === "read" || requestPath === "write", service: storage, endpoint: ssd },
  ];
  for (const { active, service, endpoint } of channels.sort((left, right) => Number(left.active) - Number(right.active))) {
    stroke([[client.x, client.bottom], [client.x, branch], [service.x, branch], [service.x, service.top]], active);
    stroke([[service.x, service.bottom], [endpoint.x, endpoint.top]], active);
    if (active) {
      context.beginPath();
      context.arc(service.x, branch, 3, 0, 2 * Math.PI);
      context.fillStyle = pathInfo[requestPath].color;
      context.fill();
    }
  }
  if (requestPath === "routing") stroke([[client.x, client.bottom], [manager.x, manager.top]], true, true);
}

function updateTopology() {
  const info = pathInfo[requestPath];
  map.closest(".topology").style.setProperty("--signal", info.color);
  for (const node of topologyNodes) node.classList.toggle("is-active", info.nodes.includes(node.dataset.node));
  for (const button of pathButtons) button.setAttribute("aria-pressed", String(button.dataset.path === requestPath));
  pathPhase.textContent = info.phase;
  pathCaption.textContent = info.caption;
  drawTopology();
}

for (const button of pathButtons) {
  button.addEventListener("click", () => {
    requestPath = button.dataset.path;
    updateTopology();
  });
}

if (typeof ResizeObserver === "function") new ResizeObserver(drawTopology).observe(map);
else window.addEventListener("resize", drawTopology);
updateTopology();

const replicaButtons = [...document.querySelectorAll("[data-replica]")];
const advance = document.getElementById("advance-replication");
const previous = document.getElementById("previous-replication");
const reset = document.getElementById("reset-replication");
const relaxed = document.getElementById("relaxed-read");
const stepCount = document.getElementById("replication-step");
const stepStatus = document.getElementById("replication-status");
const readResult = document.getElementById("read-result");
const replicaNames = ["Head", "Mid", "Tail"];
const commitStep = [5, 4, 3];
const chainEdges = [...document.querySelectorAll(".chain-edge")];
let replicationTick = 0;

function replicationState() {
  if (replicationTick === 0) return { step: 0, baseVersion: 1 };
  const completedSteps = replicationTick - 1;
  return { step: completedSteps % 5 + 1, baseVersion: Math.floor(completedSteps / 5) + 1 };
}

function getReplica(index, { step, baseVersion }) {
  if (step >= commitStep[index]) return { version: baseVersion + 1, pending: false };
  return { version: baseVersion, pending: step >= index + 1 };
}

function renderReplication() {
  const state = replicationState();
  const { step, baseVersion } = state;
  const newVersion = `v${baseVersion + 1}`;
  const descriptions = [
    `三个目标都可返回 v${baseVersion}。下一次写入将产生 ${newVersion}。`,
    `Head 记录待提交的 ${newVersion}。Mid 和 Tail 仍可读取旧版本。`,
    `Mid 收到 ${newVersion}。Head 与 Mid 都有未提交更新。`,
    `Tail 收到并提交 ${newVersion}。它已可返回新版本，确认开始向前回传。`,
    `Mid 收到确认并提交 ${newVersion}。Head 仍在等待确认。`,
    `Head 收到确认并提交 ${newVersion}。写入完成，三个目标均可读到新版本。`,
  ];
  const nextActions = [`开始写入 ${newVersion}`, "复制到 Mid", "在 Tail 提交", "确认回传到 Mid", "确认回传到 Head", `开始写入 v${baseVersion + 2}`];

  replicaButtons.forEach((button, index) => {
    const { version, pending } = getReplica(index, state);
    button.querySelector(".replica-version").textContent = `已提交 v${version}`;
    button.querySelector(".replica-state").textContent = pending ? `待提交 ${newVersion}` : "可读";
    button.classList.toggle("is-pending", pending);
    button.classList.toggle("is-committed", version > baseVersion);
  });
  const arrows = { 2: ["forward", ""], 3: ["", "forward"], 4: ["", "ack"], 5: ["ack", ""] };
  const signals = arrows[step] ?? ["", ""];
  chainEdges.forEach((edge, index) => { edge.dataset.signal = signals[index]; });

  stepCount.textContent = step === 0 ? "就绪" : `步骤 ${step} / 5`;
  stepStatus.textContent = descriptions[step];
  advance.textContent = nextActions[step];
  previous.disabled = replicationTick === 0;
  readResult.textContent = "点击副本查看读结果。";
  delete readResult.dataset.result;
}

advance.addEventListener("click", () => {
  replicationTick += 1;
  renderReplication();
});

previous.addEventListener("click", () => {
  replicationTick -= 1;
  renderReplication();
  if (previous.disabled) advance.focus();
});

reset.addEventListener("click", () => {
  replicationTick = 0;
  relaxed.checked = false;
  renderReplication();
});

replicaButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    const name = replicaNames[index];
    const state = replicationState();
    const { version, pending } = getReplica(index, state);
    readResult.dataset.result = pending ? "pending" : "ok";
    if (!pending) {
      readResult.textContent = `${name} 返回本地已提交的 v${version}。`;
    } else if (relaxed.checked) {
      readResult.textContent = `${name} 返回未提交的 v${state.baseVersion + 1}。本次读取启用了放宽一致性的选项。`;
    } else {
      readResult.textContent = `${name} 返回 kChunkNotCommit。客户端可以短暂等待后重试。`;
    }
  });
});

renderReplication();

const chunkSize = document.getElementById("chunk-size");
const stripeSize = document.getElementById("stripe-size");
const offset = document.getElementById("file-offset");
const readLength = document.getElementById("read-length");
const offsetRange = document.getElementById("offset-range");
const chunkGrid = document.getElementById("chunk-grid");
const layoutTable = document.getElementById("layout-table");
const layoutSegments = document.getElementById("layout-segments");
const calculation = document.getElementById("layout-calculation");
const chainNames = ["A", "B", "C", "D"];
const chunks = [];

for (let index = 0; index < 8; index += 1) {
  const button = document.createElement("button");
  button.className = "chunk";
  button.type = "button";
  const number = document.createElement("span");
  number.className = "chunk-number";
  number.textContent = `#${index}`;
  const chain = document.createElement("span");
  chain.className = "chunk-chain";
  const coverage = document.createElement("span");
  coverage.className = "chunk-coverage";
  coverage.setAttribute("aria-hidden", "true");
  button.append(number, chain, coverage);
  button.addEventListener("click", () => {
    offset.value = index * Number(chunkSize.value);
    renderLayout();
  });
  chunkGrid.append(button);
  chunks.push({ button, chain });
}

function splitRead(start, length, size, stripes) {
  const segments = [];
  const end = start + length;
  while (start < end) {
    const index = Math.floor(start / size);
    const innerOffset = start % size;
    const segmentLength = Math.min(size - innerOffset, end - start);
    segments.push({ start, index, innerOffset, length: segmentLength, chain: chainNames[index % stripes] });
    start += segmentLength;
  }
  return segments;
}

function renderLayout() {
  const size = Number(chunkSize.value);
  const stripes = Number(stripeSize.value);
  const start = offset.valueAsNumber;
  const length = readLength.valueAsNumber;
  const capacity = chunks.length * size;
  const validStart = Number.isInteger(start) && start >= 0 && start < capacity;
  const maxLength = validStart ? capacity - start : capacity;
  const validLength = Number.isInteger(length) && length > 0 && length <= maxLength;
  const segments = validStart && validLength ? splitRead(start, length, size, stripes) : [];
  const byIndex = new Map(segments.map((segment) => [segment.index, segment]));

  offset.max = capacity - 1;
  readLength.max = maxLength;
  offset.setAttribute("aria-invalid", String(!validStart));
  readLength.setAttribute("aria-invalid", String(!validLength));
  offsetRange.textContent = `示例文件共 ${capacity} KiB。点任一块可把起点移到块首。`;
  chunks.forEach(({ button, chain }, position) => {
    const name = chainNames[position % stripes];
    const segment = byIndex.get(position);
    button.dataset.chain = name;
    button.toggleAttribute("data-covered", Boolean(segment));
    button.style.setProperty("--range-start", `${(segment?.innerOffset ?? 0) * 100 / size}%`);
    button.style.setProperty("--range-width", `${(segment?.length ?? 0) * 100 / size}%`);
    const coverageLabel = segment ? `，本次读取 ${segment.length} KiB` : "";
    button.setAttribute("aria-label", `Chunk ${position}，链 ${name}${coverageLabel}，从块首开始`);
    chain.textContent = `链 ${name}`;
  });

  const rows = segments.map((segment) => {
    const row = document.createElement("tr");
    const values = [`[${segment.start}, ${segment.start + segment.length})`, `#${segment.index}`, `${segment.innerOffset} KiB`, `${segment.length} KiB`, segment.chain];
    for (const value of values) row.insertCell().textContent = value;
    return row;
  });
  layoutSegments.replaceChildren(...rows);
  layoutTable.hidden = segments.length === 0;

  if (!validStart) {
    calculation.textContent = `请输入 0 至 ${capacity - 1} KiB 之间的整数起点。`;
  } else if (!validLength) {
    calculation.textContent = `从 ${start} KiB 开始，可读取 1 至 ${maxLength} KiB。`;
  } else {
    const chains = new Set(segments.map((segment) => segment.chain));
    calculation.textContent = `拆成 ${segments.length} 段，共读 ${length} KiB，涉及链 ${[...chains].join("、")}。`;
  }
  calculation.dataset.result = segments.length ? "ok" : "pending";
}

chunkSize.addEventListener("change", renderLayout);
stripeSize.addEventListener("change", renderLayout);
offset.addEventListener("input", renderLayout);
readLength.addEventListener("input", renderLayout);

for (const preset of document.querySelectorAll("[data-layout-preset]")) {
  preset.addEventListener("click", () => {
    const aligned = preset.dataset.layoutPreset === "aligned";
    chunkSize.value = "256";
    stripeSize.value = "3";
    offset.value = aligned ? "256" : "500";
    readLength.value = aligned ? "256" : "40";
    renderLayout();
  });
}

renderLayout();

const serverVersion = document.getElementById("server-chain-version");
const clientVersion = document.getElementById("client-chain-version");
const faultOffline = document.getElementById("fault-offline");
const faultSend = document.getElementById("fault-send");
const faultRefresh = document.getElementById("fault-refresh");
const faultReset = document.getElementById("fault-reset");
const faultResult = document.getElementById("fault-result");
const failureChain = document.querySelector(".failure-chain");
const targetB = failureChain.querySelector("[data-target='B']");
const targetC = failureChain.querySelector("[data-target='C']");
let liveChainVersion = 1;
let cachedChainVersion = 1;

function renderFailover(message, result = "") {
  const bOffline = liveChainVersion > 1;
  serverVersion.textContent = `v${liveChainVersion}`;
  clientVersion.textContent = `v${cachedChainVersion}`;
  clientVersion.toggleAttribute("data-stale", cachedChainVersion !== liveChainVersion);
  targetB.classList.toggle("is-offline", bOffline);
  targetB.querySelector("span").textContent = bOffline ? "offline · 离线" : "serving · 中间目标";
  if (bOffline) failureChain.append(targetB);
  else failureChain.insertBefore(targetB, targetC);
  faultOffline.disabled = bOffline;
  faultRefresh.disabled = cachedChainVersion === liveChainVersion;
  faultResult.textContent = message;
  faultResult.dataset.result = result;
}

faultOffline.addEventListener("click", () => {
  liveChainVersion = 2;
  renderFailover("Mgmtd 发布链 v2。Storage 已切换到 A、C，客户端缓存仍是 v1。现在试着发送写请求。", "pending");
  faultSend.focus();
});

faultSend.addEventListener("click", () => {
  if (cachedChainVersion !== liveChainVersion) {
    renderFailover("A 返回 kChainVersionMismatch。请求带的是 v1，A 已装载 v2。刷新路由后再试。", "pending");
  } else {
    const path = liveChainVersion === 1 ? "A → B → C" : "A → C";
    renderFailover(`链版本 v${cachedChainVersion} 匹配，A 接受请求。转发路径为 ${path}。`, "ok");
  }
});

faultRefresh.addEventListener("click", () => {
  cachedChainVersion = liveChainVersion;
  renderFailover("客户端已缓存 v2。再次发送写请求，检查新的转发路径。", "ok");
  faultSend.focus();
});

faultReset.addEventListener("click", () => {
  liveChainVersion = 1;
  cachedChainVersion = 1;
  renderFailover("当前 A、B、C 都可服务，客户端和服务端使用同一链版本。");
});

const quiz = document.getElementById("course-quiz");
const quizScore = document.getElementById("quiz-score");
const questions = [...quiz.querySelectorAll("[data-question]")];

function renderQuiz() {
  let answered = 0;
  let correct = 0;
  for (const question of questions) {
    const selected = question.querySelector("input:checked");
    const feedback = question.querySelector(".quiz-feedback");
    feedback.hidden = !selected;
    if (!selected) continue;

    answered += 1;
    const isCorrect = selected.value === question.dataset.answer;
    if (isCorrect) correct += 1;
    feedback.dataset.result = isCorrect ? "ok" : "pending";
    feedback.querySelector("strong").textContent = isCorrect ? "回答正确" : "再想一想";
  }
  quizScore.textContent = `已答 ${answered} / ${questions.length} · 正确 ${correct}`;
}

quiz.addEventListener("change", renderQuiz);
document.getElementById("quiz-reset").addEventListener("click", () => {
  quiz.reset();
  renderQuiz();
});
renderQuiz();
