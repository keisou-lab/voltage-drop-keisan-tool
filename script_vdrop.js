/* 電圧降下計算ツール（keisou-lab）
 * - cable_data.json を同じフォルダに置く
 * - GitHub Pages対応版（fetchパス修正版）
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

// よく使う断面積（mm²）
const COMMON_SECTIONS = [
  0.5, 0.75, 1.25, 2.0, 3.5, 5.5, 8, 14, 22, 30, 38, 60, 80, 100
];

// ケーブルデータ格納用
let cableData = {};
let ready = false;

// JSONを読み込み（GitHub Pages対応：相対パス ./ 付き）
fetch('./cable_data.json')
  .then(r => {
    if (!r.ok) throw new Error('fetch error');
    return r.json();
  })
  .then(json => {
    cableData = json;
    // ケーブル種別をセレクトに反映
    for (const type of Object.keys(cableData)) {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = `${type}（${cableData[type].material ?? '材質不明'}）`;
      cableTypeSel.appendChild(opt);
    }
    // 断面積リスト
    for (const s of COMMON_SECTIONS) {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      sectionSel.appendChild(opt);
    }
    ready = true;
  })
  .catch(err => {
    console.error(err);
    resultBox.innerHTML = `<b style="color:#b00">⚠ ca
