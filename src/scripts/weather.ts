/**
 * 天气建议引擎（服务端与客户端共用，避免逻辑重复）
 *
 * 设计原则：不输出气象术语，直接给出游客「可执行」的建议。
 * 输入 = 当前实况 + 今日极值 + 海况；输出 = 出行穿搭 / 游玩安排 / 随身物品 / 风险提醒。
 * 规则：不满足条件的条目直接隐藏（例如不下雨就不提示雨伞）。
 */

/** Open-Meteo WMO 天气代码 → 语义分类 */
export const WEATHER_CATEGORY: Record<number, string> = {
  0: 'clear',
  1: 'mainlyClear',
  2: 'partlyCloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'freezingDrizzle',
  57: 'freezingDrizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'freezingRain',
  67: 'freezingRain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'showers',
  81: 'showers',
  82: 'showers',
  85: 'snowShowers',
  86: 'snowShowers',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

export function categoryOf(code: number): string {
  return WEATHER_CATEGORY[code] ?? 'partlyCloudy';
}

/** 由风速（km/h）估算蒲福风级 0–12 */
export function beaufort(kmh: number): number {
  const thresholds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117];
  let force = 0;
  for (const t of thresholds) if (kmh >= t) force += 1;
  return force;
}

export interface WeatherNow {
  code: number;
  isDay: number;
  temp: number;
  feels: number;
  humidity: number;
  windKmh: number;
  gustKmh: number;
  precip: number;
}

export interface WeatherDay {
  code: number;
  max: number;
  min: number;
  precipProb: number;
  precipSum: number;
  uv: number;
  windMax: number;
  gustMax: number;
  sunrise: string;
  sunset: string;
}

export interface MarineInfo {
  waveHeight: number | null;
  seaTemp: number | null;
}

/** i18n 文案表（键名见各语言 weather 段） */
export interface AdviceCopy {
  [key: string]: string;
}

export interface Advice {
  /** 风险提醒：有才显示 */
  alerts: string[];
  /** 出行穿搭 */
  outfit: string[];
  /** 游玩安排 */
  plan: string[];
  /** 随身物品 */
  items: string[];
}

export function buildAdvice(
  now: WeatherNow,
  day: WeatherDay,
  marine: MarineInfo,
  c: AdviceCopy,
): Advice {
  const cat = categoryOf(day.code);
  const force = beaufort(Math.max(now.windKmh, day.windMax));
  const rainy =
    cat === 'drizzle' ||
    cat === 'rain' ||
    cat === 'freezingRain' ||
    cat === 'freezingDrizzle' ||
    cat === 'showers';
  const heavy =
    day.code === 63 || day.code === 65 || day.code === 81 || day.code === 82 || day.precipSum >= 10;
  const thunder = cat === 'thunderstorm';
  const foggy = cat === 'fog';
  const sunny = cat === 'clear' || cat === 'mainlyClear';
  const swing = day.max - day.min;
  /** 降水概率高但当前天气代码未判定为降雨时，仍应提示雨具 */
  const likelyRain = day.precipProb >= 60;

  const alerts: string[] = [];
  const outfit: string[] = [];
  const plan: string[] = [];
  const items: string[] = [];
  const add = (arr: string[], v?: string) => {
    if (v && !arr.includes(v)) arr.push(v);
  };

  // ---------- 风险提醒（优先级最高，置顶展示）----------
  if (thunder) add(alerts, c.alThunder);
  if (heavy) add(alerts, c.alRain);
  if (force >= 7) add(alerts, c.alWind);
  if (day.uv >= 11) add(alerts, c.alUv);
  if (day.max >= 35) add(alerts, c.alHeat);
  if (foggy) add(alerts, c.alFog);
  if (marine.waveHeight != null && marine.waveHeight >= 2) add(alerts, c.alSea);

  // ---------- 出行穿搭 ----------
  if (day.max >= 32) add(outfit, c.oHeat);
  else if (day.max <= 10) add(outfit, c.oCold);
  else add(outfit, c.oMild);
  // 只有夜间确实偏凉时，备外套才有意义（避免大热天让人带外套）
  if (swing > 8 && day.min <= 18) add(outfit, c.oSwing);
  if (rainy || likelyRain) add(outfit, c.oRain);
  if (day.uv >= 5) add(outfit, c.oUv);
  if (force >= 5) add(outfit, c.oWind);

  // ---------- 游玩安排 ----------
  if (thunder) add(plan, c.pThunder);
  else if (heavy) add(plan, c.pHeavyRain);
  else if (rainy) add(plan, c.pLightRain);
  else if (foggy) add(plan, c.pFog);
  else if (likelyRain) add(plan, c.pRainProb);
  else if (sunny) add(plan, c.pClear);
  else add(plan, c.pCloudy);
  if (day.max >= 32) add(plan, c.pHeat);
  if (force >= 7) add(plan, c.pWind7);
  else if (force >= 5) add(plan, c.pWind5);
  if (marine.waveHeight != null) {
    if (marine.waveHeight >= 1.5) add(plan, c.pSeaRough);
    else if (marine.waveHeight < 0.8) add(plan, c.pSeaCalm);
  }

  // ---------- 随身物品 ----------
  if (rainy || likelyRain) add(items, force >= 6 ? c.iRaincoat : c.iUmbrella);
  if (day.uv >= 5 || sunny) add(items, c.iSun);
  if (day.max >= 28) add(items, c.iWater);
  if ((swing > 8 && day.min <= 18) || day.max <= 22) add(items, c.iJacket);
  if (day.max <= 10) add(items, c.iWarm);
  if (force >= 5) add(items, c.iWind);
  if (marine.waveHeight != null && marine.waveHeight >= 1.5) add(items, c.iSea);
  if (foggy) add(items, c.iMask);

  return { alerts, outfit, plan, items };
}

