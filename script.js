/* 電圧降下合計計算ツール keisou-lab */
const JSON_URL = "https://keisou-lab.github.io/voltage-drop-keisan-tool/cable_data.json";

const cableTypeSel = document.getElementById("cableType");
const sectionSel = document.getElementById("section");
const systemSel = document.getElementById("system");
const pfInput = document.getElementById("pf");
const vInput = document.getElementById("voltage");
const iInput = document.getElementById("current");
const lenInput = document.getElementById("length");
const maxDropInput = document.getElementById("maxDropRate");
const resultTable = document.getElementById("cableTable").querySelector("tbody");
const totalBox = document.getElementById("totalBox");

let cableData = {};
let list = JSON.parse(localStorage.getItem("vdropList") || "[]");

// ===== ケーブルデータ読込 =====
fetch(JSON_URL)
  .then(r => r.json())
  .then(json => {
    cableData = json;
    Object.keys(json).forEach(type => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = `${type}（${json[type].material}）`;
      cableTypeSel.appendChild(opt);
    });
  })
  .then(renderTable)
  .catch(() => alert("ケーブルデータの読込に失敗しました"));

// ===== ケーブル選択時、断面積更新 =====
cableTypeSel.addEventListener("change", () => {
  sectionSel.innerHTML = '<option value="">未指定（最小値）</option>';
  const type = cableTypeSel.value;
  if (type && cableData[type]) {
    cableData[type].sections.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = `${s} mm²`;
      sectionSel.appendChild(opt);
    });
  }
});

// ===== 計算処理 =====
function calcDrop({ rho, section, sys, pf, V, I, L }) {
  const loopR = (rho * (2 * L)) / section;
  let Vdrop = 0;
  switch (sys) {
    case "dc": Vdrop = I * loopR; break;
    case "ac1": Vdrop = I * loopR * pf; break;
    case "ac3": Vdrop = Math.sqrt(3) * I * (loopR / 2) * pf; break;
  }
  const dropRate = (Vdrop / V) * 100;
  return { Vdrop, dropRate };
}

// ===== 追加ボタン =====
document.getElementById("calcBtn").addEventListener("click", () => {
  const type = cableTypeSel.value;
  const rho = Number(cableData?.[type]?.resistivity || 0.01724);
  const sys = systemSel.value;
  const pf = Number(pfInput.value) || 1;
  const V = Number(vInput.value);
  const I = Number(iInput.value);
  const L = Number(lenInput.value);
  const A = Number(sectionSel.value || cableData?.[type]?.sections?.[0] || 2);

  if (!type || !V || !I || !L) {
    alert("ケーブル種類・電圧・電流・距離を入力してください");
    return;
  }

  const result = calcDrop({ rho, section: A, sys, pf, V, I, L });
  list.push({ type, section: A, length: L, drop: result.dropRate });
  saveList();
  renderTable();
});

// ===== 表示更新 =====
function renderTable() {
  resultTable.innerHTML = "";
  list.forEach((r, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.type}</td>
      <td>${r.section}</td>
      <td>${r.length}</td>
      <td>${r.drop.toFixed(3)}</td>
      <td><button class="delBtn" data-idx="${idx}">削除</button></td>
    `;
    resultTable.appendChild(tr);
  });
  updateTotal();
}

// ===== 合計・判定 =====
function updateTotal() {
  const total = list.reduce((sum, r) => sum + r.drop, 0);
  const limit = Number(maxDropInput.value) || 10;
  const ok = total <= limit;
  totalBox.innerHTML = `
    <b>合計電圧降下率：</b> ${total.toFixed(3)} %<br>
    <b>許容値：</b> ${limit} % → 
    <span style="color:${ok ? 'green' : 'red'};font-weight:bold">${ok ? 'OK' : 'NG'}</span>
  `;
}

// ===== 削除ボタン =====
resultTable.addEventListener("click", e => {
  if (e.target.classList.contains("delBtn")) {
    const idx = Number(e.target.dataset.idx);
    list.splice(idx, 1);
    saveList();
    renderTable();
  }
});

// ===== リセット =====
document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("すべて削除しますか？")) {
    list = [];
    saveList();
    renderTable();
  }
});

// ===== 自動保存 =====
function saveList() {
  localStorage.setItem("vdropList", JSON.stringify(list));
}

// ===== CSV出力 =====
document.getElementById("downloadCsvBtn").addEventListener("click", () => {
  if (!list.length) {
    alert("データがありません");
    return;
  }
  const header = ["ケーブル", "断面積(mm²)", "距離(m)", "電圧降下率(%)"];
  const rows = list.map(r => [r.type, r.section, r.length, r.drop.toFixed(3)]);
  const csv = [header, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vdrop_result.csv";
  a.click();
  URL.revokeObjectURL(url);
});
