/* 電圧降下計算ツール（keisou-lab対応版）
 * cable_data.json を GitHub Pages から絶対パスで取得
 * https://keisou-lab.github.io/voltage-drop-keisan-tool/cable_data.json
 */

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

// JSONファイルURL（絶対パス）
const JSON_URL = 'https://keisou-lab.github.io/voltage-drop-keisan-tool/cable_data.json';

let cableData = {};
let ready = false;

// JSONを読み込む
fetch(JSON_URL)
  .then(r => {
    if (!r.ok) throw new Error("JSONファイルが見つかりません");
    return r.json();
  })
  .then(json => {
    cableData = json;
    Object.keys(cableData).forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = `${type}（${cableData[type].material}）`;
      cableTypeSel.appendChild(opt);
    });
    ready = true;
  })
  .catch(err => {
    resultBox.innerHTML = `<b style="color:#b00">⚠ cable_data.json の読み込みに失敗しました。<br>${err.message}</b>`;
  });

// ケーブル選択時に断面積リスト更新
cableTypeSel.addEventListener('change', () => {
  sectionSel.innerHTML = '<option value="">未指定（自動提案）</option>';
  const type = cableTypeSel.value;
  if (type && cableData[type]) {
    const list = cableData[type].sections;
    list.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = `${s} mm²`;
      sectionSel.appendChild(opt);
    });
  }
});

// 計算ロジック
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
  if (!ready) {
    resultBox.innerHTML = '<b style="color:#b00">データがまだ読み込まれていません。</b>';
    return;
  }

  const type = cableTypeSel.value;
  const rho  = Number(cableData?.[type]?.resistivity || 0.01724);
  const sys  = systemSel.value;
  const pf   = clamp(Number(pfInput.value || 1), 0, 1);
  const V    = Number(vInput.value);
  const I    = Number(iInput.value);
  const L    = Number(lenInput.value);
  const Aopt = sectionSel.value ? Number(sectionSel.value) : null;
  const maxDrop = Number(maxDropInput.value);

  if (!V || !I || !L || !type) {
    resultBox.innerHTML = `<b style="color:#b00">⚠ 電圧・電流・距離・ケーブル種類を入力してください。</b>`;
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
      <span class="note">※ 実際の設計では許容電流・温度条件も考慮してください。</span>
    `;
  } else {
    resultBox.innerHTML = renderResult(type, rho, list.at(-1), last);
    suggestBox.style.display = 'block';
    suggestBox.innerHTML = `
      <b>⚠ 最大断面 ${list.at(-1)} mm² でも降下率 ${target}% を満たせません。</b><br>
      ・距離短縮や電流削減、昇圧などを検討してください。
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
