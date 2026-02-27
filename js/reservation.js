/**
 * 列車予約システム - 時刻表データ & 予約ロジック
 * 京華風の芽グループ 旅客運輸部門
 */

// ==================== 駅データ（管理番号付き） ====================
// numbered: true → ドロップダウン上部に英数字順表示、false → 下部に配置
const STATION_REGISTRY = {
  // A: 紡乃方面（松島）
  'A1': { name: '瑠璃松島',     reading: 'るりまつしま',         numbered: true,  dirName: '紡乃方面（松島）' },
  'A2': { name: '下松市',       reading: 'くだまつし',           numbered: true,  dirName: '紡乃方面（松島）' },
  'A3': { name: '氷城',         reading: 'こおりじょう',         numbered: true,  dirName: '紡乃方面（松島）' },
  'A4': { name: '青乃鹿',       reading: 'あおのしか',           numbered: true,  dirName: '紡乃方面（松島）' },
  'A5': { name: '新雪見野',     reading: 'しんゆきみの',         numbered: true,  dirName: '紡乃方面（松島）' },
  'A6': { name: '落合もみじ口', reading: 'おちあいもみじぐち',   numbered: true,  dirName: '紡乃方面（松島）' },
  'A7': { name: '紡乃市',       reading: 'つむぎのし',           numbered: true,  dirName: '紡乃方面（松島）' },
  'A8': { name: '新紡乃',       reading: 'しんつむぎの',         numbered: true,  dirName: '紡乃方面（松島）' },
  // B: 東灘方面（松島）
  'B1': { name: '東灘台',       reading: 'ひがしなだだい',       numbered: true,  dirName: '東灘方面（松島）' },
  'B2': { name: '石塚大泉',     reading: 'いしづかおおいずみ',   numbered: true,  dirName: '東灘方面（松島）' },
  'B3': { name: '西都',         reading: 'にしみやこ',           numbered: true,  dirName: '東灘方面（松島）' },
  'B4': { name: '新々都心',     reading: 'しんしんとしん',       numbered: true,  dirName: '東灘方面（松島）' },
  // C: 花島台方面（松島）
  'C1': { name: '帯の花',       reading: 'おびのはな',           numbered: true,  dirName: '花島台方面（松島）' },
  'C2': { name: '落合新花島',   reading: 'おちあいしんはなしま', numbered: true,  dirName: '花島台方面（松島）' },
  // ナンバリングなし（下部表示）
  'Y01': { name: '川越',         reading: 'かわごえ',             numbered: false, dirName: '川越方面（長岡）' },
  'Y02': { name: '楓高野台',     reading: 'かえでこうやだい',     numbered: false, dirName: '川越方面（長岡）' },
  'X01': { name: '新渋谷',       reading: 'しんしぶや',           numbered: false, dirName: '新渋谷方面（舞倉）' },
};

// 英数字順（ナンバリングあり先頭）→ ナンバリングなしはあ～ん順で末尾
const STATIONS_SORTED = Object.entries(STATION_REGISTRY)
  .sort(([codeA, stA], [codeB, stB]) => {
    if (stA.numbered && !stB.numbered) return -1;
    if (!stA.numbered && stB.numbered) return 1;
    if (stA.numbered && stB.numbered) {
      // A1<A2<...<B1<...C1: アルファベット→数字の英数字順
      return codeA.localeCompare(codeB, 'en', { numeric: true });
    }
    return stA.reading.localeCompare(stB.reading, 'ja');
  })
  .map(([code]) => code);

// ==================== 路線データ ====================
const LINES = [
  {
    id: 'tsumugino-line',
    name: '紡乃線',
    operator: '株式会社 松島急行',
    color: '#c8a951',
    stationCodes: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']
  },
  {
    id: 'tozai-line',
    name: '東西線',
    operator: '株式会社 松島急行',
    color: '#4a7ab5',
    stationCodes: ['B1', 'B2', 'B3', 'B4']
  },
  {
    id: 'matsushima-main-line',
    name: '松島線',
    operator: '株式会社 松島急行',
    color: '#5ba8d8',
    stationCodes: ['C1', 'C2']
  },
  {
    id: 'kawagoe-line',
    name: '川越線',
    operator: '株式会社 松島急行',
    color: '#1c3a6e',
    stationCodes: ['Y01', 'Y02']
  },
  {
    id: 'maigura-line',
    name: '舞倉線',
    operator: '株式会社 松島急行',
    color: '#2e5fa3',
    stationCodes: ['X01']
  }
];

