import { KNOWN_LICENSES } from './api';
import type { EpiDataMetaInfo, EpiDataMetaSourceInfo, EpiDataMetaStatsInfo, SignalCategory } from './api';
import { parseAPIDateAndWeek } from './utils';
import type { RegionLevel } from './regions';
import { isCountSignal } from './signals';
import { ALL_TIME_FRAME, TimeFrame } from './TimeFrame';
import type { Sensor, EpiDataMetaParsedInfo, SensorLike } from './sensor';
import { units, colorScales, vegaColorScales, yAxis } from './sensor';
import { formatSpecifiers, formatter } from '../formats';
import { marked } from 'marked';
import { isCasesSignal } from './signals';

function toKey(source: string, signal: string) {
  return `${source}-${signal}`;
}

const INVALID_STATS: EpiDataMetaStatsInfo = { min: 0, max: 100, mean: 50, stdev: 10 };

const MAGIC_MIN_STATS = 0.14;

function extractStats(signal: string, entry: EpiDataMetaInfo | null, level?: RegionLevel): EpiDataMetaStatsInfo {
  if (!entry || Object.keys(entry.geo_types).length === 0) {
    return INVALID_STATS;
  }
  const isCount = isCountSignal(signal);
  if (isCount && level != null) {
    // use level specific ones
    const byLevel = entry.geo_types[level];
    if (byLevel) {
      return byLevel;
    }
  }
  const countyLevel = entry.geo_types.county;
  if (countyLevel) {
    return countyLevel;
  }
  const nationLevel = entry.geo_types.nation;
  if (nationLevel) {
    return nationLevel;
  }
  // take first one
  return [...Object.values(entry.geo_types)][0]!;
}

function parse(d: EpiDataMetaInfo): EpiDataMetaParsedInfo {
  const minTime = parseAPIDateAndWeek(d.min_time);
  const maxTime = parseAPIDateAndWeek(d.max_time);
  const maxIssue = parseAPIDateAndWeek(d.max_issue);
  return {
    ...d,
    maxIssue: maxIssue.date,
    maxIssueWeek: maxIssue.week,
    minTime: minTime.date,
    minWeek: minTime.week,
    maxTime: maxTime.date,
    maxWeek: maxTime.week,
    timeFrame: new TimeFrame(minTime.date, maxTime.date, minTime.week, maxTime.week),
  };
}

function toValueDomain(stats: EpiDataMetaStatsInfo, signal: string, extended: boolean): number[] {
  // Customize min max values for deaths
  const min = isCountSignal(signal) ? MAGIC_MIN_STATS : 0;
  const r = [Math.max(min, stats.mean - 3 * stats.stdev), stats.mean + 3 * stats.stdev];

  if (extended) {
    // extended option for extra color scale
    r.push(stats.mean + 6 * stats.stdev);
  }
  return r;
}

function generateCredits(license: EpiDataMetaSourceInfo['license']) {
  if (!license) {
    return 'We are happy for you to use this data in products and publications.';
  }
  const known = KNOWN_LICENSES[license as keyof typeof KNOWN_LICENSES];
  if (known) {
    return `We are happy for you to use this data in products and publications under the terms of the <a href="${known.link}">${known.name}</a>.`;
  }
  return marked.parseInline(license);
}

export interface SensorSource
  extends Readonly<Omit<EpiDataMetaSourceInfo, 'signals' | 'reference_signal' | 'db_source'>> {
  readonly sensors: readonly Sensor[];
  readonly referenceSensor?: Sensor;
  readonly credits: string;
}

function findRawSignal(sensor: Sensor, sensors: Sensor[]) {
  if (!sensor.meta.is_smoothed) {
    return undefined;
  }
  const meta = sensor.meta;
  const raw = sensors.find(
    (o) =>
      o.meta.signal_basename === meta.signal_basename &&
      o.meta.is_cumulative == meta.is_cumulative &&
      o.meta.is_weighted == meta.is_weighted &&
      !o.meta.is_smoothed &&
      o.meta.format == meta.format,
  );
  return raw;
}

