import { countyInfo, hrrInfo, megaCountyInfo, nationInfo, stateInfo, msaInfo } from '../../maps';
import countyJSON from './maps2/county.json';
import hrrJSON from './maps2/hrr.json';
import nationJSON from './maps2/nation.json';
import stateJSON from './maps2/state.json';
import msaJSON from './maps2/msa.json';

function genMissingLayer(missingLevel = 'nation') {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
    data: {
      name: missingLevel,
      format: {
        type: 'topojson',
        feature: missingLevel,
      },
    },
    mark: {
      type: 'geoshape',
      stroke: '#eaeaea',
      color: {
        y2: 1,
        gradient: 'linear',
        stops: [
          { offset: 0, color: '#eeeeee' },
          { offset: 0.014285714285714285, color: 'white' },
          { offset: 0.02857142857142857, color: '#eeeeee' },
          { offset: 0.04285714285714286, color: 'white' },
          { offset: 0.05714285714285714, color: '#eeeeee' },
          { offset: 0.07142857142857142, color: 'white' },
          { offset: 0.08571428571428572, color: '#eeeeee' },
          { offset: 0.1, color: 'white' },
          { offset: 0.11428571428571428, color: '#eeeeee' },
          { offset: 0.12857142857142856, color: 'white' },
          { offset: 0.14285714285714285, color: '#eeeeee' },
          { offset: 0.15714285714285714, color: 'white' },
          { offset: 0.17142857142857143, color: '#eeeeee' },
          { offset: 0.18571428571428572, color: 'white' },
          { offset: 0.2, color: '#eeeeee' },
          { offset: 0.21428571428571427, color: 'white' },
          { offset: 0.22857142857142856, color: '#eeeeee' },
          { offset: 0.24285714285714285, color: 'white' },
          { offset: 0.2571428571428571, color: '#eeeeee' },
          { offset: 0.2714285714285714, color: 'white' },
          { offset: 0.2857142857142857, color: '#eeeeee' },
          { offset: 0.3, color: 'white' },
          { offset: 0.3142857142857143, color: '#eeeeee' },
          { offset: 0.32857142857142857, color: 'white' },
          { offset: 0.34285714285714286, color: '#eeeeee' },
          { offset: 0.35714285714285715, color: 'white' },
          { offset: 0.37142857142857144, color: '#eeeeee' },
          { offset: 0.38571428571428573, color: 'white' },
          { offset: 0.4, color: '#eeeeee' },
          { offset: 0.4142857142857143, color: 'white' },
          { offset: 0.42857142857142855, color: '#eeeeee' },
          { offset: 0.44285714285714284, color: 'white' },
          { offset: 0.45714285714285713, color: '#eeeeee' },
          { offset: 0.4714285714285714, color: 'white' },
          { offset: 0.4857142857142857, color: '#eeeeee' },
          { offset: 0.5, color: 'white' },
          { offset: 0.5142857142857142, color: '#eeeeee' },
          { offset: 0.5285714285714286, color: 'white' },
          { offset: 0.5428571428571428, color: '#eeeeee' },
          { offset: 0.5571428571428572, color: 'white' },
          { offset: 0.5714285714285714, color: '#eeeeee' },
          { offset: 0.5857142857142857, color: 'white' },
          { offset: 0.6, color: '#eeeeee' },
          { offset: 0.6142857142857143, color: 'white' },
          { offset: 0.6285714285714286, color: '#eeeeee' },
          { offset: 0.6428571428571429, color: 'white' },
          { offset: 0.6571428571428571, color: '#eeeeee' },
          { offset: 0.6714285714285714, color: 'white' },
          { offset: 0.6857142857142857, color: '#eeeeee' },
          { offset: 0.7, color: 'white' },
          { offset: 0.7142857142857143, color: '#eeeeee' },
          { offset: 0.7285714285714285, color: 'white' },
          { offset: 0.7428571428571429, color: '#eeeeee' },
          { offset: 0.7571428571428571, color: 'white' },
          { offset: 0.7714285714285715, color: '#eeeeee' },
          { offset: 0.7857142857142857, color: 'white' },
          { offset: 0.8, color: '#eeeeee' },
          { offset: 0.8142857142857143, color: 'white' },
          { offset: 0.8285714285714286, color: '#eeeeee' },
          { offset: 0.8428571428571429, color: 'white' },
          { offset: 0.8571428571428571, color: '#eeeeee' },
          { offset: 0.8714285714285714, color: 'white' },
          { offset: 0.8857142857142857, color: '#eeeeee' },
          { offset: 0.9, color: 'white' },
          { offset: 0.9142857142857143, color: '#eeeeee' },
          { offset: 0.9285714285714286, color: 'white' },
          { offset: 0.9428571428571428, color: '#eeeeee' },
          { offset: 0.9571428571428572, color: 'white' },
          { offset: 0.9714285714285714, color: '#eeeeee' },
          { offset: 0.9857142857142858, color: 'white' },
          { offset: 1, color: '#eeeeee' },
        ],
      },
    },
  };
  return layer;
}

