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
    operator: '他社線',
    color: '#1c3a6e',
    stationCodes: ['Y01', 'Y02'],
    own: false
  },
  {
    id: 'maigura-line',
    name: '舞倉線',
    operator: '他社線',
    color: '#2e5fa3',
    stationCodes: ['X01'],
    own: false
  }
];

// ==================== 直通ルート ====================
// 異なる路線間の直通運転区間（findRoute がここも参照する）
const THROUGH_ROUTES = [
  {
    // 東西線↔紡乃線（東灘台B1 ↔ 青乃鹿A4〜瑠璃松島A1 方面）
    id: 'tozai-tsumugino-through',
    name: '東西・紡乃 直通',
    color: '#4a7ab5',
    stationCodes: ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'],
  },
  {
    // 松島線↔紡乃線（落合新花島C2 ↔ 瑠璃松島A1 双方向）
    id: 'matsushima-tsumugino-through',
    name: '松島・紡乃 直通',
    color: '#5ba8d8',
    stationCodes: ['C1', 'C2', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
  },
  {
    // 川越線↔松島線↔舞倉線
    // 楓高野台Y02 ─ 川越Y01 ─ 落合新花島C2 ─ 帯の花C1 ─ 新渋谷X01
    id: 'kawagoe-matsushima-maigura-through',
    name: '川越・松島・舞倉 直通',
    color: '#2e5fa3',
    stationCodes: ['Y02', 'Y01', 'C2', 'C1', 'X01'],
  },
  {
    // 川越線↔松島線↔紡乃線
    // 楓高野台Y02 ─ 川越Y01 ─ 落合新花島C2 ─ 瑠璃松島A1 ─ … ─ 新紡乃A8
    id: 'kawagoe-matsushima-tsumugino-through',
    name: '川越・松島・紡乃 直通',
    color: '#2e5fa3',
    stationCodes: ['Y02', 'Y01', 'C2', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
  },
  {
    // 舞倉線↔松島線↔紡乃線
    // 新渋谷X01 ─ 帯の花C1 ─ 落合新花島C2 ─ 瑠璃松島A1 ─ … ─ 新紡乃A8
    id: 'maigura-matsushima-tsumugino-through',
    name: '舞倉・松島・紡乃 直通',
    color: '#5ba8d8',
    stationCodes: ['X01', 'C1', 'C2', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
  },
];

// ==================== 列車種別 ====================
const TRAIN_TYPES = {
  express:          { label: '特急',        icon: '◆', priceMultiplier: 1.8 },
  rapid:            { label: '急行',        icon: '◇', priceMultiplier: 1.3 },
  'special-rapid':  { label: '特別快速',    icon: '◈', priceMultiplier: 1.2 },
  'holiday-rapid':  { label: 'ﾎﾘﾃﾞｰ快速',  icon: '◈', priceMultiplier: 1.2 },
  charter:          { label: '臨時（団体）', icon: '★', priceMultiplier: 1.8 },
};

// 種別ごとの表示色・ラベルを返す共通ヘルパー
function trainTypeStyle(type) {
  const map = {
    express:          { color: '#1c3a6e', label: '◆ 特急' },
    rapid:            { color: '#4a7ab5', label: '◇ 急行' },
    'special-rapid':  { color: '#1a6b4a', label: '◈ 特別快速' },
    'holiday-rapid':  { color: '#c27b08', label: '◈ ﾎﾘﾃﾞｰ快速' },
    charter:          { color: '#7b3fa0', label: '★ 臨時（団体）' },
  };
  return map[type] || { color: '#888', label: type };
}

// ==================== 特急・急行料金 ====================
const SUPPLEMENTS = {
  express:         { base: 800, discount: 600 },
  rapid:           { base: 400, discount: 300 },
  'special-rapid': { base: 400, discount: 300 },
  'holiday-rapid': { base: 400, discount: 300 },
  charter:         { base: 800, discount: 600 },
};
const SPECIAL_CAR_FEE = 500; // 特別車追加料金

// ==================== 購入種別（特急・急行利用時） ====================
// 乗車券とセット購入か、特急・急行券のみか
const PURCHASE_TYPES = [
  { id: 'set',  label: '乗車券＋特急・急行券',  includesTicket: true  },
  { id: 'supp', label: '特急・急行券のみ',       includesTicket: false },
];

// ==================== 座席クラス ====================
// supplement: 'none'=乗車券のみ / 'discount'=割引料金 / 'base'=基本料金 / 'special'=基本+特別代
const SEAT_CLASSES = [
  { id: 'general',  label: '一般車',       supplement: 'none'    },
  { id: 'free',     label: '自由席（二等）', supplement: 'discount' },
  { id: 'reserved', label: '二等指定席',    supplement: 'base'    },
  { id: 'special',  label: '特別車',        supplement: 'special' },
];

// 座席クラスと列車種別から特急・急行料金を算出
// trainObj.supplement があれば優先（臨時列車の自由設定）
function calcSupplement(trainType, seatClass, trainObj) {
  const sup = (trainObj && trainObj.supplement) || SUPPLEMENTS[trainType];
  if (!sup || seatClass.supplement === 'none') return 0;
  if (seatClass.supplement === 'discount') return sup.discount ?? 0;
  if (seatClass.supplement === 'base')     return sup.base ?? 0;
  if (seatClass.supplement === 'special')  return (sup.base ?? 0) + SPECIAL_CAR_FEE;
  return 0;
}

// ==================== 基本運賃テーブル ====================
const BASE_FARE_TABLE = [
  { maxStops: 2, fare: 220 },
  { maxStops: 4, fare: 380 },
  { maxStops: 6, fare: 560 },
  { maxStops: 8, fare: 740 },
  { maxStops: 99, fare: 980 }
];

// ==================== 普通運賃計算 ====================
// 初乗り130円、以降1区間ごとに20円加算
function calcLocalFare(stopCount) {
  return 130 + (stopCount - 1) * 20;
}

// ==================== ルート検索 ====================
// 単独路線を優先し、見つからなければ直通ルートも探索
function findRoute(fromCode, toCode) {
  const allLines = [...LINES, ...THROUGH_ROUTES];
  for (const line of allLines) {
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

// デフォルト日付を今日に設定（過去日も選択可能にするため min は設定しない）
function setMinDate() {
  const el = document.getElementById('travel-date');
  if (!el) return;
  el.value = new Date().toISOString().split('T')[0];
}

// ==================== 検索実行 ====================
function searchTrains() {
  _syncTimetableFromStorage(); // 常に最新データで検索
  const fromCode     = document.getElementById('from-station').value;
  const toCode       = document.getElementById('to-station').value;
  const date         = document.getElementById('travel-date').value;
  const pax          = parseInt(document.getElementById('passengers').value, 10);
  const seatId       = document.getElementById('seat-class').value;
  const purchaseType = document.getElementById('purchase-type')?.value || 'set';

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
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const isPastDate = d < todayMidnight;
  const dayNames = ['日','月','火','水','木','金','土'];
  const dateStr  = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${dayNames[d.getDay()]}）`;

  const fromLabel = STATION_REGISTRY[fromCode].numbered ? `${fromName} [${fromCode}]` : fromName;
  const toLabel   = STATION_REGISTRY[toCode].numbered   ? `${toName} [${toCode}]`   : toName;
  resultTitle.textContent = `${fromLabel} → ${toLabel}　${dateStr}　${pax}名`;
  resultArea.innerHTML = '';

  // ルート確認（直通含む）
  const route = findRoute(fromCode, toCode);

  if (!route) {
    resultArea.innerHTML = '<p style="color:var(--color-text-light); text-align:center; padding:40px 0;">この区間の直通列車は見つかりませんでした。</p>';
    document.getElementById('results-section').style.display = 'block';
    return;
  }

  // ==================== TIMETABLE 連携（特急・急行）====================
  if (typeof TIMETABLE !== 'undefined' && Array.isArray(TIMETABLE.trains)) {
    const todayTrains = getTrainsForDate(date)
      .filter(t => trainServesRoute(t, fromCode, toCode))
      .sort((a, b) => {
        const at = a.stops.find(s => s.code === fromCode)?.dep || '99:99';
        const bt = b.stops.find(s => s.code === fromCode)?.dep || '99:99';
        return at.localeCompare(bt);
      });

    for (const train of todayTrains) {
      const fi = train.stops.findIndex(s => s.code === fromCode);
      const ti = train.stops.findIndex(s => s.code === toCode);
      const depTime   = train.stops[fi].dep || '—';
      const arrTime   = train.stops[ti].arr || '—';
      const stopCountT = ti - fi;
      const baseFare  = calcLocalFare(stopCountT);
      const suppl     = calcSupplement(train.type, seatInfo, train);

      let fareTotal;
      if (seatInfo.supplement === 'none') {
        fareTotal = baseFare * pax;
      } else if (purchaseType === 'set') {
        fareTotal = (baseFare + suppl) * pax;
      } else {
        fareTotal = suppl * pax;
      }
      const fareNote = seatInfo.supplement === 'none'
        ? `（${pax}名・一般車）`
        : purchaseType === 'set'
          ? `（${pax}名・${seatInfo.label}・乗車券込）`
          : `（${pax}名・${seatInfo.label}・特急券のみ）`;

      const { color: typeColor, label: typeLabel } = trainTypeStyle(train.type);
      const isGeneral   = seatInfo.supplement === 'none';
      const isCharter   = train.type === 'charter';
      const charterNote = isCharter
        ? `<p style="font-size:0.75rem;color:#7b3fa0;margin:4px 0 0;">🔒 団体専用列車です。乗車にはパスワードが必要です。</p>` : '';
      const noticeHtml  = train.notice
        ? `<p style="font-size:0.75rem;color:var(--color-text-light);margin:6px 0 0;">⚠ ${train.notice}</p>` : '';

      // 予約ボタン
      let actionBtn;
      if (isPastDate) {
        actionBtn = `<span style="font-size:0.75rem;color:#aaa;letter-spacing:0.06em;">運行終了</span>`;
      } else if (train.reserveOpen) {
        const rKey = `r_${train.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
        _reserveRegistry[rKey] = {
          trainId: train.id, typeLabel, trainNo: train.trainNo, trainName: train.name,
          fare: fareTotal, fareNote, depTime, arrTime,
          fromName, toName, pax, seatLabel: seatInfo.label, seatId,
          isGeneral, isCharter, charterPass: train.charterPass || '',
          cars: train.cars || [], date,
        };
        actionBtn = `<button class="btn btn-primary reserve-btn" onclick="openReserve('${rKey}')" style="font-size:0.82rem; white-space:nowrap;">予約する</button>`;
      } else {
        actionBtn = `<button class="btn reserve-btn" disabled style="cursor:not-allowed; opacity:0.5; background:#aaa; border-color:#aaa; color:#fff; font-size:0.78rem; letter-spacing:0.08em; white-space:nowrap;">予約受付停止中</button>`;
      }

      const card = document.createElement('div');
      card.className = 'train-card';
      card.innerHTML = `
        <div class="train-card-header" style="border-left-color:${typeColor};">
          <span class="train-type-badge" style="background:${typeColor};">${typeLabel}</span>
          ${train.trainNo ? `<span style="font-size:0.78rem;color:#888;margin-left:4px;">${train.trainNo}号</span>` : ''}
          <span class="train-line-name">${train.name || ''}</span>
        </div>
        <div class="train-card-body">
          <div>
            <div class="train-times">
              <div class="dep-time">${depTime}</div>
              <div class="travel-arrow"><div class="arrow-line"></div></div>
              <div class="arr-time">${arrTime}</div>
            </div>
            <div class="train-station-labels">
              <span>${fromLabel}</span>
              <span>${toLabel}</span>
            </div>
            ${charterNote}
            ${noticeHtml}
          </div>
          <div class="train-fare-area">
            <div class="fare-price">¥${fareTotal.toLocaleString()}<span class="fare-note">${fareNote}</span></div>
            ${actionBtn}
          </div>
        </div>
      `;
      resultArea.appendChild(card);
    }
  }

  // 普通乗車券（時刻表なし・料金のみ）
  const stopCount = Math.abs(route.toIdx - route.fromIdx);
  const localFare = calcLocalFare(stopCount) * pax;
  const localKey = `local_${fromCode}_${toCode}_${date}_${Math.random().toString(36).slice(2,6)}`;
  _reserveRegistry[localKey] = {
    isLocal: true,
    typeLabel: '普通', trainNo: '', trainName: '',
    fare: localFare, fareNote: `（${pax}名）`,
    depTime: '当日有効', arrTime: '当日有効',
    fromName, toName, pax,
    seatId: 'general', seatLabel: '普通乗車券',
    isGeneral: true, isCharter: false, charterPass: '',
    cars: [], date,
  };
  const localActionBtn = isPastDate
    ? `<span style="font-size:0.75rem;color:#aaa;letter-spacing:0.06em;">運行終了</span>`
    : `<button class="btn btn-primary reserve-btn" onclick="openReserve('${localKey}')" style="font-size:0.82rem; white-space:nowrap;">購入する</button>`;
  const localCard = document.createElement('div');
  localCard.className = 'train-card';
  localCard.innerHTML = `
    <div class="train-card-header" style="border-left-color:#888;">
      <span class="train-type-badge" style="background:#888;">○ 普通</span>
      <span class="train-line-name">普通乗車券</span>
    </div>
    <div class="train-card-body">
      <div>
        <p style="color:var(--color-text-light); font-size:0.9rem; margin:0;">時刻指定なし・当日有効</p>
      </div>
      <div class="train-fare-area">
        <div class="fare-price">¥${localFare.toLocaleString()}<span class="fare-note">（${pax}名）</span></div>
        ${localActionBtn}
      </div>
    </div>
  `;
  resultArea.appendChild(localCard);

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

// ==================== TIMETABLE: 日付フィルタ ====================
function getTrainsForDate(dateStr) {
  if (typeof TIMETABLE === 'undefined' || !Array.isArray(TIMETABLE.trains)) return [];
  const d = new Date(dateStr + 'T00:00:00');
  const isWeekend = (d.getDay() === 0 || d.getDay() === 6);
  return TIMETABLE.trains.filter(t => {
    const rd = t.runDays;
    if (rd === 'daily')   return true;
    if (rd === 'weekday') return !isWeekend;
    if (rd === 'weekend') return isWeekend;
    if (Array.isArray(rd)) return rd.includes(dateStr);
    return false;
  });
}

// ==================== TIMETABLE: 経路確認 ====================
// fromCode → toCode の順で停車するかチェック
function trainServesRoute(train, fromCode, toCode) {
  const fi = train.stops.findIndex(s => s.code === fromCode);
  const ti = train.stops.findIndex(s => s.code === toCode);
  return fi !== -1 && ti !== -1 && fi < ti;
}

// ==================== 日付別 運行一覧 ====================
function displayDateTrains() {
  _syncTimetableFromStorage(); // 常に最新データで表示
  const dateInput = document.getElementById('list-date');
  const container = document.getElementById('date-train-results');
  const alertEl   = document.getElementById('date-search-alert');
  if (!dateInput || !container) return;

  const dateStr = dateInput.value;
  if (!dateStr) {
    if (alertEl) alertEl.innerHTML = '<p style="color:#c0392b;font-size:0.82rem;margin-top:8px;">日付を選択してください。</p>';
    return;
  }
  if (alertEl) alertEl.innerHTML = '';

  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isPast = d < today;
  const dayNames  = ['日','月','火','水','木','金','土'];
  const dateLabel = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${dayNames[d.getDay()]}）`;

  const trains = getTrainsForDate(dateStr)
    .sort((a, b) => (a.stops[0]?.dep||'99:99').localeCompare(b.stops[0]?.dep||'99:99'));

  const pastBadge = isPast ? ' <span style="font-size:0.75rem;color:#999;font-weight:400;">（過去の運行）</span>' : '';
  const headerHtml = `
    <div class="result-header">
      <h2 style="font-size:1rem;letter-spacing:0.1em;color:var(--color-primary);font-weight:700;">${dateLabel} の運行列車${pastBadge}</h2>
      <span class="result-count">${trains.length}本</span>
    </div>`;

  if (trains.length === 0) {
    container.innerHTML = headerHtml + '<p style="color:var(--color-text-light);text-align:center;padding:30px 0;">この日の運行列車は登録されていません。</p>';
    return;
  }

  container.innerHTML = headerHtml + trains.map(tr => {
    const first = tr.stops[0];
    const last  = tr.stops[tr.stops.length - 1];
    const { color: tc, label: tl } = trainTypeStyle(tr.type);
    const stopsText = tr.stops.map(s => {
      const st = STATION_REGISTRY[s.code]; return st ? st.name : s.code;
    }).join(' › ');
    const charterNote = tr.type === 'charter'
      ? `<p style="margin-top:4px;font-size:0.75rem;color:#7b3fa0;">🔒 団体専用列車・要パスワード</p>` : '';
    const noticeHtml = tr.notice
      ? `<p style="margin-top:5px;font-size:0.75rem;color:var(--color-text-light);">⚠ ${tr.notice}</p>` : '';
    let actionBtn;
    if (isPast) {
      actionBtn = `<span style="font-size:0.75rem;color:#aaa;letter-spacing:0.06em;">運行終了</span>`;
    } else if (tr.reserveOpen) {
      const rKey = `r_${tr.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      _reserveRegistry[rKey] = {
        trainId: tr.id, typeLabel: tl, trainNo: tr.trainNo, trainName: tr.name,
        fare: 0, fareNote: '（乗降駅選択後に確定）',
        depTime: '—', arrTime: '—',
        fromName: '—', toName: '—',
        pax: 1, seatId: 'general', seatLabel: '一般車', isGeneral: true,
        isCharter: tr.type === 'charter', charterPass: tr.charterPass || '',
        needStationSelect: true,
        date: dateStr,
      };
      actionBtn = `<button class="btn btn-primary reserve-btn" onclick="openReserve('${rKey}')" style="font-size:0.82rem; white-space:nowrap;">予約する</button>`;
    } else {
      actionBtn = `<button class="btn reserve-btn" disabled style="cursor:not-allowed;opacity:0.5;background:#aaa;border-color:#aaa;color:#fff;font-size:0.78rem;white-space:nowrap;">予約受付停止中</button>`;
    }
    return `
      <div class="train-card"${isPast ? ' style="opacity:0.72;"' : ''}>
        <div class="train-card-header" style="border-left-color:${tc};">
          <span class="train-type-badge" style="background:${tc};">${tl}</span>
          ${tr.trainNo ? `<span style="font-size:0.78rem;color:#888;margin-left:4px;">${tr.trainNo}号</span>` : ''}
          <span class="train-line-name">${tr.name || ''}</span>
        </div>
        <div class="train-card-body">
          <div style="flex:1;">
            <div style="font-size:0.8rem;color:var(--color-text-light);margin-bottom:4px;">${stopsText}</div>
            <div class="train-times">
              <div class="dep-time">${first?.dep||'—'}</div>
              <div class="travel-arrow"><div class="arrow-line"></div></div>
              <div class="arr-time">${last?.arr||'—'}</div>
            </div>
            ${charterNote}
            ${noticeHtml}
          </div>
          <div class="train-fare-area">
            ${actionBtn}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ==================== タブ切り替え ====================
function switchSearchTab(tab) {
  const routePanel = document.getElementById('tab-route');
  const datePanel  = document.getElementById('tab-date');
  const routeBtn   = document.getElementById('tab-btn-route');
  const dateBtn    = document.getElementById('tab-btn-date');
  if (!routePanel || !datePanel) return;

  if (tab === 'route') {
    routePanel.style.display = '';
    datePanel.style.display  = 'none';
    routeBtn.classList.add('active');
    dateBtn.classList.remove('active');
    // 区間検索結果を表示し直す
    document.getElementById('results-section').style.display =
      document.getElementById('search-results').innerHTML ? 'block' : 'none';
  } else {
    routePanel.style.display = 'none';
    datePanel.style.display  = '';
    routeBtn.classList.remove('active');
    dateBtn.classList.add('active');
    document.getElementById('results-section').style.display = 'none';
    // 日付入力が未設定なら今日をセット
    const li = document.getElementById('list-date');
    if (li && !li.value) li.value = new Date().toISOString().slice(0, 10);
  }
}

// ==================== 予約モーダル ====================
const _reserveRegistry = {};
let _currentReserveKey = null;
let _selectedSeat      = null;
let _currentCarIdx     = 0;
let _currentCars       = [];
let _activeSteps       = ['form', 'ticket']; // 現在の予約フローで表示するステップ

// ── ステップ管理 ──────────────────────────────────────────
function _showModalStep(step) {
  ['stations','seat','form','ticket'].forEach(s => {
    const el = document.getElementById('modal-step-' + s);
    if (el) el.style.display = s === step ? '' : 'none';
  });
  const headings = {
    stations: '乗降駅の選択',
    seat:     '座席を選択してください',
    form:     '予約内容の確認',
    ticket:   '予約完了 — デジタル切符',
  };
  const h = document.getElementById('modal-heading');
  if (h) h.textContent = headings[step] || '';
  // ステップインジケーター（動的生成）
  const ind = document.getElementById('modal-step-ind');
  if (!ind) return;
  const showInd = _activeSteps.length >= 3 && step !== 'ticket';
  ind.style.display = showInd ? 'flex' : 'none';
  if (!showInd) return;
  const stepLabels = { stations:'乗降駅', seat:'座席選択', form:'入力', ticket:'切符' };
  const nums = ['①','②','③','④'];
  const curIdx = _activeSteps.indexOf(step);
  ind.innerHTML = _activeSteps.map((s, i) => {
    const cls = s === step ? 'msi-item active' : (i < curIdx ? 'msi-item done' : 'msi-item');
    return (i > 0 ? '<div class="msi-arrow">›</div>' : '') +
           `<div class="${cls}">${nums[i]||String(i+1)}&nbsp;${stepLabels[s]||s}</div>`;
  }).join('');
}

function openReserve(key) {
  _currentReserveKey = key;
  _selectedSeat      = null;
  _currentCars       = [];
  const data = _reserveRegistry[key];
  if (!data) return;

  // サマリー（乗降駅選択前は最低限の情報を表示）
  if (data.needStationSelect) {
    document.getElementById('modal-summary').innerHTML = `
      <div style="font-size:0.82rem;line-height:2;">
        <div><strong>${data.typeLabel}</strong>${data.trainNo ? '　' + data.trainNo + '号' : ''}${data.trainName ? '　' + data.trainName : ''}</div>
        <div style="color:var(--color-text-light);">乗降駅を選択すると運賃が確定します</div>
      </div>`;
  } else if (data.isLocal) {
    document.getElementById('modal-summary').innerHTML = `
      <div style="font-size:0.82rem;line-height:2;">
        <div><strong>普通乗車券</strong></div>
        <div>${data.fromName} → ${data.toName}</div>
        <div>時刻指定なし・当日有効　${data.pax}名</div>
      </div>
      <div class="fare-price" style="margin-top:6px;">¥${data.fare.toLocaleString()}<span class="fare-note">${data.fareNote}</span></div>`;
  } else {
    const seatLine = data.isGeneral ? '一般車（自由乗車）' : data.seatLabel;
    document.getElementById('modal-summary').innerHTML = `
      <div style="font-size:0.82rem;line-height:2;">
        <div><strong>${data.typeLabel}</strong>${data.trainNo ? '　' + data.trainNo + '号' : ''}${data.trainName ? '　' + data.trainName : ''}</div>
        <div>${data.fromName} <strong>${data.depTime}</strong> 発 → ${data.toName} <strong>${data.arrTime}</strong> 着</div>
        <div>${seatLine}　${data.pax}名</div>
      </div>
      <div class="fare-price" style="margin-top:6px;">¥${data.fare.toLocaleString()}<span class="fare-note">${data.fareNote}</span></div>`;
  }

  document.getElementById('modal-train-id').value = key;
  document.getElementById('modal-fare').value     = data.fare;

  // フローを決定してアクティブステップをセット
  const needsStations = !!data.needStationSelect;
  const needsSeat = !needsStations
    && (data.seatId === 'reserved' || data.seatId === 'special')
    && Array.isArray(data.cars) && data.cars.length > 0;

  _activeSteps = [];
  if (needsStations) _activeSteps.push('stations');
  if (needsSeat)     _activeSteps.push('seat');
  _activeSteps.push('form', 'ticket');

  if (needsStations) {
    _renderStationsStep();
    _showModalStep('stations');
  } else if (needsSeat) {
    _currentCars = data.cars.filter(c => c.seatClass === data.seatId);
    _currentCarIdx = 0;
    _renderSeatStep();
    _showModalStep('seat');
  } else {
    _setupFormStep(data);
    _showModalStep('form');
  }

  document.getElementById('reserve-modal').classList.add('open');
}

// ── 座席選択ステップ ──────────────────────────────────────
function _strHash(s) {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}
function _seededRand(n) {
  n = (n ^ (n >>> 16)) >>> 0; n = Math.imul(n, 0x45d9f3b) >>> 0;
  n = (n ^ (n >>> 16)) >>> 0; n = Math.imul(n, 0x45d9f3b) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 0x100000000;
}

function _renderSeatStep() {
  const stepEl = document.getElementById('modal-step-seat');
  if (!stepEl) return;
  const data = _reserveRegistry[_currentReserveKey];
  // 前のステップへ戻るボタン
  const backBtn = data?.needStationSelect
    ? `<button class="btn btn-outline" style="flex:1;" onclick="_renderStationsStep();_showModalStep('stations')">← 乗降駅に戻る</button>`
    : `<button class="btn btn-outline" style="flex:1;" onclick="closeModal()">キャンセル</button>`;
  // 対応号車が存在しない場合
  if (!_currentCars || _currentCars.length === 0) {
    const cls = data?.seatLabel || '該当クラス';
    stepEl.innerHTML = `
      <div style="padding:32px 16px;text-align:center;">
        <div style="font-size:2rem;margin-bottom:10px;">🚫</div>
        <div style="font-weight:700;color:#c0392b;margin-bottom:6px;">この列車には${cls}の号車がありません</div>
        <div style="font-size:0.8rem;color:var(--color-text-light);">別の座席クラスをお選びください。</div>
      </div>
      <div style="display:flex;gap:12px;margin-top:4px;">
        ${backBtn}
        <button class="btn btn-primary" style="flex:2;" disabled>次へ →</button>
      </div>`;
    return;
  }
  // 号車タブ
  const tabsHtml = _currentCars.map((c, i) =>
    `<button class="seat-car-tab${i===0?' active':''}" onclick="_renderCarMap(${i})">${c.carNo}号車</button>`
  ).join('');
  stepEl.innerHTML = `
    <div class="seat-car-tabs">${tabsHtml}</div>
    <div id="seat-map-inner"></div>
    <div class="seat-sel-info" id="seat-sel-info">座席を選んでください</div>
    <div class="seat-legend">
      <div class="seat-legend-item"><div class="seat-legend-box" style="background:#eef5ff;border-color:#7aabdb;"></div>空席</div>
      <div class="seat-legend-item"><div class="seat-legend-box" style="background:#1c3a6e;border-color:#1c3a6e;"></div>選択中</div>
      <div class="seat-legend-item"><div class="seat-legend-box" style="background:#f5f5f5;border-color:#ddd;"></div>満席</div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px;">
      ${backBtn}
      <button class="btn btn-primary" id="seat-next-btn" style="flex:2;" onclick="_goToFormStep()" disabled>次へ →</button>
    </div>`;
  _renderCarMap(0);
}

function _renderCarMap(idx) {
  _currentCarIdx = idx;
  document.querySelectorAll('.seat-car-tab').forEach((t,i) => t.classList.toggle('active', i===idx));
  const car  = _currentCars[idx];
  const data = _reserveRegistry[_currentReserveKey];
  const isSpecial = car.seatClass === 'special';
  const cols = isSpecial ? ['A','B','C'] : ['A','B','C','D'];
  const rows = Math.max(1, Math.ceil((car.seats || 40) / cols.length));
  const seed = _strHash(_currentReserveKey + String(car.carNo));
  const taken = new Set();
  const numTaken = Math.round(rows * cols.length * 0.28);
  for (let i = 0; i < numTaken; i++) {
    const r = Math.floor(_seededRand(seed + i * 31) * rows) + 1;
    const c = Math.floor(_seededRand(seed + i * 17) * cols.length);
    taken.add(`${r}-${cols[c]}`);
  }
  const totalSeats = car.seats || 40; // 実際の定員数（グリッド枠より少ない場合あり）
  const aisle = isSpecial ? 1 : 2; // 通路位置（何番目の列の後ろ）
  let html = '<div class="seat-map-container"><div class="seat-col-headers">';
  cols.forEach((c, i) => {
    if (i === aisle) html += '<div class="seat-aisle-space"></div>';
    html += `<div class="seat-col-head">${c}</div>`;
  });
  html += '</div><div class="seat-rows">';
  for (let row = 1; row <= rows; row++) {
    html += `<div class="seat-row"><div class="seat-row-no">${row}</div>`;
    cols.forEach((col, i) => {
      if (i === aisle) html += '<div class="seat-aisle-gap"></div>';
      const sk       = `${row}-${col}`;
      const seatNum  = (row - 1) * cols.length + i; // 0-indexed で通算座席番号
      const noExist  = seatNum >= totalSeats;        // 定員を超えた「存在しない」座席
      const isTaken  = taken.has(sk);
      const isSel    = _selectedSeat?.carNo === String(car.carNo) && _selectedSeat?.sk === sk;
      if (noExist) {
        // 存在しない座席：透明で不活性
        html += `<div class="seat-btn" style="visibility:hidden;border-color:transparent;background:transparent;cursor:default;" aria-hidden="true"></div>`;
      } else if (isTaken) {
        html += `<div class="seat-btn taken" title="満席">×</div>`;
      } else {
        html += `<div class="seat-btn ${isSel?'selected':'avail'}" title="${car.carNo}号車 ${row}番${col}席"
          onclick="_selectSeat('${car.carNo}','${row}番${col}席','${sk}',${seatNum},${totalSeats})">${row}</div>`;
      }
    });
    html += '</div>';
  }
  html += '</div></div>';
  const mapEl = document.getElementById('seat-map-inner');
  if (mapEl) mapEl.innerHTML = html;
}

// 存在しない座席・満席チェックヘルパー
function _isSeatTaken(carNo, sk) {
  const car = _currentCars.find(c => String(c.carNo) === String(carNo));
  if (!car) return false;
  const cols      = car.seatClass === 'special' ? ['A','B','C'] : ['A','B','C','D'];
  const rows      = Math.max(1, Math.ceil((car.seats || 40) / cols.length));
  const seed      = _strHash(_currentReserveKey + String(car.carNo));
  const numTaken  = Math.round(rows * cols.length * 0.28);
  const taken     = new Set();
  for (let i = 0; i < numTaken; i++) {
    const r = Math.floor(_seededRand(seed + i * 31) * rows) + 1;
    const c = Math.floor(_seededRand(seed + i * 17) * cols.length);
    taken.add(`${r}-${cols[c]}`);
  }
  return taken.has(sk);
}

function _selectSeat(carNo, label, sk, seatNum, totalSeats) {
  // 存在しない座席の二重チェック（UI bypass 対策）
  if (seatNum !== undefined && totalSeats !== undefined && seatNum >= totalSeats) return;
  // 満席チェック
  if (_isSeatTaken(carNo, sk)) return;
  _selectedSeat = { carNo, label, sk };
  _renderCarMap(_currentCarIdx);
  const infoEl = document.getElementById('seat-sel-info');
  if (infoEl) infoEl.textContent = `選択中: ${carNo}号車 ${label}`;
  const btn = document.getElementById('seat-next-btn');
  if (btn) btn.disabled = false;
}

function _goToFormStep() {
  const data = _reserveRegistry[_currentReserveKey];
  if (!data) return;
  _setupFormStep(data);
  _showModalStep('form');
  _setFormBackButton();
}

// フォームステップの「戻る」ボタンを適切な前ステップへ設定
function _setFormBackButton() {
  const data = _reserveRegistry[_currentReserveKey] || {};
  const backBtn = document.getElementById('form-back-btn');
  if (!backBtn) return;
  if (_activeSteps.includes('seat')) {
    backBtn.textContent = '← 座席選択に戻る';
    backBtn.onclick = () => _showModalStep('seat');
  } else if (data.needStationSelect) {
    backBtn.textContent = '← 乗降駅に戻る';
    backBtn.onclick = () => { _renderStationsStep(); _showModalStep('stations'); };
  } else {
    backBtn.textContent = '戻る';
    backBtn.onclick = closeModal;
  }
}

// ── 乗降駅選択ステップ ──────────────────────────────────
function _renderStationsStep() {
  const stepEl = document.getElementById('modal-step-stations');
  if (!stepEl) return;
  const data  = _reserveRegistry[_currentReserveKey];
  if (!data) return;
  const train = (typeof TIMETABLE !== 'undefined')
    ? TIMETABLE.trains.find(t => t.id === data.trainId) : null;
  if (!train || !Array.isArray(train.stops) || train.stops.length < 2) {
    stepEl.innerHTML = '<p style="color:#c0392b;padding:20px;text-align:center;">停車駅情報がありません。区間検索からご予約ください。</p>';
    return;
  }

  const stopOpts = train.stops.map((s, i) => {
    const st   = STATION_REGISTRY[s.code];
    const name = st ? st.name : s.code;
    const t    = s.dep || s.arr || '';
    return `<option value="${i}">${name}${t ? '　' + t : ''}</option>`;
  }).join('');

  const trainCars = Array.isArray(data.cars) ? data.cars : [];
  const seatOpts = SEAT_CLASSES.map(sc => {
    const needsCar = sc.id === 'reserved' || sc.id === 'special';
    if (needsCar && !trainCars.some(c => c.seatClass === sc.id)) {
      return `<option value="${sc.id}" disabled>${sc.label}（この列車には設定なし）</option>`;
    }
    return `<option value="${sc.id}">${sc.label}</option>`;
  }).join('');

  const sel = (id, opts, extra='') =>
    `<select id="${id}" style="width:100%;height:44px;border:1px solid var(--color-border);border-radius:4px;padding:0 10px;font-size:0.88rem;font-family:var(--font-ja);color:var(--color-primary);background:var(--color-bg);" onchange="_updateStationFare()" ${extra}>${opts}</select>`;

  stepEl.innerHTML = `
    <p style="font-size:0.82rem;color:var(--color-text-light);letter-spacing:0.05em;margin-bottom:16px;line-height:1.8;">
      乗車駅と下車駅を選んでください。途中駅での乗降にも対応しています。
    </p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
      <div>
        <label style="display:block;font-size:0.72rem;font-weight:700;color:var(--color-primary);letter-spacing:0.1em;margin-bottom:6px;">乗車駅</label>
        ${sel('st-from-sel', stopOpts)}
      </div>
      <div>
        <label style="display:block;font-size:0.72rem;font-weight:700;color:var(--color-primary);letter-spacing:0.1em;margin-bottom:6px;">下車駅</label>
        ${sel('st-to-sel', stopOpts)}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div>
        <label style="display:block;font-size:0.72rem;font-weight:700;color:var(--color-primary);letter-spacing:0.1em;margin-bottom:6px;">人数</label>
        ${sel('st-pax-sel', [1,2,3,4,5,6].map(n=>`<option value="${n}">${n}名</option>`).join(''))}
      </div>
      <div>
        <label style="display:block;font-size:0.72rem;font-weight:700;color:var(--color-primary);letter-spacing:0.1em;margin-bottom:6px;">座席クラス</label>
        ${sel('st-seat-sel', seatOpts)}
      </div>
    </div>
    <div id="st-fare-preview" style="background:var(--color-bg);border-radius:4px;padding:12px 14px;font-size:0.85rem;line-height:2;margin-bottom:8px;min-height:52px;"></div>
    <p id="st-err" style="color:#c0392b;font-size:0.78rem;display:none;margin-bottom:8px;">下車駅は乗車駅より後の駅を選択してください。</p>
    <div style="display:flex;gap:12px;margin-top:12px;">
      <button class="btn btn-outline" style="flex:1;" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" id="st-next-btn" style="flex:2;" onclick="_goFromStationsStep()">次へ →</button>
    </div>`;

  // デフォルト: 始発→終着
  const fromSel = document.getElementById('st-from-sel');
  const toSel   = document.getElementById('st-to-sel');
  if (fromSel) fromSel.value = '0';
  if (toSel)   toSel.value   = String(train.stops.length - 1);
  _updateStationFare();
}

function _updateStationFare() {
  const data  = _reserveRegistry[_currentReserveKey];
  if (!data) return;
  const train = (typeof TIMETABLE !== 'undefined')
    ? TIMETABLE.trains.find(t => t.id === data.trainId) : null;
  if (!train) return;

  const fromSel   = document.getElementById('st-from-sel');
  const toSel     = document.getElementById('st-to-sel');
  const paxSel    = document.getElementById('st-pax-sel');
  const seatSelEl = document.getElementById('st-seat-sel');
  const errEl     = document.getElementById('st-err');
  const preview   = document.getElementById('st-fare-preview');
  const nextBtn   = document.getElementById('st-next-btn');

  const fi     = parseInt(fromSel?.value  || '0');
  const ti     = parseInt(toSel?.value    || '0');
  const pax    = parseInt(paxSel?.value   || '1');
  const seatId = seatSelEl?.value || 'general';

  if (fi >= ti) {
    if (errEl)   errEl.style.display = '';
    if (preview) preview.innerHTML = '';
    if (nextBtn) nextBtn.disabled = true;
    return;
  }
  if (errEl)   errEl.style.display = 'none';
  if (nextBtn) nextBtn.disabled = false;

  const fromStop  = train.stops[fi];
  const toStop    = train.stops[ti];
  const fromSt    = STATION_REGISTRY[fromStop.code];
  const toSt      = STATION_REGISTRY[toStop.code];
  const fromName  = fromSt ? fromSt.name : fromStop.code;
  const toName    = toSt   ? toSt.name   : toStop.code;
  const stopCount = ti - fi;
  const baseFare  = calcLocalFare(stopCount);
  const seatInfo  = SEAT_CLASSES.find(s => s.id === seatId) || SEAT_CLASSES[0];
  const suppl     = calcSupplement(train.type, seatInfo, train);
  const fareTotal = seatInfo.supplement === 'none'
    ? baseFare * pax
    : (baseFare + suppl) * pax;
  const fareNote = seatInfo.supplement === 'none'
    ? `${pax}名・一般車`
    : `${pax}名・${seatInfo.label}・乗車券込`;
  const depT = fromStop.dep || fromStop.arr || '—';
  const arrT = toStop.arr   || toStop.dep   || '—';

  if (preview) {
    preview.innerHTML = `
      <div style="color:var(--color-primary);font-weight:700;">${fromName}
        <span style="font-size:0.78rem;font-weight:400;color:#888;">${depT}</span>
        &nbsp;→&nbsp;${toName}
        <span style="font-size:0.78rem;font-weight:400;color:#888;">${arrT}</span>
      </div>
      <div style="margin-top:2px;">停車数&nbsp;<strong>${stopCount}</strong>&nbsp;駅　｜　運賃&nbsp;<strong style="color:#8b1a1a;font-size:1.05rem;">¥${fareTotal.toLocaleString()}</strong>
        <span style="font-size:0.75rem;color:#888;">（${fareNote}）</span>
      </div>`;
  }

  // 次ステップ用に一時保存
  data._sel = { fi, ti, pax, seatId, fromStop, toStop, fromName, toName, depT, arrT, fareTotal, fareNote, seatInfo };
}

function _goFromStationsStep() {
  const data = _reserveRegistry[_currentReserveKey];
  if (!data || !data._sel) return;
  const sel   = data._sel;
  const train = (typeof TIMETABLE !== 'undefined')
    ? TIMETABLE.trains.find(t => t.id === data.trainId) : null;

  // レジストリを更新
  data.fromName  = sel.fromName;
  data.toName    = sel.toName;
  data.depTime   = sel.depT;
  data.arrTime   = sel.arrT;
  data.fare      = sel.fareTotal;
  data.fareNote  = `（${sel.fareNote}）`;
  data.pax       = sel.pax;
  data.seatId    = sel.seatId;
  data.seatLabel = sel.seatInfo.label;
  data.isGeneral = sel.seatInfo.supplement === 'none';
  data.cars      = train?.cars || [];

  // サマリーを更新
  const seatLine = data.isGeneral ? '一般車（自由乗車）' : data.seatLabel;
  document.getElementById('modal-summary').innerHTML = `
    <div style="font-size:0.82rem;line-height:2;">
      <div><strong>${data.typeLabel}</strong>${data.trainNo ? '　' + data.trainNo + '号' : ''}${data.trainName ? '　' + data.trainName : ''}</div>
      <div>${data.fromName} <strong>${data.depTime}</strong> 発 → ${data.toName} <strong>${data.arrTime}</strong> 着</div>
      <div>${seatLine}　${data.pax}名</div>
    </div>
    <div class="fare-price" style="margin-top:6px;">¥${data.fare.toLocaleString()}<span class="fare-note">${data.fareNote}</span></div>`;
  document.getElementById('modal-fare').value = data.fare;

  // 指定席・特別車 かつ 号車データあり → 座席選択ステップへ
  const needsSeat = (sel.seatId === 'reserved' || sel.seatId === 'special')
    && Array.isArray(data.cars) && data.cars.length > 0;

  if (needsSeat) {
    if (!_activeSteps.includes('seat')) {
      const fi = _activeSteps.indexOf('form');
      if (fi >= 0) _activeSteps.splice(fi, 0, 'seat');
    }
    _currentCars = data.cars.filter(c => c.seatClass === sel.seatId);
    _currentCarIdx = 0;
    _renderSeatStep();
    _showModalStep('seat');
  } else {
    // seat ステップが _activeSteps に紛れ込んでいれば取り除く
    _activeSteps = _activeSteps.filter(s => s !== 'seat');
    _setupFormStep(data);
    _showModalStep('form');
    _setFormBackButton();
  }
}

function _setupFormStep(data) {
  const cpGroup    = document.getElementById('modal-charter-group');
  const cpExpected = document.getElementById('modal-charter-pass-expected');
  const cpInput    = document.getElementById('res-charter-pass');
  const cpErr      = document.getElementById('modal-charter-err');
  if (data.isCharter && data.charterPass) {
    cpGroup.style.display = '';
    cpExpected.value = data.charterPass;
    if (cpInput) cpInput.value = '';
    if (cpErr)   cpErr.style.display = 'none';
  } else {
    cpGroup.style.display = 'none';
    if (cpExpected) cpExpected.value = '';
  }
  if (document.getElementById('res-mcid')) document.getElementById('res-mcid').value = '';
}

// ── 予約データをlocalStorageに保存 ────────────────────────
const RESV_STORAGE_KEY = 'kznm-reservations-v1';
function _saveReservation(data, seat, mcid, ticketNo) {
  try {
    const raw   = localStorage.getItem(RESV_STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : { reservations: [] };
    store.reservations.unshift({
      id:        ticketNo,
      issuedAt:  new Date().toISOString(),
      date:      data.date || new Date().toISOString().slice(0,10),
      trainNo:   data.trainNo   || '',
      trainName: data.trainName || '',
      typeLabel: data.typeLabel || '',
      fromName:  data.fromName  || '—',
      toName:    data.toName    || '—',
      depTime:   data.depTime   || '—',
      arrTime:   data.arrTime   || '—',
      pax:       data.pax       || 1,
      seatLabel: data.seatLabel || '一般車',
      seat:      seat ? `${seat.carNo}号車 ${seat.label}` : (data.isLocal ? '普通乗車券（自由乗車）' : data.isGeneral ? '自由乗車（一般車）' : '自由席'),
      fare:      data.fare      || 0,
      fareNote:  data.fareNote  || '',
      mcid:      mcid,
    });
    if (store.reservations.length > 200) store.reservations = store.reservations.slice(0, 200);
    localStorage.setItem(RESV_STORAGE_KEY, JSON.stringify(store));
  } catch (e) { /* ignore */ }
}

// ── 予約データを GitHub に push（クロスネットワーク対応） ──────
async function _pushReservationsToGitHub() {
  // js/gh-sync-config.js（デプロイ済み）または localStorage から設定を取得
  const cfg = (typeof GH_SYNC_CONFIG !== 'undefined' && GH_SYNC_CONFIG) || {
    owner:  localStorage.getItem('gh-owner')  || '',
    repo:   localStorage.getItem('gh-repo')   || '',
    branch: localStorage.getItem('gh-branch') || 'main',
    pat:    localStorage.getItem('gh-pat')    || '',
  };
  if (!cfg.owner || !cfg.repo || !cfg.pat) return { ok: false, msg: 'config_missing' };

  const raw = localStorage.getItem(RESV_STORAGE_KEY) || '{"reservations":[]}';
  const path    = 'data/reservations.json';
  const headers = {
    'Authorization': `token ${cfg.pat}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
  try {
    // 既存ファイルの sha + GitHub 上の予約データを取得
    const getRes = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${cfg.branch}`, { headers });
    let sha;
    let ghReservations = [];
    if (getRes.ok) {
      const ghData = await getRes.json();
      sha = ghData.sha;
      try {
        const ghJson = decodeURIComponent(
          atob(ghData.content.replace(/\n/g, ''))
            .split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join('')
        );
        ghReservations = JSON.parse(ghJson).reservations || [];
      } catch { /* パース失敗は無視 */ }
    }
    // ローカルとGitHubのデータをマージ（IDで重複排除、ローカル優先）
    const localReservations = (() => {
      try { return JSON.parse(raw).reservations || []; } catch { return []; }
    })();
    const merged = new Map();
    ghReservations.forEach(r => merged.set(r.id, r));
    localReservations.forEach(r => merged.set(r.id, r));
    const combined = [...merged.values()].sort((a, b) =>
      (b.issuedAt || '').localeCompare(a.issuedAt || '')
    );
    const mergedJson = JSON.stringify({ reservations: combined });
    const mergedBytes = new TextEncoder().encode(mergedJson);
    let mergedBinary = '';
    for (let i = 0; i < mergedBytes.byteLength; i++) mergedBinary += String.fromCharCode(mergedBytes[i]);
    const mergedB64 = btoa(mergedBinary);

    const body = { message: '予約データ更新', content: mergedB64, branch: cfg.branch };
    if (sha) body.sha = sha;
    const putRes = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`, {
      method: 'PUT', headers, body: JSON.stringify(body),
    });
    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      return { ok: false, msg: err.message || `HTTP ${putRes.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

// ── チケット生成 ──────────────────────────────────────────
function _generateTicket(data, selectedSeat, mcid, ticketNo) {
  if (!ticketNo) ticketNo = 'RU' + Date.now().toString().slice(-8) + String(Math.floor(Math.random()*100)).padStart(2,'0');
  const seat = selectedSeat
    ? `${selectedSeat.carNo}号車 ${selectedSeat.label}`
    : data.isLocal ? '普通乗車券（自由乗車）'
    : data.isGeneral ? '自由乗車（一般車）' : (data.seatId === 'free' ? '自由席' : '座席未指定');
  const rawDate = data.date || new Date().toISOString().slice(0,10);
  const d = new Date(rawDate + 'T00:00:00');
  const dn = ['日','月','火','水','木','金','土'];
  const dateLabel = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}（${dn[d.getDay()]}）`;
  const typeLabel = data.typeLabel.replace(/^[◆◇◈★] /,'');
  return `
    <div class="maruku-wrap">
      <div class="maruku-ticket">
        <div class="t-holes"></div>
        <div class="t-body">
          <div class="t-head">
            <div>
              <div class="t-company">eるりきゅう / Rurikyū</div>
              <div class="t-company-en">KZNM LLC · RURIKYŪ RAILWAY</div>
            </div>
            <div>
              <div class="t-type-name">${data.seatLabel || '乗車券'}</div>
              <div class="t-validity">${dateLabel} 限り有効</div>
            </div>
          </div>
          <div class="t-route">
            <div class="t-st">
              <div class="t-st-name">${data.fromName}</div>
              <div class="t-st-sub">発 DEPARTURE</div>
            </div>
            <div class="t-arrow">━━━━►</div>
            <div class="t-st">
              <div class="t-st-name">${data.toName}</div>
              <div class="t-st-sub">着 ARRIVAL</div>
            </div>
          </div>
          <div class="t-grid">
            <div class="t-cell">
              <div class="t-cell-label">列 車</div>
              <div class="t-cell-val">${typeLabel}${data.trainNo ? ' ' + data.trainNo + '号' : ''}</div>
            </div>
            <div class="t-cell">
              <div class="t-cell-label">発 時 刻</div>
              <div class="t-cell-val">${data.depTime}</div>
            </div>
            <div class="t-cell">
              <div class="t-cell-label">着 時 刻</div>
              <div class="t-cell-val">${data.arrTime}</div>
            </div>
            <div class="t-cell w2">
              <div class="t-cell-label">号車・座席</div>
              <div class="t-cell-val">${seat}</div>
            </div>
            <div class="t-cell">
              <div class="t-cell-label">人 数</div>
              <div class="t-cell-val">${data.pax}名</div>
            </div>
            <div class="t-cell w3">
              <div class="t-cell-label">Minecraft ユーザー名</div>
              <div class="t-cell-val" style="font-family:monospace;letter-spacing:0.05em;">${mcid}</div>
            </div>
          </div>
          <div class="t-footer">
            <div>
              <div class="t-fare-label">運 賃 合 計</div>
              <div class="t-fare-total">¥${data.fare.toLocaleString()}<span style="font-size:0.65rem;font-weight:400;"> ${data.fareNote}</span></div>
            </div>
            <div class="t-no">
              <div>発行: ${new Date().toLocaleString('ja-JP',{hour12:false}).slice(0,16)}</div>
              <div>No. ${ticketNo}</div>
            </div>
          </div>
          <div class="t-magnetic"><div class="t-mag-stripe"></div></div>
        </div>
      </div>
    </div>`;
}

function closeModal() {
  document.getElementById('reserve-modal').classList.remove('open');
}

// ==================== 初期化 ====================

// localStorage の最新データを TIMETABLE に反映（検索ごとに呼ぶ）
function _syncTimetableFromStorage() {
  try {
    const raw = localStorage.getItem('kznm-timetable-v1');
    if (!raw) return;
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored.trains) || stored.trains.length === 0) return;
    if (typeof TIMETABLE === 'undefined') {
      window.TIMETABLE = stored; // ファイルが存在しない場合
    } else {
      TIMETABLE.trains = stored.trains;
    }
  } catch { /* ignore */ }
}

// 2秒ごとに localStorage を監視 → 変化があれば表示中の結果を自動再描画
let _ttSnap = null;
function _pollTimetable() {
  const raw = localStorage.getItem('kznm-timetable-v1');
  if (raw === _ttSnap) return; // 変化なし
  _ttSnap = raw;
  if (!raw) return;
  _syncTimetableFromStorage();
  // 表示中の検索結果があれば再描画
  const sr = document.getElementById('search-results');
  const dr = document.getElementById('date-train-results');
  if (sr && sr.querySelector('.train-card')) searchTrains();
  else if (dr && dr.querySelector('.train-card')) displayDateTrains();
}

document.addEventListener('DOMContentLoaded', () => {
  _syncTimetableFromStorage(); // 初期ロード時
  _ttSnap = localStorage.getItem('kznm-timetable-v1'); // 初期スナップ
  setInterval(_pollTimetable, 2000); // 2秒ごとに監視

  populateStationSelects();
  setMinDate();

  // 予約フォーム送信
  const form = document.getElementById('reserve-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      // MCID チェック
      const mcid = (document.getElementById('res-mcid')?.value || '').trim();
      if (!mcid) {
        const el = document.getElementById('res-mcid');
        if (el) { el.focus(); el.style.borderColor = '#c0392b'; }
        return;
      }
      if (document.getElementById('res-mcid')) {
        document.getElementById('res-mcid').style.borderColor = '';
      }
      // 団体パスワードチェック
      const expected = document.getElementById('modal-charter-pass-expected')?.value || '';
      if (expected) {
        const input = document.getElementById('res-charter-pass')?.value || '';
        const err   = document.getElementById('modal-charter-err');
        if (input !== expected) {
          if (err) err.style.display = '';
          return;
        }
        if (err) err.style.display = 'none';
      }
      // デジタル切符を生成して表示
      const data = _reserveRegistry[_currentReserveKey] || {};
      const ticketNo = 'RU' + Date.now().toString().slice(-8) + String(Math.floor(Math.random()*100)).padStart(2,'0');
      document.getElementById('digital-ticket').innerHTML = _generateTicket(data, _selectedSeat, mcid, ticketNo);
      _saveReservation(data, _selectedSeat, mcid, ticketNo);
      _showModalStep('ticket');
      // GitHub に非同期で push してステータス表示
      const ghStatusEl = document.getElementById('gh-sync-status');
      if (ghStatusEl) {
        ghStatusEl.style.cssText = 'display:block; margin-top:12px; padding:8px 14px; border-radius:6px; font-size:0.78rem; text-align:center; background:#f5f5f5; color:#888;';
        ghStatusEl.textContent = '⏳ 予約データをサーバーに送信中...';
      }
      _pushReservationsToGitHub().then(result => {
        if (!ghStatusEl) return;
        if (!result || result.msg === 'config_missing') {
          ghStatusEl.style.display = 'none';
        } else if (result.ok) {
          ghStatusEl.style.cssText = 'display:block; margin-top:12px; padding:8px 14px; border-radius:6px; font-size:0.78rem; text-align:center; background:#d4f0dc; color:#1a7a3a;';
          ghStatusEl.textContent = '✓ 予約データをサーバーに送信しました';
        } else {
          ghStatusEl.style.cssText = 'display:block; margin-top:12px; padding:8px 14px; border-radius:6px; font-size:0.78rem; text-align:center; background:#fef3f3; color:#c0392b;';
          ghStatusEl.textContent = '⚠ サーバー同期に失敗しました: ' + result.msg;
        }
      });
    });
  }

  // モーダル背景クリックで閉じる
  document.getElementById('reserve-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
});