/** 从 Open-Meteo 响应中解析出引擎所需的输入 */
export function parseWeather(data: any): { now: WeatherNow; day: WeatherDay } | null {
  if (!data || !data.current || !data.daily) return null;
  const c = data.current;
  const d = data.daily;
  const now: WeatherNow = {
    code: c.weather_code ?? 0,
    isDay: c.is_day ?? 1,
    temp: c.temperature_2m ?? 0,
    feels: c.apparent_temperature ?? c.temperature_2m ?? 0,
    humidity: c.relative_humidity_2m ?? 0,
    windKmh: c.wind_speed_10m ?? 0,
    gustKmh: c.wind_gusts_10m ?? 0,
    precip: c.precipitation ?? 0,
  };
  const day: WeatherDay = {
    code: d.weather_code?.[0] ?? now.code,
    max: d.temperature_2m_max?.[0] ?? now.temp,
    min: d.temperature_2m_min?.[0] ?? now.temp,
    precipProb: d.precipitation_probability_max?.[0] ?? 0,
    precipSum: d.precipitation_sum?.[0] ?? 0,
    uv: d.uv_index_max?.[0] ?? 0,
    windMax: d.wind_speed_10m_max?.[0] ?? now.windKmh,
    gustMax: d.wind_gusts_10m_max?.[0] ?? now.gustKmh,
    sunrise: d.sunrise?.[0] ?? '',
    sunset: d.sunset?.[0] ?? '',
  };
  return { now, day };
}

/** 从 Open-Meteo Marine 响应中解析海况 */
export function parseMarine(data: any): MarineInfo {
  const c = data?.current;
  return {
    waveHeight: typeof c?.wave_height === 'number' ? c.wave_height : null,
    seaTemp: typeof c?.sea_surface_temperature === 'number' ? c.sea_surface_temperature : null,
  };
}

/* ============================================================
 * 潮汐（数据源：Open-Meteo Marine 的 sea_level_height_msl 天文潮位）
 * ========================================================== */

export interface TideEvent {
  kind: 'high' | 'low';
  /** 本地时间 YYYY-MM-DDTHH:mm */
  time: string;
  /** 潮位，单位 m（相对平均海平面） */
  height: number;
}

export interface TideInfo {
  /** 当前潮位（小时值线性插值） */
  current: number | null;
  /** 涨潮 / 退潮 / 平潮 */
  trend: 'rising' | 'falling' | 'steady';
  /** 全序列的高潮低潮时刻 */
  events: TideEvent[];
  /** 今日（本地日期）的高潮低潮 */
  today: TideEvent[];
  /** 今日潮差（相邻高低潮位之差的最大值） */
  range: number | null;
  /** 大潮 / 中潮 / 小潮 */
  scale: 'spring' | 'medium' | 'neap' | null;
  /** 展示窗口内的逐小时潮位，用于绘图 */
  series: { time: string; height: number }[];
  next: TideEvent | null;
  nextHigh: TideEvent | null;
  nextLow: TideEvent | null;
  /** 距下一个潮汐事件的小时数 */
  hoursToNext: number | null;
  windowFrom: string;
  windowTo: string;
  /** 绘图窗口起点相对「现在」往前推的分钟数，用于定位「现在」标记 */
  backMinutes: number;
}

const MINUTE_MS = 60000;