function genMegaLayer(infos) {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
    data: {
      name: 'state',
      format: {
        type: 'topojson',
        feature: 'state',
      },
    },
    transform: [
      { calculate: "datum.id + '000'", as: 'id' },
      {
        lookup: 'id',
        from: {
          data: { values: infos },
          key: 'id',
          fields: ['propertyId', 'displayName', 'population'],
        },
      },
      {
        calculate: 'lower(datum.propertyId)',
        as: 'propertyId',
      },
      {
        lookup: 'propertyId',
        from: {
          data: { name: 'values' },
          key: 'geo_value',
          fields: ['geo_value', 'value'],
        },
      },
    ],
    mark: {
      type: 'geoshape',
      stroke: null,
      tooltip: { content: 'data' },
    },
    encoding: {
      color: {
        condition: {
          test: 'datum.value === 0',
          value: 'rgb(242,242,242)',
        },
        field: 'value',
        type: 'quantitative',
      },
    },
    selection: {
      hoverMega: {
        type: 'single',
        on: 'mouseover',
        empty: 'none',
      },
    },
  };
  return layer;
}

function genMegaBorderLayer() {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
    data: {
      name: 'state',
      format: {
        type: 'topojson',
        feature: 'state',
      },
    },
    mark: {
      type: 'geoshape',
      fill: null,
      stroke: '#eaeaea',
      strokeWidth: 1.1,
      tooltip: false,
    },
    encoding: {
      key: {
        field: 'id',
      },
    },
  };
  return layer;
}

function genMegaHoverLayer() {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
    data: {
      name: 'state',
      format: {
        type: 'topojson',
        feature: 'state',
      },
    },
    mark: {
      type: 'geoshape',
      fill: null,
      stroke: '#ff7f00',
      strokeWidth: 2,
      opacity: 0,
      tooltip: false,
    },
    encoding: {
      key: {
        field: 'id',
      },
      opacity: {
        // more performant
        condition: {
          selection: 'hoverMega',
          value: 1,
        },
        value: 0,
      },
    },
  };
  return layer;
}

function genLevelLayer(strokeWidth = 1) {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
    mark: {
      type: 'geoshape',
      stroke: '#eaeaea',
      strokeWidth,
      tooltip: { content: 'data' },
    },
    encoding: {
      key: {
        field: 'id',
      },
      color: {
        condition: {
          test: 'datum.value === 0',
          value: 'rgb(242,242,242)',
        },
        field: 'value',
        type: 'quantitative',
        scale: {
          // domainMin: 0,
          // domainMax: 149,
          scheme: 'yellowgreenblue',
          clamp: true,
        },
        legend: {
          orient: 'right',
          Align: 'center',
          FontWeight: 'normal',
          Orient: 'left',
          title: 'of 100 people',
          labelLimit: 30,
          tickMinStep: 0.1,
        },
      },
    },
    selection: {
      hover: {
        type: 'single',
        on: 'mouseover',
        empty: 'none',
        fields: ['geo_value'],
      },
    },
  };
  return layer;
}

function genLevelHoverLayer() {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
    mark: {
      type: 'geoshape',
      stroke: '#ff7f00',
      strokeWidth: 2,
      opacity: 0,
      fill: null,
      tooltip: false,
    },
    // transform: [
    //   {
    //     filter: {
    //       selection: 'hover'
    //     }
    //   }
    // ],
    encoding: {
      key: {
        field: 'id',
      },
      opacity: {
        // more performant
        condition: {
          selection: 'hover',
          value: 1,
        },
        value: 0,
      },
    },
  };
  return layer;
}

