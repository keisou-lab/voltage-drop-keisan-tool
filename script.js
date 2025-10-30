/* 電圧降下計算ツール（fetch不要・埋め込みデータ版） */

// ▼ケーブルデータを直埋め込み（あなたが送ってくれたJSON）
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
  "EM-JKPEE.F-S": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2] },
  "FCPEV": { "resistivity": 0.01780, "material": "錫メッキ銅", "sections": [0.5, 0.75, 1.25, 2] },
  "FCPEVS": { "resistivity": 0.01780, "material": "錫メッキ銅", "sections": [0.3, 0.5, 0.75, 1.25] },
  "HIV": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2, 3.5] },
  "HP": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5] },
  "IV": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2, 3.5, 5.5] },
  "JKPEVS": { "resistivity": 0.01724, "material": "銅", "sections": [0.5, 0.75, 1.25] },
  "VVF": { "resistivity": 0.01724, "material": "銅", "sections": [1.6, 2.0, 3.2] },
  "VVR": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5, 5.5] },
  "Z-JKVV": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2] },
  "Z-JKVV-SLA": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2] },
  "MVVS": { "resistivity": 0.01780, "material": "錫メッキ銅", "sections": [0.3, 0.5, 0.75, 1.25, 2] }
};

const cableTypeSel = document.getElementById('cableType');
const sectionSel   = document.getElementById('section');
const systemSel    = document.getElementById('system');
const pfInput      = document.getElementById('pf');
const vInput       = document.getElementById('voltage');
const iInput       = document.getElementById('current');
const lenInput     = document.getElementById('length');
const maxDropInput = document.getElementById('maxDropRate');
const resultBox    = document.getElementById('result');
const suggestBox   = document.getElementById('suggest');

// 初期化：ケーブル一覧を表示
(function init() {
  Object.keys(cableData).forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = `${type}（${cableData[type].material}）`;
    cableTypeSel.appendChild(opt);
  });
})();

// ケーブル変更時：断面積リスト更新
cableTypeSel.addEventListener('change', () => {
  sectionSel.innerHTML = '<option value="">未指定（自動提案）</option>';
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

// 計算本体
function calcDrop({ rho, section, sys, pf, V, I, L }) {
  const loopR = (rho * (2 * L)) / section; // Ω
  let Vdrop, note = '';

  switch (sys) {
    case 'dc':
      Vdrop = I * loopR;
      break;
    case 'ac1':
      Vdrop = I * loopR * pf;
      note = '（単相2線・抵抗成分のみ簡易評価）';
      break;
    case 'ac3':
      Vdrop = Math.sqrt(3) * I * (loopR / 2) * pf;
      note = '（三相3線・簡易評価）';
      break;
    default:
      Vdrop = I * loopR;
  }

  const dropRate = (Vdrop / V) * 100;
  const Vend = V - Vdrop;
  return { loopR, Vdrop, dropRate, Vend, note };
}

// 計算ボタン
document.getElementById('calcBtn').addEventListener('click', () => {
  const type = cableTypeSel.value;
  if (!type) {
    resultBox.innerHTML = `<b style="color:#b00">⚠ ケーブル種類を選択してください。</b>`;
    return;
  }

  const rho  = Number(cableData[type].resistivity);
  const sys  = systemSel.value;
  const pf   = clamp(Number(pfInput.value || 1), 0, 1);
  const V    = Number(vInput.value);
  const I    = Number(iInput.value);
  const L    = Number(lenInput.value);
  const Aopt = sectionSel.value ? Number(sectionSel.value) : null;
  const maxDrop = Number(maxDropInput.value);

  if (!V || !I || !L) {
    resultBox.innerHTML = `<b style="color:#b00">⚠ 電圧・電流・距離を入力してください。</b>`;
    return;
  }

  if (Aopt) {
    const r = calcDrop({ rho, section: Aopt, sys, pf, V, I, L });
    resultBox.innerHTML = renderResult(type, rho, Aopt, r);
    suggestBox.style.display = 'none';
    return;
  }

  const target = maxDrop > 0 ? maxDrop : 3;
  const list = cableData[type].sections;
  let chosen = null, last = null;

  for (const s of list) {
    const r = calcDrop({ rho, section: s, sys, pf, V, I, L });
    last = r;
    if (r.dropRate <= target) { chosen = { s, r }; break; }
  }

  if (chosen) {
    resultBox.innerHTML = renderResult(type, rho, chosen.s, chosen.r);
    suggestBox.style.display = 'block';
    suggestBox.innerHTML = `
      <b>💡 推奨断面積：</b><span class="pill">${chosen.s} mm²</span>
      （目標降下率 ${target}% 以下）<br>
      <span class="note">※ 実務では許容電流・敷設条件も確認してください。</span>
    `;
  } else {
    resultBox.innerHTML = renderResult(type, rho, list.at(-1), last);
    suggestBox.style.display = 'block';
    suggestBox.innerHTML = `
      <b>⚠ 最大断面 ${list.at(-1)} mm² でも降下率 ${target}% を満たせません。</b><br>
      ・距離短縮／電流低減／昇圧などを検討してください。
    `;
  }
});

function renderResult(type, rho, A, r){
  const fmt = (n, d=2)=> Number.isFinite(n)? n.toFixed(d): '-';
  return `
    <div><span class="pill">種別: ${escapeHtml(type)}</span>
         <span class="pill">ρ: ${fmt(rho,5)} Ω·mm²/m</span>
         <span class="pill">断面: ${A} mm²</span></div>
    <ul>
      <li>トータル抵抗（往復）: <b>${fmt(r.loopR,6)} Ω</b></li>
      <li>電圧降下: <b>${fmt(r.Vdrop,3)} V</b> ${r.note||''}</li>
      <li>降下率: <b>${fmt(r.dropRate,3)} %</b></li>
      <li>末端電圧: <b>${fmt(r.Vend,2)} V</b></li>
    </ul>
  `;
}

function clamp(v, min, max){ return Math.min(Math.max(v, min), max); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