/** "YYYY-MM-DDTHH:mm" → 分钟数（不做时区换算，仅用于差值计算） */
export function toMinutes(iso: string): number {
  const [date, time = '00:00'] = String(iso).split('T');
  const [y, mo, d] = (date || '').split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return Date.UTC(y || 1970, (mo || 1) - 1, d || 1, hh || 0, mm || 0) / MINUTE_MS;
}

/** 分钟数 → "YYYY-MM-DDTHH:mm" */
export function fromMinutes(min: number): string {
  const d = new Date(min * MINUTE_MS);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
  );
}

/** 抛物线顶点：把「整点极值」细化到小时内的小数位置（±0.5 小时） */
function vertexOffset(y0: number, y1: number, y2: number): number {
  const denom = y0 - 2 * y1 + y2;
  if (Math.abs(denom) < 1e-9) return 0;
  return Math.max(-0.5, Math.min(0.5, (0.5 * (y0 - y2)) / denom));
}

export const EMPTY_TIDE: TideInfo = {
  current: null,
  trend: 'steady',
  events: [],
  today: [],
  range: null,
  scale: null,
  series: [],
  next: null,
  nextHigh: null,
  nextLow: null,
  hoursToNext: null,
  windowFrom: '',
  windowTo: '',
  backMinutes: 0,
};

