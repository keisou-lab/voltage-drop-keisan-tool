/* 電圧降下計算ツール（keisou-lab）
 * 前提：
 * - cable_data.json を同ディレクトリに配置（既にサイトで利用中のもの）
 * - JSON 例： { "VVF": { "resistivity": 0.01724, "material": "銅" }, ... }
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

// よく使う断面積（mm²）— 日本で一般的な並び
const COMMON_SECTIONS = [
  0.5, 0.75, 1.25, 2.0, 3.5, 5.5, 8, 14, 22, 30, 38, 60, 80, 100
];

// グローバルにケーブル特性を保持
let cableData = {};
let ready = false;

// JSONロード
fetch('cable_data.json')
  .then(r => r.json())
  .then(json => {
    cableData = json;
    // セレクトに種別を流し込む
    for (const type of Object.keys(cableData)) {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = `${type}（${cableData[type].material ?? '材質不明'}）`;
      cableTypeSel.appendChild(opt);
    }
    // 断面積候補
    for (const s of COMMON_SECTIONS) {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      sectionSel.appendChild(opt);
    }
    ready = true;
  })
  .catch(() => {
    resultBox.innerHTML = `<b style="color:#b00">cable_data.json を読み込めませんでした。</b>`;
  });

// メイン計算
function calcDrop({ rho, section, sys, pf, V, I, L }) {
  // 単位：rho[Ω·mm²/m]、section[mm²]、L[m]、I[A]
  // 直流/単相：往復長 2L、三相：√3 を使う簡易式
  const loopR = (rho * (2 * L)) / section; // Ω
  let Vdrop, note = '';

  switch (sys) {
    case 'dc':
      Vdrop = I * loopR;
      break;
    case 'ac1': // 単相2線、力率考慮（抵抗のみ）
      Vdrop = I * loopR * pf; // 簡易：有効分の電流成分のみ
      note = '（単相2線・抵抗成分のみ簡易評価）';
      break;
    case 'ac3': // 三相3線
      Vdrop = Math.sqrt(3) * I * (loopR/2) * pf;
      // ↑三相は相電流×線間電圧の関係から、往復扱いの 2L の半分を概ね採用（簡易）
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
  if (!ready) return;

  const type = cableTypeSel.value;
  const rho  = Number(cableData?.[type]?.resistivity || 0.01724); // 既定：銅
  const sys  = systemSel.value;
  const pf   = clamp(Number(pfInput.value || 1), 0, 1);
  const V    = Number(vInput.value);
  const I    = Number(iInput.value);
  const L    = Number(lenInput.value);
  const Aopt = sectionSel.value ? Number(sectionSel.value) : null;
  const maxDrop = Number(maxDropInput.value);

  if (!V || !I || !L || !rho) {
    resultBox.innerHTML = `<b style="color:#b00">電圧・電流・距離を入力してください。</b>`;
    return;
  }

  // 指定断面積がある場合はそれで算出
  if (Aopt) {
    const r = calcDrop({ rho, section: Aopt, sys, pf, V, I, L });
    resultBox.innerHTML = renderResult(type, rho, Aopt, r);
    suggestBox.style.display = 'none';
    return;
  }

  // 未指定なら「降下率の目標（任意）」を満たす最小断面を提案
  const target = maxDrop > 0 ? maxDrop : 3; // 目標％。未入力時は3%を仮採用
  let chosen = null, last = null;

  for (const s of COMMON_SECTIONS) {
    const r = calcDrop({ rho, section: s, sys, pf, V, I, L });
    last = r;
    if (r.dropRate <= target) { chosen = { s, r }; break; }
  }

  if (chosen) {
    resultBox.innerHTML = renderResult(type, rho, chosen.s, chosen.r);
    suggestBox.style.display = 'block';
    suggestBox.innerHTML = `
      <b>💡 断面積の推奨：</b><span class="pill">${chosen.s} mm²</span>
      目標降下率 ${target}% 以下を満たします。<br>
      <span class="note">※ 実務では許容電流・敷設条件（許容温度/周囲温度・本数・収束）も必ず確認してください。</span>
    `;
  } else {
    // 最大でも満たせない場合
    resultBox.innerHTML = renderResult(type, rho, COMMON_SECTIONS.at(-1), last);
    suggestBox.style.display = 'block';
    suggestBox.innerHTML = `
      <b>⚠ 断面積 ${COMMON_SECTIONS.at(-1)} mm² でも目標降下率 ${target}% を満たせません。</b><br>
      ・距離を短くする／電流を下げる／電圧を上げる／ケーブルを太くする（より大きいサイズを検討）等をご検討ください。
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

// 入力のたび即時計算（使いやすさUP）
['change','input'].forEach(ev=>{
  document.querySelectorAll('#cableType,#section,#system,#pf,#voltage,#current,#length,#maxDropRate')
    .forEach(el=>el.addEventListener(ev, ()=>{/* 連打対策でボタン押下に寄せたい人は消してOK */}));
});
