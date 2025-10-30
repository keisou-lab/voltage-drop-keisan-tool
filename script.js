<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>電圧降下合計計算ツール｜keisou-lab</title>

  <meta name="description" content="複数区間のケーブルを登録し、電圧降下率を自動合計。VVF・CVV・EMなど各種ケーブルに対応した電圧降下計算ツール。">

  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 20px; line-height: 1.6; }
    input, select, button { font-size: 1em; padding: 6px; margin: 4px 0; }
    button { background-color: #0078d7; color: white; border: none; border-radius: 6px; padding: 8px 14px; cursor: pointer; }
    button:hover { background-color: #005fa3; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
    th { background: #eef; }
    .note { font-size: .9rem; color: #555; }
    .result-card { background: #f8f9fa; padding: 12px; border-radius: 6px; margin-top: 12px; }
  </style>
</head>
<body>
  <h1>電圧降下合計計算ツール</h1>
  <p class="note">
    ケーブルを1本ずつ追加して全体の電圧降下率を合計します。<br>
    許容降下率を下回れば <b style="color:green">OK</b>、超えたら <b style="color:red">NG</b>。
  </p>

  <div class="container">
    <label>ケーブル種類:
      <select id="cableType"></select>
    </label><br>

    <label>断面積 (mm²):
      <select id="section"><option value="">未指定（最小値）</option></select>
    </label><br>

    <label>系統:
      <select id="system">
        <option value="dc">直流</option>
        <option value="ac1">単相2線</option>
        <option value="ac3">三相3線</option>
      </select>
    </label><br>

    <label>力率 (pf 0〜1): <input id="pf" type="number" step="0.01" value="1.00"></label><br>
    <label>電圧 (V): <input id="voltage" type="number" placeholder="例: 100"></label><br>
    <label>電流 (A): <input id="current" type="number" placeholder="例: 15"></label><br>
    <label>距離 (m): <input id="length" type="number" placeholder="例: 20"></label><br>
    <label>許容電圧降下率 (%): <input id="maxDropRate" type="number" step="0.1" value="3"></label><br>

    <button id="calcBtn">計算して追加</button>
    <button id="resetBtn" style="background:#999;margin-left:6px;">リセット</button>
  </div>

  <h2>ケーブル区間一覧</h2>
  <table id="table">
    <thead>
      <tr><th>ケーブル</th><th>断面積</th><th>距離(m)</th><th>降下(V)</th><th>降下率(%)</th><th>末端電圧(V)</th></tr>
    </thead>
    <tbody></tbody>
  </table>

  <div id="summary" class="result-card"></div>

  <script>
    const cableData = {
      "AE": { "resistivity": 0.02826, "material": "アルミ", "sections": [22, 38, 60, 100, 150] },
      "AZ-C": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5, 5.5, 8] },
      "AZ-C-EM": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5, 5.5] },
      "AZ-CP": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5] },
      "AZ-CP-EM": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5] },
      "CV": { "resistivity": 0.01724, "material": "銅", "sections": [8, 14, 22, 38, 60, 100, 150] },
      "CVV": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2, 3.5, 5.5] },
      "EM-IE": { "resistivity": 0.01724, "material": "銅", "sections": [1.25, 2, 3.5] },
      "VVF": { "resistivity": 0.01724, "material": "銅", "sections": [1.6, 2.0, 3.2] },
      "MVVS": { "resistivity": 0.01780, "material": "錫メッキ銅", "sections": [0.3, 0.5, 0.75, 1.25, 2] },
      "IV": { "resistivity": 0.01724, "material": "銅", "sections": [0.75, 1.25, 2, 3.5, 5.5] }
    };

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
  </script>
</body>
</html>
