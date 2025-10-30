/* 電圧降下合計計算ツール（keisou-lab・全ケーブル対応） */

// ---- cable_data.json の内容を内部に埋め込み ----
const cableData = {
  "AE": { "resistivity": 0.02826, "material": "アルミ", "sections": [22, 38, 60, 100, 150] },
  "AZ-C": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5, 5.5, 8] },
  "AZ-C-EM": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5, 5.5] },
  "AZ-CP": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5] },
  "AZ-CP-EM": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5] },
  "AZ-CS-EM": { "resistivity": 0.01724, "material": "銅", "sections": [2, 3.5, 5.5] },
  "AZ-CSLA": { "resistivity": 0.01724, "material": "銅", "sections": [3.5, 5.5, 8, 14] },
  "AZ-K-EM": { "resistivity": 0.01724, "material": "銅", "sections": [2, 3.5, 5.5] },
  "AZ-KS-EM": { "resistivity": 0.01724, "material": "銅", "sections": [3.5, 5.5, 8] },
  "AZ-V": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5] },
  "AZ-VS": { "resistivity": 0.01724, "material": "銅", "sections": [2, 3.5, 5.5] },
  "CV": { "resistivity": 0.01724, "material": "銅", "sections": [8, 14, 22, 38, 60, 100, 150] },
  "CVQ": { "resistivity": 0.01724, "material": "銅", "sections": [2, 3.5, 5.5, 8, 14] },
  "CVT": { "resistivity": 0.01724, "material": "銅", "sections": [60, 100, 150, 200, 250] },
  "CVV": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2, 3.5, 5.5] },
  "CVVS": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2, 3.5] },
  "EM-AE": { "resistivity": 0.02826, "material": "アルミ", "sections": [22, 38, 60, 100] },
  "EM-CE": { "resistivity": 0.01724, "material": "銅", "sections": [2, 3.5, 5.5] },
  "EM-CEE": { "resistivity": 0.01724, "material": "銅", "sections": [2, 3.5, 5.5] },
  "EM-CEES": { "resistivity": 0.01724, "material": "銅", "sections": [3.5, 5.5, 8] },
  "EM-CEQ": { "resistivity": 0.01724, "material": "銅", "sections": [3.5, 5.5, 8] },
  "EM-CET": { "resistivity": 0.01724, "material": "銅", "sections": [8, 14, 22, 38] },
  "EM-CPEE-SCT": { "resistivity": 0.01724, "material": "銅", "sections": [3.5, 5.5, 8, 14] },
  "EM-EEF": { "resistivity": 0.01724, "material": "銅", "sections": [2, 3.5, 5.5] },
  "EM-EER": { "resistivity": 0.01724, "material": "銅", "sections": [2, 3.5, 5.5, 8] },
  "EM-FCPEE": { "resistivity": 0.01780, "material": "錫メッキ銅", "sections": [0.5, 0.75, 1.25, 2] },
  "EM-FP": { "resistivity": 0.01724, "material": "銅", "sections": [2, 3.5, 5.5] },
  "EM-HP": { "resistivity": 0.01724, "material": "銅", "sections": [2, 3.5, 5.5, 8] },
  "EM-IE": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5] },
  "FCPEV": { "resistivity": 0.01780, "material": "錫メッキ銅", "sections": [0.5, 0.75, 1.25, 2] },
  "FCPEVS": { "resistivity": 0.01780, "material": "錫メッキ銅", "sections": [0.3, 0.5, 0.75, 1.25] },
  "HIV": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2, 3.5] },
  "HP": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5] },
  "IV": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2, 3.5, 5.5] },
  "VVF": { "resistivity": 0.01724, "material": "銅", "sections": [1.6, 2.0, 3.2] },
  "MVVS": { "resistivity": 0.01780, "material": "錫メッキ銅", "sections": [0.3, 0.5, 0.75, 1.25, 2] }
};

// ----------------------------------------------------
// 以下は前回の合計電圧降下ロジックと同じ
// ----------------------------------------------------
const cableTypeSel = document.getElementById('cableType');
const sectionSel   = document.getElementById('section');
const systemSel    = document.getElementById('system');
const pfInput      = document.getElementById('pf');
const vInput       = document.getElementById('voltage');
const iInput       = document.getElementById('current');
const lenInput     = document.getElementById('length');
const maxDropInput = document.getElementById('maxDropRate');
const resultBox    = document.getElementById('summary');

// 初期化
Object.keys(cableData).forEach(type => {
  const opt = document.createElement('option');
  opt.value = type;
  opt.textContent = `${type}（${cableData[type].material}）`;
  cableTypeSel.appendChild(opt);
});

// ケーブル選択時に断面積更新
cableTypeSel.addEventListener('change', () => {
  sectionSel.innerHTML = '<option value="">未指定（最小値）</option>';
  const type = cableTypeSel.value;
  if (type && cableData[type]) {
    cableData[type].sections.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = `${s} mm²`;
      sectionSel.appendChild(opt);
    });
  }
});

// ---- 区間データ管理 ----
let segments = [];

function calcDrop({ rho, section, sys, pf, V, I, L }) {
  const loopR = (rho * (2 * L)) / section;
  let Vdrop;
  switch (sys) {
    case 'dc':  Vdrop = I * loopR; break;
    case 'ac1': Vdrop = I * loopR * pf; break;
    case 'ac3': Vdrop = Math.sqrt(3) * I * (loopR / 2) * pf; break;
  }
  const dropRate = (Vdrop / V) * 100;
  const Vend = V - Vdrop;
  return { Vdrop, dropRate, Vend };
}

document.getElementById('calcBtn').addEventListener('click', () => {
  const type = cableTypeSel.value;
  if (!type) return alert('ケーブルを選択してください。');
  const rho = cableData[type].resistivity;
  const sys = systemSel.value;
  const pf  = clamp(Number(pfInput.value || 1), 0, 1);
  const V   = Number(vInput.value);
  const I   = Number(iInput.value);
  const L   = Number(lenInput.value);
  const A   = sectionSel.value ? Number(sectionSel.value) : cableData[type].sections[0];
  const maxDrop = Number(maxDropInput.value || 3);
  if (!V || !I || !L) return alert('電圧・電流・距離を入力してください。');
  const r = calcDrop({ rho, section: A, sys, pf, V, I, L });
  segments.push({ type, A, L, ...r, V });
  updateTable(maxDrop);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  segments = [];
  updateTable();
});

function updateTable(maxDrop = 3) {
  const tbody = document.querySelector('#table tbody');
  tbody.innerHTML = '';
  let totalDropV = 0;
  let baseV = segments[0]?.V || 0;
  segments.forEach(seg => {
    totalDropV += seg.Vdrop;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${seg.type}</td><td>${seg.A}</td><td>${seg.L}</td>
                    <td>${seg.Vdrop.toFixed(2)}</td><td>${seg.dropRate.toFixed(2)}</td><td>${seg.Vend.toFixed(1)}</td>`;
    tbody.appendChild(tr);
  });
  const totalRate = baseV ? (totalDropV / baseV * 100) : 0;
  const ok = totalRate <= maxDrop;
  resultBox.innerHTML = segments.length
    ? `<b>合計電圧降下:</b> ${totalDropV.toFixed(2)} V<br>
       <b>合計降下率:</b> ${totalRate.toFixed(2)} % →
       <b style="color:${ok?'green':'red'}">${ok?'OK ✅':'NG ⚠'}</b><br>
       （許容 ${maxDrop}% 以下）`
    : '';
}

function clamp(v, min, max){ return Math.min(Math.max(v, min), max); }