/** 默认绘图窗口：现在往前 3 小时、往后 21 小时，共 24 小时 */
export function parseTide(data: any, nowIso: string, from = 180, to = 1260): TideInfo {
  const times: string[] = data?.hourly?.time ?? [];
  const raw: any[] = data?.hourly?.sea_level_height_msl ?? [];
  const pts: { time: string; height: number }[] = [];
  for (let i = 0; i < times.length; i++) {
    const h = raw[i];
    if (typeof h === 'number' && Number.isFinite(h)) pts.push({ time: times[i], height: h });
  }
  if (pts.length < 24) return EMPTY_TIDE;

  // ---- 极值识别 ----
  // 先用 3 小时滑动平均滤掉曲线上的小涟漪，再用 5 点窗口找真正的转折点，
  // 否则同一次低潮里的小起伏会被误判成「多出来的一次高潮 / 低潮」。
  const sm = pts.map(
    (_, i) =>
      (pts[Math.max(0, i - 1)].height + pts[i].height + pts[Math.min(pts.length - 1, i + 1)].height) / 3,
  );

  const candidates: TideEvent[] = [];
  for (let i = 2; i < pts.length - 2; i++) {
    const h = sm[i];
    const p0 = sm[i - 2];
    const p1 = sm[i - 1];
    const p3 = sm[i + 1];
    const p4 = sm[i + 2];
    const isHigh = h > p1 && h >= p3 && h >= p0 && h >= p4;
    const isLow = h < p1 && h <= p3 && h <= p0 && h <= p4;
    if (!isHigh && !isLow) continue;
    // 高度取原始序列 ±1 小时内的极值，比平滑值更贴近真实潮位
    const near = [pts[i - 1].height, pts[i].height, pts[i + 1].height];
    const height = isHigh ? Math.max(...near) : Math.min(...near);
    const off = vertexOffset(p1, h, p3);
    candidates.push({
      kind: isHigh ? 'high' : 'low',
      time: fromMinutes(toMinutes(pts[i].time) + Math.round(off * 60)),
      height,
    });
  }

  // ---- 整理：强制高潮 / 低潮交替；同类相邻时保留更极端的一次 ----
  const events: TideEvent[] = [];
  for (const e of candidates) {
    const last = events[events.length - 1];
    if (last && last.kind === e.kind) {
      const moreExtreme = e.kind === 'high' ? e.height > last.height : e.height < last.height;
      if (moreExtreme) events[events.length - 1] = e;
      continue;
    }
    events.push(e);
  }
  if (events.length < 4) return EMPTY_TIDE;

  // ---- 剔除振幅过小的「假极值」 ----
  // 一次潮汐过程中的小起伏会生成振幅极小的相邻极值（如 0.09m → 0.04m → 0.08m），
  // 对游客没有意义，这里按相邻振幅阈值把它合并掉。
  const ampsOf = (list: TideEvent[]) =>
    list.slice(0, -1).map((e, i) => Math.abs(list[i + 1].height - e.height));
  const limit = Math.max(0.05, Math.max(...ampsOf(events)) * 0.35);

  for (let guard = 0; guard < 60; guard++) {
    let changed = false;
    const amps = ampsOf(events);
    for (let i = 1; i < events.length - 1; i++) {
      if (amps[i - 1] < limit && amps[i] < limit) {
        events.splice(i, 1);
        changed = true;
        break;
      }
    }
    if (!changed) {
      for (let i = 1; i < events.length; i++) {
        if (events[i].kind === events[i - 1].kind) {
          const keepPrev =
            events[i - 1].kind === 'high'
              ? events[i - 1].height >= events[i].height
              : events[i - 1].height <= events[i].height;
          events.splice(keepPrev ? i : i - 1, 1);
          changed = true;
          break;
        }
      }
    }
    if (!changed) break;
  }
  if (events.length < 4) return EMPTY_TIDE;

  const nowMin = nowIso ? toMinutes(nowIso) : toMinutes(events[0].time);

  // ---- 今日事件 & 潮差 ----
  const dayKey = (nowIso || events[0].time).slice(0, 10);
  const today = events.filter((e) => e.time.slice(0, 10) === dayKey);

  // 潮差取「相邻高低潮位之差」，比自然日极值更贴近真实潮差
  let range: number | null = null;
  for (let i = 0; i < events.length - 1; i++) {
    const a = events[i];
    const b = events[i + 1];
    if (a.kind === b.kind) continue;
    if (a.time.slice(0, 10) !== dayKey && b.time.slice(0, 10) !== dayKey) continue;
    const amp = Math.abs(a.height - b.height);
    if (range == null || amp > range) range = amp;
  }

  // ---- 大潮 / 小潮：与近 7 天最大潮差比较 ----
  let maxAmp = 0;
  for (let i = 0; i < events.length - 1; i++) {
    if (events[i].kind === events[i + 1].kind) continue;
    maxAmp = Math.max(maxAmp, Math.abs(events[i].height - events[i + 1].height));
  }
  let scale: TideInfo['scale'] = null;
  if (range != null && maxAmp > 0) {
    const ratio = range / maxAmp;
    scale = ratio >= 0.9 ? 'spring' : ratio <= 0.72 ? 'neap' : 'medium';
  }

  // ---- 当前潮位与涨退 ----
  let current: number | null = null;
  let trend: TideInfo['trend'] = 'steady';
  let idx = -1;
  for (let i = 0; i < pts.length; i++) if (toMinutes(pts[i].time) <= nowMin) idx = i;
  if (idx >= 0 && idx < pts.length - 1) {
    const a = pts[idx];
    const b = pts[idx + 1];
    const span = toMinutes(b.time) - toMinutes(a.time);
    const f = span > 0 ? (nowMin - toMinutes(a.time)) / span : 0;
    current = a.height + (b.height - a.height) * f;
    const slope = pts[Math.min(pts.length - 1, idx + 1)].height - pts[Math.max(0, idx - 1)].height;
    trend = slope > 0.04 ? 'rising' : slope < -0.04 ? 'falling' : 'steady';
  }

  const upcoming = events.filter((e) => toMinutes(e.time) > nowMin);
  const next = upcoming[0] ?? null;
  const nextHigh = upcoming.find((e) => e.kind === 'high') ?? null;
  const nextLow = upcoming.find((e) => e.kind === 'low') ?? null;

  const windowFrom = fromMinutes(nowMin - from);
  const windowTo = fromMinutes(nowMin + to);
  const series = pts.filter((p) => {
    const m = toMinutes(p.time);
    return m >= nowMin - from && m <= nowMin + to;
  });

  return {
    current,
    trend,
    events,
    today,
    range,
    scale,
    series,
    next,
    nextHigh,
    nextLow,
    hoursToNext: next ? (toMinutes(next.time) - nowMin) / 60 : null,
    windowFrom,
    windowTo,
    backMinutes: from,
  };
}

/** 潮汐相关的安全建议（与天气建议分开，放在潮汐板块内） */
export function tideAdvice(tide: TideInfo, c: AdviceCopy): string[] {
  const out: string[] = [];
  const push = (v?: string) => {
    if (v && !out.includes(v)) out.push(v);
  };
  if (tide.current == null || !tide.next) return out;

  const soon = tide.hoursToNext != null && tide.hoursToNext <= 1.5;
  if (soon) push(tide.next.kind === 'high' ? c.tNearHigh : c.tNearLow);
  else if (tide.trend === 'rising') push(c.tRising);
  else if (tide.trend === 'falling') push(c.tFalling);

  if (tide.scale === 'spring') push(c.tSpring);
  return out;
}

/**
 * 潮汐曲线。
 * 曲线用「0–100 归一化坐标 + preserveAspectRatio=none」拉伸铺满容器，
 * 文字则改用 HTML 叠加层，这样在手机与桌面端都不会被缩放成小字。
 */
