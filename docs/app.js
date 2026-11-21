"use strict";

document.documentElement.classList.add("has-js");

const sidebar = document.getElementById("sidebar");
const menu = document.querySelector(".mobile-menu");
const screens = [...document.querySelectorAll("[data-screen]")];
const home = document.getElementById("home");
const navLinks = [...sidebar.querySelectorAll(".nav-link")];
const breadcrumb = document.getElementById("breadcrumb");

function setMenu(open) {
  sidebar.classList.toggle("is-open", open);
  menu.setAttribute("aria-expanded", String(open));
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
    const heading = (isNestedAnchor ? anchor : screen).querySelector("[tabindex='-1']");
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

const map = document.querySelector(".topology-map");
const canvas = map.querySelector("canvas");
const pathButtons = [...document.querySelectorAll("[data-path]")];
const pathCaption = document.getElementById("path-caption");
const pathInfo = {
  open: { nodes: ["client", "meta", "foundation"], caption: "打开文件时，客户端通过 Meta 获取属性和布局。" },
  read: { nodes: ["client", "storage", "ssd"], caption: "取得布局和路由后，客户端直接向 Storage 读取 chunk。" },
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
    context.strokeStyle = active ? "#c6f783" : "#668373";
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
    { active: requestPath === "read", service: storage, endpoint: ssd },
  ];
  for (const { active, service, endpoint } of channels.sort((left, right) => Number(left.active) - Number(right.active))) {
    stroke([[client.x, client.bottom], [client.x, branch], [service.x, branch], [service.x, service.top]], active);
    stroke([[service.x, service.bottom], [endpoint.x, endpoint.top]], active);
    if (active) {
      context.beginPath();
      context.arc(service.x, branch, 3, 0, 2 * Math.PI);
      context.fillStyle = "#c6f783";
      context.fill();
    }
  }
}

function updateTopology() {
  const info = pathInfo[requestPath];
  for (const node of topologyNodes) node.classList.toggle("is-active", info.nodes.includes(node.dataset.node));
  for (const button of pathButtons) button.setAttribute("aria-pressed", String(button.dataset.path === requestPath));
  pathCaption.textContent = info.caption;
  drawTopology();
}

for (const button of pathButtons) {
  button.addEventListener("click", () => {
    requestPath = button.dataset.path;
    updateTopology();
  });
}

new ResizeObserver(drawTopology).observe(map);
updateTopology();

const replicaButtons = [...document.querySelectorAll("[data-replica]")];
const advance = document.getElementById("advance-replication");
const reset = document.getElementById("reset-replication");
const relaxed = document.getElementById("relaxed-read");
const stepCount = document.getElementById("replication-step");
const stepStatus = document.getElementById("replication-status");
const readResult = document.getElementById("read-result");
const replicaNames = ["Head", "Mid", "Tail"];
const commitStep = [5, 4, 3];
let committedVersion = 1;
let replicationStep = 0;

function getReplica(index) {
  if (replicationStep >= commitStep[index]) return { version: committedVersion + 1, pending: false };
  return { version: committedVersion, pending: replicationStep >= index + 1 };
}

