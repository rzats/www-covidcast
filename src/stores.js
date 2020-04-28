import { writable, readable, derived } from 'svelte/store';
import * as d3 from 'd3';
import moment from 'moment';

// Set of options for which signals to display.
// Checks the ?sensors= URI parameter for a custom view,
// otherwise uses the default.
export const sensors = readable(
  [
    {
      name: 'Doctor Visits',
      id: 'doctor-visits',
      tooltipText: 'Doctor’s visits due to covid-like symptoms',
      title: 'Doctor visits with COVID-like symptoms',
      yAxis: 'Percentage',
      format: 'percent',
      signal: 'smoothed_cli',
      levels: ['county', 'msa', 'state'],
    },
    {
      name: 'Surveys (Facebook)',
      id: 'fb-survey',
      tooltipText: 'CMU symptom surveys offered via Facebook - thank you Facebook!',
      title: 'Surveys via Facebook reporting COVID symptoms in household',
      yAxis: 'Percentage',
      format: 'percent',
      signal: 'smoothed_cli',
      levels: ['county', 'msa', 'state'],
    },
    {
      name: 'Surveys (Google)',
      id: 'google-survey',
      tooltipText: 'Symptom surveys run by Google - thank you Google!',
      title: 'Google surveys reporting COVID symptoms in the community',
      yAxis: 'Percentage',
      format: 'percent',
      signal: 'smoothed_cli',
      levels: ['county', 'state', 'msa'],
    },
    {
      name: 'Search Trends (Google)',
      id: 'ght',
      tooltipText: 'Covid-related search frequency from Google’s Health Trends team - thank you Google!',
      title: 'COVID-related Google searches',
      yAxis: 'Relative frequency',
      format: 'raw',
      signal: 'smoothed_search',
      levels: ['msa', 'state'],
    },
    {
      name: 'Flu Testing (Quidel)',
      id: 'quidel',
      tooltipText: 'Influenza testing demand from Quidel, Inc. - thank you Quidel!',
      title: 'Influenza testing demand',
      yAxis: 'Tests per device',
      format: 'raw',
      signal: 'smoothed_tests_per_device',
      levels: ['msa', 'state'],
    },
  ],
  function start(set) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let sensorsOption = urlParams.get('sensors');
    sensorsOption ? set(JSON.parse(decodeURIComponent(sensorsOption))) : '';
  },
);

export const levels = readable({
  state: 'State',
  msa: 'Metro Area',
  county: 'County',
});

// This loads all the GeoJSON's for each granularity that the MapBox component reads as layers.
const injectIDs = (level, data) => {
  data.features.forEach((d) => {
    d.properties.level = level;

    if (level === 'county') {
      d.id = d.properties.id = d.properties.GEO_ID.slice(-5);
    } else if (level === 'msa') {
      d.id = d.properties.id = d.properties.cbsafp;
    } else if (level === 'state') {
      d.properties.id = d.properties.POSTAL;
      d.id = d.properties.STATE;
    }
  });
  return data;
};
export const geojsons = readable(new Map(), function start(set) {
  Promise.all([
    d3.json('./maps/counties-simple.json'),
    d3.json('./maps/states-simple.json'),
    d3.json('./maps/msa-albers-simple.json'),
    d3.json('./maps/city_data/cities-reprojected.json'),
  ]).then(([a, b, c, d]) => {
    let m = new Map();
    m.set('county', injectIDs('county', a));
    m.set('state', injectIDs('state', b));
    m.set('msa', injectIDs('msa', c));
    m.set('city', d);
    set(m);
  });
});

export const times = writable(null);
export const stats = writable(null);

export const mounted = writable(0);
export const metaData = writable([]);

export const currentSensor = writable('doctor-visits'); // google-survey
// 'county', 'state', or 'msa'
export const currentLevel = writable('county'); // might want to change this to state by default
// Options are 'direction' and 'value'.
export const signalType = writable('value');
// EpiWeek in form YYYYMMDD.
export const currentDate = writable(20200420);
// Range of time for the map slider.
export const currentRange = writable([0, 1]);
// Region GEO_ID for filtering the line chart.
export const currentRegion = writable(''); // 42003 - Allegheny; 38300 - Pittsburgh; PA - Pennsylvania
export const currentRegionName = writable('');
export const currentDataReadyOnMay = writable(false);

export const currentSensorName = derived(
  [sensors, currentSensor],
  ([$sensors, $currentSensor]) => $sensors.filter((item) => item.id === $currentSensor)[0].name,
);
export const currentLevelName = derived([levels, currentLevel], ([$levels, $currentLevel]) => $levels[$currentLevel]);

export const regionSliceCache = writable(new Map());
export const timeSliceCache = writable(new Map());

export const regionData = writable([]);
export const currentData = writable([]);

export const regionDataStats = derived([metaData, currentSensor, currentLevel], ([$meta, $sensor, $level]) =>
  $meta.find((d) => d.data_source === $sensor && d.geo_type === $level),
);

export const timeRangeOnSlider = writable({ min: 0, max: 0 });
export const mapfirstLoaded = writable(false);

const today = new Date();
export const yesterday = +moment(new Date(today.getTime() - 86400 * 1000)).format('YYYYMMDD');