// ==================== 列車種別 ====================
const TRAIN_TYPES = {
  express: { label: '特急', icon: '◆', priceMultiplier: 1.8 },
  rapid:   { label: '急行', icon: '◇', priceMultiplier: 1.3 },
  local:   { label: '普通', icon: '○', priceMultiplier: 1.0 }
};

// ==================== 座席クラス ====================
const SEAT_CLASSES = [
  { id: 'free',    label: '自由席',    price: 0    },
  { id: 'reserve', label: '指定席',    price: 520  },
  { id: 'green',   label: 'グリーン車', price: 1050 }
];

// ==================== 基本運賃テーブル ====================
const BASE_FARE_TABLE = [
  { maxStops: 2, fare: 220 },
  { maxStops: 4, fare: 380 },
  { maxStops: 6, fare: 560 },
  { maxStops: 8, fare: 740 },
  { maxStops: 99, fare: 980 }
];

// ==================== ルート検索 ====================
function findRoute(fromCode, toCode) {
  for (const line of LINES) {
    const fromIdx = line.stationCodes.indexOf(fromCode);
    const toIdx   = line.stationCodes.indexOf(toCode);
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      return { line, fromIdx, toIdx };
    }
  }
  return null;
}

// ==================== 時刻表生成 ====================
function generateTrains(fromCode, toCode, date) {
  const route = findRoute(fromCode, toCode);
  if (!route) return [];

  const { line, fromIdx, toIdx } = route;
  const stopCount  = Math.abs(toIdx - fromIdx);
  const fareEntry  = BASE_FARE_TABLE.find(e => stopCount <= e.maxStops);
  const baseFare   = fareEntry ? fareEntry.fare : 980;

  const dayOfWeek  = new Date(date).getDay();
  const isWeekend  = dayOfWeek === 0 || dayOfWeek === 6;
  const baseHours  = isWeekend
    ? [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    : [6, 7, 8, 9, 10, 11, 12, 13, 15, 17, 18, 19, 20, 21];

  const results = [];
  const typeEntries = Object.entries(TRAIN_TYPES);

  for (const hour of baseHours) {
    for (let t = 0; t < typeEntries.length; t++) {
      const [typeId, typeInfo] = typeEntries[t];
      const freq = typeId === 'express' ? 1 : typeId === 'rapid' ? 2 : 3;
      for (let f = 0; f < freq; f++) {
        const minOffset = Math.floor((60 / freq) * f + t * 5 + (line.id.length % 7));
        const depMin  = minOffset % 60;
        const depHour = hour + Math.floor(minOffset / 60);
        if (depHour > 23) continue;

        const travelMin   = Math.round(stopCount * (typeId === 'express' ? 6 : typeId === 'rapid' ? 9 : 13));
        const arrTotal    = depHour * 60 + depMin + travelMin;
        const arrHour     = Math.floor(arrTotal / 60) % 24;
        const arrMin      = arrTotal % 60;

        results.push({
          id: `${line.id}-${typeId}-${depHour}${String(depMin).padStart(2,'0')}-${f}`,
          lineName:  line.name,
          lineColor: line.color,
          trainTypeLabel: typeInfo.label,
          trainTypeIcon:  typeInfo.icon,
          depTime: `${String(depHour).padStart(2,'0')}:${String(depMin).padStart(2,'0')}`,
          arrTime: `${String(arrHour).padStart(2,'0')}:${String(arrMin).padStart(2,'0')}`,
          travelMin,
          totalFare: Math.round(baseFare * typeInfo.priceMultiplier)
        });
      }
    }
  }

  results.sort((a, b) => a.depTime.localeCompare(b.depTime));
  return results;
}

// ==================== UI：駅選択ドロップダウン ====================
function populateStationSelects() {
  const fromSel = document.getElementById('from-station');
  const toSel   = document.getElementById('to-station');
  if (!fromSel || !toSel) return;

  // 英数字順（ナンバリングなしは末尾）で追加
  for (const code of STATIONS_SORTED) {
    const st = STATION_REGISTRY[code];
    const label = st.numbered ? `${st.name}　[${code}]` : st.name;
    fromSel.add(new Option(label, code));
    toSel.add(new Option(label, code));
  }

  // デフォルト
  fromSel.value = 'A1';
  toSel.value   = 'A5';
}

// 日付最小値を今日に設定
function setMinDate() {
  const el = document.getElementById('travel-date');
  if (!el) return;
  const today = new Date().toISOString().split('T')[0];
  el.min = el.value = today;
}

// ==================== 検索実行 ====================
function searchTrains() {
  const fromCode = document.getElementById('from-station').value;
  const toCode   = document.getElementById('to-station').value;
  const date     = document.getElementById('travel-date').value;
  const pax      = parseInt(document.getElementById('passengers').value, 10);
  const seatId   = document.getElementById('seat-class').value;

  const resultArea  = document.getElementById('search-results');
  const resultTitle = document.getElementById('result-title');

  if (!fromCode || !toCode || fromCode === toCode) {
    showAlert('出発地と目的地は異なる駅を選択してください。');
    return;
  }
  if (!date) { showAlert('乗車日を選択してください。'); return; }

  const fromName = STATION_REGISTRY[fromCode].name;
  const toName   = STATION_REGISTRY[toCode].name;
  const seatInfo = SEAT_CLASSES.find(s => s.id === seatId);

  const d = new Date(date);
  const dayNames = ['日','月','火','水','木','金','土'];
  const dateStr  = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${dayNames[d.getDay()]}）`;

  const fromLabel = STATION_REGISTRY[fromCode].numbered ? `${fromName} [${fromCode}]` : fromName;
  const toLabel   = STATION_REGISTRY[toCode].numbered   ? `${toName} [${toCode}]`   : toName;
  resultTitle.textContent = `${fromLabel} → ${toLabel}　${dateStr}　${pax}名`;
  resultArea.innerHTML = '';

  const trains = generateTrains(fromCode, toCode, date);

  if (trains.length === 0) {
    resultArea.innerHTML = '<p style="color:var(--color-text-light); text-align:center; padding:40px 0;">この区間の直通列車は見つかりませんでした。</p>';
    document.getElementById('results-section').style.display = 'block';
    return;
  }

  for (const train of trains) {
    const totalFare = (train.totalFare + seatInfo.price) * pax;
    const card = document.createElement('div');
    card.className = 'train-card';
    card.innerHTML = `
      <div class="train-card-header" style="border-left-color:${train.lineColor};">
        <span class="train-type-badge" style="background:${train.lineColor};">
          ${train.trainTypeIcon} ${train.trainTypeLabel}
        </span>
        <span class="train-line-name">${train.lineName}</span>
      </div>
      <div class="train-card-body">
        <div>
          <div class="train-times">
            <div class="dep-time">${train.depTime}</div>
            <div class="travel-arrow">
              <span class="travel-min">${train.travelMin}分</span>
              <div class="arrow-line"></div>
            </div>
            <div class="arr-time">${train.arrTime}</div>
          </div>
          <div class="train-station-labels">
            <span>${fromLabel} </span>
            <span>${toLabel}</span>
          </div>
        </div>
        <div class="train-fare-area">
          <div class="fare-price">¥${totalFare.toLocaleString()}<span class="fare-note">（${pax}名・${seatInfo.label}）</span></div>
          <button class="btn reserve-btn" disabled style="cursor:not-allowed; opacity:0.5; background:#aaa; border-color:#aaa; color:#fff; font-size:0.78rem; letter-spacing:0.08em; white-space:nowrap;">
            予約受付停止中
          </button>
        </div>
      </div>
    `;
    resultArea.appendChild(card);
  }

  document.getElementById('results-section').style.display = 'block';
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==================== 出発地↔目的地 入れ替え ====================
function swapStations() {
  const from = document.getElementById('from-station');
  const to   = document.getElementById('to-station');
  [from.value, to.value] = [to.value, from.value];
}

// ==================== アラート ====================
function showAlert(msg) {
  const el = document.getElementById('search-alert');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ==================== 初期化 ====================
document.addEventListener('DOMContentLoaded', () => {
  populateStationSelects();
  setMinDate();
});
