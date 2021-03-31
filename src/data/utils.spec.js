import { formatAPITime, parseAPITime, generateCorrelationMetrics } from './utils';
import { cliTestData, deathsTestData, cases_national, safegraph_full_time_national } from './__test__/testData';

describe('formatAPITime', () => {
  test('matches api format', () => {
    const d = new Date(2020, 1, 2);
    expect(formatAPITime(d)).toBe('20200202');
  });
});

describe('parseAPITime', () => {
  test('default', () => {
    const d = new Date(2020, 1, 2);
    expect(parseAPITime(20200202).valueOf()).toBe(d.valueOf());
  });
  test('round trip', () => {
    const d = new Date(2020, 5, 8);
    expect(parseAPITime(formatAPITime(d)).valueOf()).toBe(d.valueOf());
  });
  test('strip to date', () => {
    const d = new Date(2020, 5, 8, 5, 2);
    const day = new Date(2020, 5, 8);
    expect(parseAPITime(formatAPITime(d)).valueOf()).toBe(day.valueOf());
  });
});

describe('correlationMetrics', () => {
  test('Deaths vs. CLI correlations should equal what was published in the blog post', async () => {
    let expected_metrics = {
      r2At0: 0.5,
      lagAtMaxR2: 20,
      r2AtMaxR2: 0.81,
    };
    let actual_metrics = generateCorrelationMetrics(deathsTestData, cliTestData);
    expect(actual_metrics.r2At0).toEqual(expected_metrics.r2At0);
    expect(actual_metrics.lagAtMaxR2).toEqual(expected_metrics.lagAtMaxR2);
    expect(actual_metrics.r2AtMaxR2).toEqual(expected_metrics.r2AtMaxR2);
    expect(actual_metrics.lags.length).toEqual(28 * 2 + 1);
  });
  test('Signals with different date ranges should correlate on the union of their dates.', async () => {
    let expected_metrics = {
      r2At0: -0.59,
      lagAtMaxR2: 28,
      r2AtMaxR2: -0.07,
    };
    let actual_metrics = generateCorrelationMetrics(cases_national, safegraph_full_time_national);
    expect(actual_metrics.r2At0).toEqual(expected_metrics.r2At0);
    expect(actual_metrics.lagAtMaxR2).toEqual(expected_metrics.lagAtMaxR2);
    expect(actual_metrics.r2AtMaxR2).toEqual(expected_metrics.r2AtMaxR2);
    expect(actual_metrics.lags.length).toEqual(28 * 2 + 1);
  });
  test('Signals with not enough overlap should error.', async () => {
    expect(() => {
      generateCorrelationMetrics(cases_national, safegraph_full_time_national.slice(-30));
    }).toThrow();
  });
});
