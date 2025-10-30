/* 電圧降下合計計算ツール（keisou-lab） */

// ケーブルデータを内部に埋め込み
const cableData = {
  "VVF": { "resistivity": 0.01724, "material": "銅", "sections": [1.6, 2.0, 3.2] },
  "CVV": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2, 3.5, 5.5] },
  "CV":  { "resistivity": 0.01724, "material": "銅", "sections": [8, 14, 22, 38, 60, 100, 150] },
  "EM-IE": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5] },
  "AE": { "resistivity": 0.02826, "material": "アルミ", "sections": [22, 38, 60, 100, 150] },
  "MVVS": { "resistivity": 0.0178, "material": "錫メッキ銅", "sections": [0.3, 0.5, 0.75, 1.25, 2] }
};

// HTML要素取得
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

// 登録データ配列
let segments = [];

// 計算関数
function calcDrop({ rho, section, sys, pf, V, I, L }) {
  const loopR = (rho * (2 * L)) / section; // Ω
  let Vdrop, note = '';

  switch (sys) {
    case 'dc':
      Vdrop = I * loopR;
      break;
    case 'ac1':
      Vdrop = I * loopR * pf;
      note = '単相2線';
      break;
    case 'ac3':
      Vdrop = Math.sqrt(3) * I * (loopR / 2) * pf;
      note = '三相3線';
      break;
  }

  const dropRate = (Vdrop / V) * 100;
  const Vend = V - Vdrop;
  return { loopR, Vdrop, dropRate, Vend, note };
}

// 「計算して追加」
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

  // 区間追加
  segments.push({ type, A, L, ...r, V });
  updateTable(maxDrop);
});

// 「リセット」
document.getElementById('resetBtn').addEventListener('click', () => {
  segments = [];
  updateTable();
});

// 表更新
function updateTable(maxDrop = 3) {
  const tbody = document.querySelector('#table tbody');
  tbody.innerHTML = '';
  let totalDropV = 0;
  let baseV = segments[0]?.V || 0;

  segments.forEach(seg => {
    totalDropV += seg.Vdrop;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${seg.type}</td>
      <td>${seg.A}</td>
      <td>${seg.L}</td>
      <td>${seg.Vdrop.toFixed(2)}</td>
      <td>${seg.dropRate.toFixed(2)}</td>
      <td>${seg.Vend.toFixed(1)}</td>
    `;
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

// 共通関数
function clamp(v, min, max){ return Math.min(Math.max(v, min), max); }
