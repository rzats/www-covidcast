import { formatAPITime } from './utils';
import type { DataSensor } from './fetchData';
import type { RegionLevel } from './regions';
import type { TimeFrame } from './TimeFrame';
import { GeoPair, isArray, SourceSignalPair, TimePair } from './apimodel';

declare const process: { env: Record<string, string> };

const ENDPOINT = process.env.COVIDCAST_ENDPOINT_URL;

export const fetchOptions: RequestInit = process.env.NODE_ENV === 'development' ? { cache: 'force-cache' } : {};

export interface EpiDataResponse<T = Record<string, unknown>> {
  result: number;
  message: string;
  epidata: T[];
}

export interface EpiDataTreeResponse<T = Record<string, unknown>> {
  result: number;
  message: string;
  epidata: [Record<string, T[]>?];
}

function addParam<T extends { toString(): string }>(url: URL, key: string, pairs: T | readonly T[]): void {
  if (isArray(pairs)) {
    for (const s of pairs) {
      url.searchParams.append(key, s.toString());
    }
  } else {
    url.searchParams.set(key, pairs.toString());
  }
}

export interface EpiDataJSONRow {
  source: string;
  signal: string;

  geo_type: RegionLevel;
  geo_value: string;

  time_type: 'day' | 'week';
  time_value: number;

  value: number;
  stderr?: number;
  sample_size?: number;

  lag: number;
  issue: number;
}

function fetchImpl<T>(url: URL): Promise<T> {
  const urlGetS = url.toString();
  if (urlGetS.length < 4096) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fetch(url.toString(), fetchOptions).then((d) => d.json());
  }

  url.searchParams;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return fetch(url.pathname, {
    ...fetchOptions,
    method: 'POST',
    body: url.searchParams,
  }).then((d) => d.json());
}

export function callAPI(
  signal: SourceSignalPair | readonly SourceSignalPair[],
  geo: GeoPair | readonly GeoPair[],
  time: TimePair | readonly TimePair[],
  fields?: readonly (keyof EpiDataJSONRow)[],
): Promise<EpiDataResponse<EpiDataJSONRow>> {
  const url = new URL(ENDPOINT + '/covidcast/');
  addParam(url, 'signal', signal);
  addParam(url, 'geo', geo);
  addParam(url, 'time', time);

  if (fields) {
    url.searchParams.set('fields', fields.join(','));
  }
  return fetchImpl(url);
}

export function callTreeAPI(
  signal: SourceSignalPair | readonly SourceSignalPair[],
  geo: GeoPair | readonly GeoPair[],
  time: TimePair | readonly TimePair[],
  fields?: readonly (keyof EpiDataJSONRow)[],
): Promise<EpiDataTreeResponse<EpiDataJSONRow>> {
  const url = new URL(ENDPOINT + '/covidcast/');
  addParam(url, 'signal', signal);
  addParam(url, 'geo', geo);
  addParam(url, 'time', time);

  if (fields) {
    url.searchParams.set('fields', fields.join(','));
  }
  url.searchParams.set('format', 'tree');
  return fetchImpl(url);
}

export interface EpiDataTrendRow {
  geo_type: RegionLevel;
  geo_value: string;

  signal_source: string;
  signal_signal: string;

  value?: number;

  basis_date?: number;
  basis_value?: number;
  basis_trend: 'unknown' | 'increasing' | 'decreasing' | 'steady';

  min_date?: number;
  min_value?: number;
  min_trend: 'unknown' | 'increasing' | 'decreasing' | 'steady';

  max_date?: number;
  max_value?: number;
  max_trend: 'unknown' | 'increasing' | 'decreasing' | 'steady';
}

export function callTrendAPI(
  signal: SourceSignalPair | readonly SourceSignalPair[],
  geo: GeoPair | readonly GeoPair[],
  date: Date,
  window: TimeFrame,
  fields?: readonly (keyof EpiDataTrendRow)[],
): Promise<EpiDataResponse<EpiDataTrendRow>> {
  const url = new URL(ENDPOINT + '/covidcast/trend');
  addParam(url, 'signal', signal);
  addParam(url, 'geo', geo);
  url.searchParams.set('date', formatAPITime(date));
  url.searchParams.set('window', window.range);

  if (fields) {
    url.searchParams.set('fields', fields.join(','));
  }
  return fetchImpl(url);
}