export function tideChartHtml(
  tide: TideInfo,
  labels: { now: string; unit: string; mean: string },
): string {
  const s = tide.series;
  if (s.length < 3) return '';

  const H = 170; // 绘图区高度（px），用于换算刻度长度
  const t0 = toMinutes(s[0].time);
  const t1 = toMinutes(s[s.length - 1].time);
  const hs = s.map((p) => p.height);
  let lo = Math.min(...hs);
  let hi = Math.max(...hs);
  const padv = Math.max((hi - lo) * 0.45, 0.06);
  lo -= padv;
  hi += padv;

  const X = (t: number) => ((t - t0) / (t1 - t0)) * 100;
  const Y = (h: number) => (1 - (h - lo) / (hi - lo)) * 100;

  const line = s.map((p) => `${X(toMinutes(p.time)).toFixed(2)},${Y(p.height).toFixed(2)}`).join(' ');
  const area = `0,100 ${line} 100,100`;

  const esc = (v: unknown) =>
    String(v).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m] as string));

  let grid = '';
  let axis = '';
  for (let t = Math.ceil(t0 / 360) * 360; t <= t1; t += 360) {
    const x = X(t);
    grid += `<line x1="${x.toFixed(2)}" y1="0" x2="${x.toFixed(2)}" y2="100" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="2 4" vector-effect="non-scaling-stroke" />`;
    axis +=
      `<div class="absolute text-[10px]" style="left:${x.toFixed(2)}%;top:100%;transform:translate(-50%,4px);color:var(--text-muted);white-space:nowrap;">` +
      esc(fromMinutes(t).slice(11, 16)) +
      `</div>`;
  }

  let mean = '';
  if (lo < 0 && hi > 0) {
    const y = Y(0);
    mean =
      `<line x1="0" y1="${y.toFixed(2)}" x2="100" y2="${y.toFixed(2)}" stroke="var(--border-color)" stroke-width="1" vector-effect="non-scaling-stroke" />` +
      `<div class="absolute text-[10px]" style="left:0;top:${y.toFixed(2)}%;transform:translateY(-115%);color:var(--text-muted);white-space:nowrap;">${esc(labels.mean)}</div>`;
  }

  let marks = '';
  let overlays = '';
  for (const e of tide.events) {
    const m = toMinutes(e.time);
    if (m < t0 || m > t1) continue;
    const x = X(m);
    const y = Y(e.height);
    const isHigh = e.kind === 'high';
    // 竖线刻度：非等比缩放下仍保持长度一致（12px）
    const len = (12 / H) * 100;
    const y1 = isHigh ? y - len : y;
    const y2 = isHigh ? y : y + len;
    marks +=
      `<line x1="${x.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke" />`;

    const clampX = Math.max(8, Math.min(92, x));
    const pos = isHigh
      ? `top:${y.toFixed(2)}%;transform:translate(-50%,-100%) translateY(-10px);`
      : `top:${y.toFixed(2)}%;transform:translate(-50%,0) translateY(10px);`;
    overlays +=
      `<div class="absolute text-center" style="left:${clampX.toFixed(2)}%;${pos}white-space:nowrap;">` +
      `<div class="text-[11px] font-semibold" style="color:var(--text-primary);">${esc(e.time.slice(11, 16))}</div>` +
      `<div class="text-[10px]" style="color:var(--text-muted);">${esc(e.height.toFixed(2))}${esc(labels.unit)}</div>` +
      `</div>`;
  }

  let nowMark = '';
  if (tide.current != null && tide.next) {
    const nowMin = toMinutes(tide.windowFrom) + (tide.backMinutes || 0);
    if (nowMin >= t0 && nowMin <= t1) {
      const x = X(nowMin);
      const y = Y(tide.current);
      nowMark =
        `<line x1="${x.toFixed(2)}" y1="0" x2="${x.toFixed(2)}" y2="100" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.75" vector-effect="non-scaling-stroke" />`;
      const clampX = Math.max(8, Math.min(92, x));
      overlays +=
        `<div class="absolute text-[10px] font-semibold" style="left:${clampX.toFixed(2)}%;top:0;transform:translate(-50%,-100%) translateY(-2px);color:var(--accent);white-space:nowrap;">${esc(labels.now)}</div>` +
        `<div class="absolute rounded-full" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;width:9px;height:9px;transform:translate(-50%,-50%);background:var(--accent);box-shadow:0 0 0 3px var(--card-bg);"></div>`;
    }
  }

  return (
    `<div class="relative" style="height:${H}px;">` +
    `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;">` +
    grid +
    mean +
    `<polygon points="${area}" fill="color-mix(in srgb, var(--accent) 14%, transparent)" />` +
    `<polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />` +
    marks +
    nowMark +
    `</svg>` +
    overlays +
    axis +
    `</div>`
  );
}

