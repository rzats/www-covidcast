/*
Layer names used in MapBox
- state
- msa
- county
- bubble-fill
- bubble-highlight-fill
- spike
- spike-outline
- spike-outline-highlight
...
*/

import { S } from './sources';

export const L = {
  state: {
    stroke: 'state-stroke',
    names: 'state-names',

    fill: 'state-fill',
    hover: 'state-hover',
    bubble: 'state-bubble',
    spike: 'state-spike',
  },
  msa: {
    fill: 'msa-fill',
    hover: 'msa-hover',
    bubble: 'msa-bubble',
    spike: 'msa-spike',
  },
  county: {
    fill: 'county-fill',
    hover: 'county-hover',
    bubble: 'county-bubble',
    spike: 'county-spike',
  },
  'mega-county': {
    fill: 'mega-county-fill',
    hover: 'mega-county-hover',
  },
  zoneOutline: 'zone-outline',
  cityPoints: {
    pit: 'city-point-unclustered-pit',
    1: 'city-point-unclustered-1',
    2: 'city-point-unclustered-2',
    3: 'city-point-unclustered-3',
    4: 'city-point-unclustered-4',
    5: 'city-point-unclustered-5',
  },
};

/**
 *
 * @param {import('mapbox-gl').Map} map
 */
export function addCityLayers(map) {
  map.addLayer({
    id: L.state.names,
    source: S.state.center,
    type: 'symbol',
    maxzoom: 8,
    layout: {
      'text-field': ['upcase', ['get', 'name']],
      'text-font': ['Open Sans Bold'],
      'text-size': 11,
    },
    paint: {
      'text-opacity': 0.5,
      'text-halo-color': '#fff',
      'text-halo-width': 1,
    },
  });

  const addCityLayer = (id, filter, extras = {}) => {
    map.addLayer(
      {
        id,
        source: S.cityPoint,
        type: 'symbol',
        ...(filter ? { filter } : {}),
        ...extras,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
        },
        paint: {
          'text-halo-color': '#fff',
          'text-halo-width': 1.5,
        },
      },
      L.state.names,
    );
  };

  addCityLayer(L.cityPoints.pit, ['==', 'name', 'Pittsburgh'], {
    maxzoom: 8,
  });
  addCityLayer(L.cityPoints.pit[1], ['>', 'population', 900000], {
    maxzoom: 4,
  });
  addCityLayer(L.cityPoints.pit[2], ['>', 'population', 500000], {
    maxzoom: 6,
    minzoom: 4,
  });
  addCityLayer(L.cityPoints.pit[3], ['>', 'population', 100000], {
    maxzoom: 8,
    minzoom: 6,
  });
  addCityLayer(L.cityPoints.pit[4], undefined, {
    minzoom: 8,
  });
}