export interface EpiDataCorrelationRow {
  geo_type: RegionLevel;
  geo_value: string;

  signal_source: string;
  signal_signal: string;

  lag: number;
  r2: number;

  /**
   * y = slope * x + intercept
   */
  slope: number;
  /**
   * y = slope * x + intercept
   */
  intercept: number;

  /**
   * number of dates used for the regression line
   */
  samples: number;
}

export function callCorrelationAPI(
  reference: SourceSignalPair,
  others: SourceSignalPair | readonly SourceSignalPair[],
  geo: GeoPair | readonly GeoPair[],
  window: TimeFrame,
  lag?: number,
  fields?: readonly (keyof EpiDataCorrelationRow)[],
): Promise<EpiDataResponse<EpiDataCorrelationRow>> {
  const url = new URL(ENDPOINT + '/covidcast/correlation');
  url.searchParams.set('reference', reference.toString());
  addParam(url, 'others', others);
  addParam(url, 'geo', geo);
  url.searchParams.set('window', window.range);
  if (lag != null) {
    url.searchParams.set('lag', lag.toString());
  }
  if (fields) {
    url.searchParams.set('fields', fields.join(','));
  }
  return fetchImpl(url);
}

export interface EpiDataBackfillRow {
  time_value: number;
  issue: number;

  value: number;
  sample_size?: number;

  value_rel_change?: number;
  sample_size_rel_change?: number;

  is_anchor?: boolean;
  value_completeness?: number;
  sample_size_completeness?: number;
}

export function callBackfillAPI(
  signal: SourceSignalPair,
  time: TimePair,
  geo: GeoPair,
  anchorLag?: number,
  fields?: readonly (keyof EpiDataBackfillRow)[],
): Promise<EpiDataResponse<EpiDataBackfillRow>> {
  const url = new URL(ENDPOINT + '/covidcast/backfill');
  url.searchParams.set('signal', signal.toString());
  url.searchParams.set('geo', geo.toString());
  url.searchParams.set('time', time.toString());

  if (anchorLag != null) {
    url.searchParams.set('anchor_lag', anchorLag.toString());
  }
  if (fields) {
    url.searchParams.set('fields', fields.join(','));
  }
  return fetchImpl(url);
}

export interface EpiDataMetaEntry {
  min_time: number;
  max_time: number;
  max_value: number;
  stdev_value: number;
  mean_value: number;
  max_issue: number;

  data_source: string;
  signal: string;
  time_type: string;
  geo_type: RegionLevel;
}
/**
 */
export function callMetaAPI(
  dataSignals: DataSensor[],
  fields: string[],
  filters: Record<string, string>,
): Promise<EpiDataResponse<EpiDataMetaEntry>> {
  const url = new URL(ENDPOINT + '/covidcast_meta/');
  const data = new FormData();
  if (dataSignals && dataSignals.length > 0) {
    const signals = dataSignals
      .map((d) =>
        d.isCasesOrDeath
          ? Object.values(d.casesOrDeathSignals ?? {})
              .map((s) => `${d.id}:${s}`)
              .join(',')
          : `${d.id}:${d.signal}`,
      )
      .join(',');
    url.searchParams.set('signals', signals);
  }
  if (fields && fields.length > 0) {
    url.searchParams.set('fields', fields.join(','));
  }
  Object.entries(filters || {}).forEach((entry) => {
    data.set(entry[0], entry[1]);
    url.searchParams.set(entry[0], entry[1]);
  });
  return fetchImpl(url);
}

export interface EpiDataSignalStatusRow {
  name: string;
  source: string;
  covidcast_signal: string;
  latest_issue: string; // iso
  latest_time_value: string; // iso
  coverage: Record<RegionLevel, { date: string; /* iso */ count: number }[]>;
}
/**
 *
 * @returns
 */
export function callSignalDashboardStatusAPI(): Promise<EpiDataResponse<EpiDataSignalStatusRow>> {
  const url = new URL(ENDPOINT + '/signal_dashboard_status/');
  return fetchImpl(url);
}