function deriveMetaSensors(metadata: EpiDataMetaSourceInfo[]): {
  list: Sensor[];
  map: Map<string, Sensor>;
  sources: SensorSource[];
} {
  const sources = metadata
    .map((sm): SensorSource => {
      const credits = generateCredits(sm.license);
      const sensors: Sensor[] = sm.signals.map((m) => {
        const parsed = parse(m);
        const key = toKey(m.source, m.signal);
        const s: Sensor = {
          key,
          active: m.active,
          id: m.source,
          signal: m.signal,
          name: m.name,
          description: m.description ? marked.parse(m.description.trim()) : '',
          signalTooltip: m.short_description ? marked.parseInline(m.short_description) : '',
          valueScaleFactor: m.format === 'fraction' ? 100 : 1,
          format: m.format ?? 'raw',
          highValuesAre: m.high_values_are ?? 'neutral',
          hasStdErr: m.has_stderr,
          is7DayAverage: m.is_smoothed,
          dataSourceName: sm.name,
          levels: Object.keys(m.geo_types) as RegionLevel[],
          type: m.category ?? 'other',
          xAxis: m.time_label,
          yAxis: m.value_label || yAxis[m.format] || yAxis.raw,
          unit: units[m.format] || units.raw,
          unitShort:
            m.format === 'per100k' ? 'per 100k' : m.format === 'percent' ? 'per 100' : units[m.format] || units.raw,
          colorScale: colorScales[m.high_values_are],
          vegaColorScale: vegaColorScales[m.high_values_are],
          extendedColorScale: isCasesSignal(key),
          links: sm.link.map((d) => `<a href="${d.href}">${d.alt}</a>`),
          credits: credits,
          formatValue: formatter[m.format] || formatter.raw,
          formatSpecifier: formatSpecifiers[m.format] || formatSpecifiers.raw,
          isWeeklySignal: parsed.time_type === 'week',
          meta: parsed,
        };
        return s;
      });

      // inject raw versions and cumulative versions
      for (const s of sensors) {
        const raw = findRawSignal(s, sensors);
        if (raw) {
          Object.assign(s, {
            rawSensor: raw,
            rawSignal: raw.signal,
          });
        }
      }

      return {
        ...sm,
        link: sm.link,
        sensors,
        description: sm.description ? marked.parse(sm.description.trim()) : '',
        credits,
        referenceSensor: sm.reference_signal ? sensors.find((d) => d.signal === sm.reference_signal) : undefined,
      };
    })
    .sort((a, b) => a.source.localeCompare(b.source));

  const sensors = sources.map((d) => d.sensors).flat();
  sensors.sort((a, b) => a.key.localeCompare(b.key));

  const byKey = new Map(sensors.map((s) => [s.key, s]));

  return { list: sensors, map: byKey, sources };
}

export class MetaDataManager {
  private readonly lookup: ReadonlyMap<string, Sensor>;
  readonly metaSensors: readonly Sensor[];
  readonly metaSources: readonly SensorSource[];

  constructor(metadata: EpiDataMetaSourceInfo[]) {
    const r = deriveMetaSensors(metadata);
    this.metaSensors = r.list;
    this.metaSources = r.sources;
    this.lookup = r.map;
  }

  getDefaultCasesSignal(): Sensor | null {
    return this.getSensor({ id: 'jhu-csse', signal: 'confirmed_7dav_incidence_prop' });
  }
  getDefaultDeathSignal(): Sensor | null {
    return this.getSensor({ id: 'jhu-csse', signal: 'deaths_7dav_incidence_prop' });
  }

  getSensorsOfType(type: SignalCategory): Sensor[] {
    return this.metaSensors.filter((d) => d.type === type);
  }

  getSource(sensor: SensorLike | string): SensorSource | null {
    const s = this.getSensor(sensor);
    return s ? this.metaSources.find((d) => d.source === s.id) ?? null : null;
  }

  getSensor(sensor: SensorLike | string): Sensor | null {
    const r = this.lookup.get(typeof sensor === 'string' ? sensor : toKey(sensor.id, sensor.signal));
    return r ?? null;
  }

  getMetaData(sensor: SensorLike | string): EpiDataMetaParsedInfo | null {
    const r = this.getSensor(sensor);
    return r?.meta ?? null;
  }

  getLevels(sensor: SensorLike): RegionLevel[] {
    const entry = this.getMetaData(sensor);
    return entry ? (Object.keys(entry.geo_types) as RegionLevel[]) : ['county'];
  }

  getStats(sensor: SensorLike, level?: RegionLevel): EpiDataMetaStatsInfo {
    const entry = this.getMetaData(sensor);
    return extractStats(sensor.signal, entry, level);
  }

  getTimeFrame(sensor: string | SensorLike): TimeFrame {
    const entry = this.getMetaData(sensor);
    if (!entry) {
      return ALL_TIME_FRAME;
    }
    return entry.timeFrame;
  }

  getValueDomain(sensor: SensorLike, level: RegionLevel, { extended = false }: { extended?: boolean } = {}): number[] {
    const stats = this.getStats(sensor, level);
    return toValueDomain(stats, sensor.signal, extended);
  }
}