function genBaseSpec(level, topoJSON, infos) {
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    height: 300,
    padding: {
      left: 10,
      bottom: 10,
      top: 10,
      right: 10,
    },
    autosize: {
      type: 'none',
      contains: 'padding',
      resize: true,
    },
    projection: {
      type: 'albersUsaTerritories',
    },
    datasets: {
      values: [],
    },
    data: {
      values: topoJSON,
      format: {
        type: 'topojson',
        feature: level,
      },
    },
    transform: [
      {
        lookup: 'id',
        from: {
          data: { values: infos },
          key: 'id',
          fields: ['propertyId', 'displayName', 'population', 'state'],
        },
      },
      {
        calculate: 'lower(datum.propertyId)',
        as: 'propertyId',
      },
      {
        lookup: 'propertyId',
        from: {
          data: { name: 'values' },
          key: 'geo_value',
          fields: ['geo_value', 'value'],
        },
      },
    ],
    layer: [],
    config: {
      view: {
        stroke: null,
      },
    },
  };
  return spec;
}

export function generateHRRSpec() {
  const level = 'hrr';
  const topoJSON = hrrJSON;
  const infos = hrrInfo;

  const spec = genBaseSpec(level, topoJSON, infos);
  spec.datasets.nation = nationJSON;
  spec.layer.push(genMissingLayer());

  spec.layer.push(genLevelLayer());
  spec.layer.push(genLevelHoverLayer());
  return spec;
}

export function generateStateSpec() {
  const level = 'state';
  const topoJSON = stateJSON;
  const infos = stateInfo;

  const spec = genBaseSpec(level, topoJSON, infos);
  spec.datasets.nation = nationJSON;
  spec.layer.push(genMissingLayer());

  // state, msa
  spec.layer.push(genLevelLayer());
  spec.layer.push(genLevelHoverLayer());
  return spec;
}

export function generateMSASpec() {
  const level = 'msa';
  const topoJSON = msaJSON;
  const infos = msaInfo;

  const spec = genBaseSpec(level, topoJSON, infos);
  spec.datasets.nation = nationJSON;
  spec.layer.push(genMissingLayer());

  // state, msa
  spec.layer.push(genLevelLayer());
  spec.layer.push(genLevelHoverLayer());
  return spec;
}

export function generateNationSpec() {
  const level = 'nation';
  const topoJSON = nationJSON;
  const infos = [nationInfo];

  const spec = genBaseSpec(level, topoJSON, infos);
  spec.transform.unshift({
    calculate: JSON.stringify('us'),
    as: 'id',
  });

  spec.layer.push(genLevelLayer());
  spec.layer.push(genLevelHoverLayer());
  return spec;
}

/**
 * generates a map of counties
 */
export function generateCountySpec() {
  const level = 'county';
  const topoJSON = countyJSON;
  const infos = countyInfo;

  const spec = genBaseSpec(level, topoJSON, infos);

  spec.datasets.nation = nationJSON;
  spec.layer.push(genMissingLayer());
  spec.datasets.state = stateJSON;
  spec.layer.push(genMegaLayer(megaCountyInfo));
  spec.layer.push(genLevelLayer(0));
  spec.layer.push(genMegaBorderLayer());
  spec.layer.push(genMegaHoverLayer());
  spec.layer.push(genLevelHoverLayer());
  return spec;
}

/**
 * generates a map of counties for a specific state
 * @param {string} 
 * @param {import('../../maps').NameInfo} state
 */
export function generateCountyOfStateSpec(state) {
  const level = 'county';
  const topoJSON = countyJSON;
  const infos = countyInfo;

  const spec = genBaseSpec(level, topoJSON, infos);

  /**
   * @type {import('vega-lite/build/src/transform').Transform}
   */
  const isState = {
    filter: `lower(datum.id) == '${state.id}'`,
  };
  /**
   * @type {import('vega-lite/build/src/transform').Transform}
   */
  const isCountyOfState = {
    filter: `slice(lower(datum.id), 0, 2) == '${state.id}'`,
  };
  spec.transform.unshift(isCountyOfState);

  spec.datasets.state = stateJSON;
  spec.layer.push(genMegaLayer(megaCountyInfo));
  spec.layer[spec.layer.length - 1].transform.unshift(isState);
  spec.layer.push(genLevelLayer());
  spec.layer.push(genLevelHoverLayer());
  return spec;
}
