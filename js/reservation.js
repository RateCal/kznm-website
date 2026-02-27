/**
 * 列車予約システム - 時刻表データ & 予約ロジック
 * 京華風の芽グループ 旅客運輸部門
 */

// ==================== 駅データ（管理番号付き） ====================
// reading フィールドでドロップダウンのあ～ん並び順を制御
const STATION_REGISTRY = {
  'A01': { name: '瑠璃松島',     reading: 'るりまつしま',         dir: 'A', dirName: '紡乃方面' },
  'A02': { name: '下松市',       reading: 'くだまつし',           dir: 'A', dirName: '紡乃方面' },
  'A03': { name: '氷城',         reading: 'こおりじょう',         dir: 'A', dirName: '紡乃方面' },
  'A04': { name: '青乃鹿',       reading: 'あおのしか',           dir: 'A', dirName: '紡乃方面' },
  'A05': { name: '新雪見野',     reading: 'しんゆきみの',         dir: 'A', dirName: '紡乃方面' },
  'A06': { name: '落合もみじ口', reading: 'おちあいもみじぐち',   dir: 'A', dirName: '紡乃方面' },
  'A07': { name: '紡乃市',       reading: 'つむぎのし',           dir: 'A', dirName: '紡乃方面' },
  'A08': { name: '新紡乃',       reading: 'しんつむぎの',         dir: 'A', dirName: '紡乃方面' },
  'Y01': { name: '川越',         reading: 'かわごえ',             dir: 'Y', dirName: '川越方面' },
  'Y02': { name: '楓高野台',     reading: 'かえでこうやだい',     dir: 'Y', dirName: '川越方面' },
  'X01': { name: '新渋谷',       reading: 'しんしぶや',           dir: 'X', dirName: '新渋谷方面' },
  'B01': { name: '帯の花',       reading: 'おびのはな',           dir: 'B', dirName: '花島台方面' },
};

// あ～ん順でソートした駅コード一覧
const STATIONS_SORTED = Object.entries(STATION_REGISTRY)
  .sort((a, b) => a[1].reading.localeCompare(b[1].reading, 'ja'))
  .map(([code]) => code);

// ==================== 路線データ ====================
const LINES = [
  {
    id: 'tsumugino-line',
    name: '紡乃線',
    operator: '株式会社 松島急行',
    color: '#c8a951',
    stationCodes: ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08']
  },
  {
    id: 'kawagoe-line',
    name: '川越線',
    operator: '株式会社 松島急行',
    color: '#1c3a6e',
    stationCodes: ['Y01', 'Y02']
  },
  {
    id: 'matsushima-line',
    name: '松島線',
    operator: '株式会社 松島急行',
    color: '#4a7ab5',
    stationCodes: ['X01']
  },
  {
    id: 'hanashimadai-line',
    name: '花島台線',
    operator: '株式会社 松島急行',
    color: '#5ba8d8',
    stationCodes: ['B01']
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

  // あ～ん順で追加
  for (const code of STATIONS_SORTED) {
    const st = STATION_REGISTRY[code];
    const label = `${st.name}　[${code}]`;
    fromSel.add(new Option(label, code));
    toSel.add(new Option(label, code));
  }

  // デフォルト
  fromSel.value = 'A01';
  toSel.value   = 'A05';
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

  resultTitle.textContent = `${fromName} [${fromCode}] → ${toName} [${toCode}]　${dateStr}　${pax}名`;
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
            <span>${fromName} <small style="color:#aaa;">[${fromCode}]</small></span>
            <span>${toName} <small style="color:#aaa;">[${toCode}]</small></span>
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