function renderReplication() {
  const newVersion = `v${committedVersion + 1}`;
  const descriptions = [
    `三个目标都可返回 v${committedVersion}。下一次写入将产生 ${newVersion}。`,
    `Head 记录待提交的 ${newVersion}。Mid 和 Tail 仍可读取旧版本。`,
    `Mid 收到 ${newVersion}。Head 与 Mid 都有未提交更新。`,
    `Tail 收到并提交 ${newVersion}。它已可返回新版本，确认开始向前回传。`,
    `Mid 收到确认并提交 ${newVersion}。Head 仍在等待确认。`,
    `Head 收到确认并提交 ${newVersion}。写入完成，三个目标均可读到新版本。`,
  ];
  const nextActions = [`开始写入 ${newVersion}`, "复制到 Mid", "在 Tail 提交", "确认回传到 Mid", "确认回传到 Head", `开始写入 v${committedVersion + 2}`];

  replicaButtons.forEach((button, index) => {
    const { version, pending } = getReplica(index);
    button.querySelector(".replica-version").textContent = `已提交 v${version}`;
    button.querySelector(".replica-state").textContent = pending ? `待提交 ${newVersion}` : "可读";
    button.classList.toggle("is-pending", pending);
    button.classList.toggle("is-committed", version > committedVersion);
  });

  stepCount.textContent = replicationStep === 0 ? "就绪" : `步骤 ${replicationStep} / 5`;
  stepStatus.textContent = descriptions[replicationStep];
  advance.textContent = nextActions[replicationStep];
  readResult.textContent = "点击副本查看读结果。";
  delete readResult.dataset.result;
}

advance.addEventListener("click", () => {
  if (replicationStep === 5) {
    committedVersion += 1;
    replicationStep = 0;
  }
  replicationStep += 1;
  renderReplication();
});

reset.addEventListener("click", () => {
  committedVersion = 1;
  replicationStep = 0;
  relaxed.checked = false;
  renderReplication();
});

replicaButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    const name = replicaNames[index];
    const { version, pending } = getReplica(index);
    readResult.dataset.result = pending ? "pending" : "ok";
    if (!pending) {
      readResult.textContent = `${name} 返回本地已提交的 v${version}。`;
    } else if (relaxed.checked) {
      readResult.textContent = `${name} 返回未提交的 v${committedVersion + 1}。本次读取启用了放宽一致性的选项。`;
    } else {
      readResult.textContent = `${name} 返回 kChunkNotCommit。客户端可以短暂等待后重试。`;
    }
  });
});

renderReplication();

const chunkSize = document.getElementById("chunk-size");
const stripeSize = document.getElementById("stripe-size");
const offset = document.getElementById("file-offset");
const offsetRange = document.getElementById("offset-range");
const chunkGrid = document.getElementById("chunk-grid");
const indexResult = document.getElementById("chunk-index");
const offsetResult = document.getElementById("chunk-offset");
const chainResult = document.getElementById("chain-result");
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
  button.append(number, chain);
  button.addEventListener("click", () => {
    offset.value = index * Number(chunkSize.value);
    renderLayout();
  });
  chunkGrid.append(button);
  chunks.push({ button, chain });
}

function renderLayout() {
  const size = Number(chunkSize.value);
  const stripes = Number(stripeSize.value);
  const value = offset.valueAsNumber;
  const max = chunks.length * size - 1;
  const valid = Number.isInteger(value) && value >= 0 && value <= max;
  const index = valid ? Math.floor(value / size) : -1;
  const slot = index % stripes;
  const remainder = value % size;

  offset.max = max;
  offset.setAttribute("aria-invalid", String(!valid));
  offsetRange.textContent = `可选偏移 0–${max} KiB`;
  chunks.forEach(({ button, chain }, position) => {
    const name = chainNames[position % stripes];
    button.dataset.chain = name;
    button.setAttribute("aria-pressed", String(position === index));
    button.setAttribute("aria-label", `Chunk ${position}，链 ${name}`);
    chain.textContent = `链 ${name}`;
  });

  indexResult.textContent = valid ? index : "—";
  offsetResult.textContent = valid ? `${remainder} KiB` : "—";
  chainResult.textContent = valid ? `链 ${chainNames[slot]}` : "—";
  calculation.textContent = valid
    ? `${value} ÷ ${size} 取整得到 ${index}，余数为 ${remainder}。第 ${slot} 号条带槽对应链 ${chainNames[slot]}。`
    : `请输入 0 到 ${max} 之间的整数偏移。`;
}

chunkSize.addEventListener("change", renderLayout);
stripeSize.addEventListener("change", renderLayout);
offset.addEventListener("input", renderLayout);
renderLayout();
