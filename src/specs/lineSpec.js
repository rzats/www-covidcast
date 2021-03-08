import { CURRENT_DATE_HIGHLIGHT } from '../components/vegaSpecUtils';

// dark2
// has to be the rgb notation to create a pure version out of it for CSS variables manipulation
export const MULTI_COLORS = [
  'rgb(27, 158, 119)',
  'rgb(217, 95, 2)',
  'rgb(117, 112, 179)',
  'rgb(231, 41, 138)',
  'rgb(102, 166, 30)',
  'rgb(230, 171, 2)',
  'rgb(166, 118, 29)',
];

export const COLOR = '#666666';

export function patchHighlightTuple(current) {
  // patches the highlight signal,
  // see current.on[0].update
  const updateCode = current.on[0].update;
  current.on[0].update = `patchPickedItem(event) && item().${updateCode.replace(/ datum/, ' item().datum')}`;
  return current;
}

export function resolveHighlightedDate(e) {
  const highlighted = e.detail.value;
  if (highlighted && Array.isArray(highlighted.date_value) && highlighted.date_value.length > 0) {
    return new Date(highlighted.date_value[0]);
  }
  return null;
}

export const signalPatches = {
  highlight_tuple: patchHighlightTuple,
};

// function smartPadding(valueField = 'value') {
//   return {
//     // in case the values are close to 0 .. no padding otherwise some padding
//     // if range.min < 10 && range.range > 30 ? 0 : 20
//     expr: `customObjChecks(customExtent(data("values"), "${valueField}"), ['min', '<', 10], ['range', '>', 30]) ? 0 : 20`,
//   };
// }

const AUTO_ALIGN = {
  // auto align based on remaining space
  expr:
    "(width - scale('x', datum.date_value)) < 40 ? 'right' : (scale('x', datum.date_value)) > 40 ? 'center' : 'left'",
};

export function generateLineChartSpec({
  width = 800,
  height = 300,
  domain,
  color = COLOR,
  initialDate = null,
  valueField = 'value',
  zero = false,
  highlightRegion = false,
} = {}) {
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    width,
    height,
    padding: { left: 42, top: 20, bottom: 20, right: 15 },
    autosize: {
      type: 'none',
      contains: 'padding',
      resize: true,
    },
    data: {
      name: 'values',
    },
    encoding: {
      x: {
        field: 'date_value',
        type: 'temporal',
        axis: {
          title: null,
          format: '%m/%d',
          formatType: 'cachedTime',
          labelFontSize: 14,
          labelOverlap: true,
          grid: true,
          gridDash: [4, 4],
          tickCount: {
            interval: 'week',
          },
        },
        scale: {
          domain,
        },
      },
    },
    layer: [
      {
        mark: {
          type: 'line',
          color,
          point: false,
        },
        encoding: {
          y: {
            field: valueField,
            type: 'quantitative',
            axis: {
              grid: true,
              title: null,
              domain: false,
              tickCount: 5,
              labelFontSize: 14,
            },
            scale: {
              round: true,
              zero,
              domainMin: null,
              // padding: zero ? undefined : smartPadding(valueField),
            },
          },
          opacity: highlightRegion
            ? {
                condition: {
                  test: 'highlightRegion != null && highlightRegion !== datum.id',
                  value: 0.1,
                },
                value: 1,
              }
            : {},
        },
      },
      {
        selection: {
          highlight: {
            type: 'single',
            empty: 'none',
            init: initialDate
              ? {
                  x: initialDate,
                }
              : undefined,
            on: 'click, [mousedown, window:mouseup] > mousemove, [touchstart, touchend] > touchmove',
            nearest: true,
            clear: false,
            encodings: ['x'],
          },
        },
        mark: {
          type: 'point',
          color,
          stroke: null,
          tooltip: true,
        },
        encoding: {
          y: {
            field: valueField,
            type: 'quantitative',
          },
          opacity: {
            condition: {
              selection: 'highlight',
              value: 1,
            },
            value: 0,
          },
        },
      },
      {
        transform: [
          {
            filter: {
              selection: 'highlight',
            },
          },
          {
            sample: 1,
          },
        ],
        layer: [
          {
            mark: {
              type: 'rule',
              stroke: COLOR,
              strokeDash: [2, 4],
              y: -4,
            },
          },
          {
            mark: {
              type: 'text',
              align: AUTO_ALIGN,
              color: COLOR,
              baseline: 'bottom',
              fontSize: 16,
              dy: -3,
            },
            encoding: {
              text: {
                field: 'date_value',
                type: 'temporal',
                format: '%a %b %d',
                formatType: 'cachedTime',
              },
              y: {
                value: 0,
              },
            },
          },
        ],
      },
    ],
    config: {
      customFormatTypes: true,
      view: {
        stroke: null,
      },
    },
  };
  return spec;
}

export function generateCompareLineSpec(compare, { compareField = 'displayName', ...options } = {}) {
  const spec = generateLineChartSpec(options);
  spec.layer[0].encoding.color = {
    field: compareField,
    type: 'nominal',
    scale: {
      domain: compare,
      range: MULTI_COLORS,
    },
    legend: null,
  };
  spec.layer[1].encoding.color = {
    field: compareField,
    type: 'nominal',
  };
  return spec;
}

export function generateLineAndBarSpec(options = {}) {
  const spec = generateLineChartSpec(options);
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const point = spec.layer[1];
  point.mark = {
    type: 'bar',
    color: MULTI_COLORS[0],
    width: {
      expr: `floor(width / customCountDays(domain('x')[0], domain('x')[1]))`,
    },
  };
  point.encoding.y.field = 'raw';
  point.encoding.opacity.value = 0.2;
  return spec;
}

export function createSignalDateLabelHighlight(topPosition = false) {
  const layer = Object.assign({}, CURRENT_DATE_HIGHLIGHT);
  layer.layer = [
    {
      mark: layer.mark,
      encoding: layer.encoding,
    },
    {
      mark: {
        type: 'text',
        baseline: topPosition ? 'bottom' : 'top',
        align: 'right',
        dy: topPosition ? -5 : 5,
        y: topPosition
          ? 0
          : {
              expr: 'height',
            },
      },
      encoding: {
        x: {
          field: 'date_value',
          type: 'temporal',
        },
        text: {
          field: 'date_value',
          type: 'temporal',
          format: '%-m/%-d',
          formatType: 'cachedTime',
        },
      },
    },
  ];
  delete layer.mark;
  delete layer.encoding;
  return layer;
}

export function generateSparkLine({
  valueField = 'value',
  domain = null,
  color = COLOR,
  highlightDate = false,
  highlightStartEnd = true,
  interactive = true,
  height = 30,
} = {}) {
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: { name: 'values' },
    height,
    padding: {
      left: 2,
      top: highlightDate === 'top' ? 20 : 2,
      bottom: highlightDate && highlightDate !== 'top' ? 20 : 2,
      right: 2,
    },
    background: null,
    autosize: {
      type: 'none',
      contains: 'padding',
      resize: true,
    },
    encoding: {
      x: {
        field: 'date_value',
        type: 'temporal',
        scale: {
          domain,
        },
        axis: {
          title: null,
          format: '%m/%d',
          formatType: 'cachedTime',
          grid: true,
          gridDash: [4, 4],
          labels: false,
          ticks: false,
          domain: false,
          tickCount: {
            interval: 'week',
          },
        },
      },
    },
    layer: [
      highlightDate ? createSignalDateLabelHighlight(highlightDate === 'top') : CURRENT_DATE_HIGHLIGHT,
      {
        mark: {
          type: 'line',
          color,
          point: false,
          interpolate: 'linear',
        },
        encoding: {
          y: {
            field: valueField,
            type: 'quantitative',
            scale: {
              zero: 0,
            },
            axis: null,
          },
        },
      },
      ...(interactive
        ? [
            {
              mark: {
                type: 'point',
                fill: color,
                stroke: null,
                tooltip: true,
              },
              encoding: {
                y: {
                  field: valueField,
                  type: 'quantitative',
                },
                opacity: {
                  condition: {
                    selection: 'highlight',
                    value: 1,
                  },
                  value: 0,
                },
              },
              selection: {
                highlight: {
                  type: 'single',
                  empty: 'none',
                  on: 'click, mousemove, [touchstart, touchend] > touchmove',
                  nearest: true,
                  clear: 'view:mouseout',
                  encodings: ['x'],
                },
              },
            },
          ]
        : []),
    ],
    config: {
      customFormatTypes: true,
      view: {
        stroke: null,
      },
      legend: {
        disable: true,
      },
    },
  };

  if (highlightStartEnd) {
    if (domain) {
      spec.layer.unshift({
        data: {
          values: [{ date_value: domain[0] }, { date_value: domain[1] }],
        },

        mark: {
          type: 'rule',
          tooltip: false,
          color,
        },
        encoding: {
          x: {
            field: 'date_value',
            type: 'temporal',
          },
        },
      });
    } else {
      spec.layer.unshift({
        transform: [
          {
            aggregate: [
              {
                op: 'min',
                field: 'date_value',
                as: 'date_value_min',
              },
              {
                op: 'max',
                field: 'date_value',
                as: 'date_value_max',
              },
            ],
          },
          {
            calculate: '[datum.date_value_min, datum.date_value_max]',
            as: 'date_value',
          },
          {
            flatten: ['date_value'],
          },
        ],
      });
    }
  }
  return spec;
}

/**
 *
 * @param {import('../maps').NameInfo} state
 */
export function generateDistributionLineSpec(state, options = {}) {
  const spec = generateLineChartSpec(options);
  spec.transform = [
    {
      calculate: `datum.geo_value === '${state.propertyId.toLowerCase()}' ? datum.geo_value : 'us'`,
      as: 'group',
    },
    // {
    //   aggregate: [
    //     {
    //       op: 'median',
    //       as: 'value',
    //       field: 'value',
    //     },
    //     {
    //       op: 'q1',
    //       as: 'q1',
    //       field: 'value',
    //     },
    //     {
    //       op: 'q3',
    //       as: 'q3',
    //       field: 'value',
    //     },
    //     {
    //       op: 'values',
    //       as: 'values',
    //       field: 'value',
    //     },
    //   ],
    //   groupby: ['group', 'time_value', 'date_value'],
    // },
    {
      // cannot use aggregate since no support for 0.1 and 0.9 quantiles
      quantile: 'value',
      probs: [0.05, 0.25, 0.5, 0.75, 0.95],
      groupby: ['group', 'date_value', 'time_value'],
    },
    // fold again
    {
      aggregate: [
        {
          op: 'values',
          as: 'values',
        },
      ],
      groupby: ['group', 'date_value', 'time_value'],
    },
    {
      calculate: 'datum.values[2].value',
      as: 'value',
    },
  ];
  spec.padding.bottom = 50;
  spec.layer[0].encoding.color = {
    field: 'group',
    type: 'nominal',
    scale: {
      domain: [state.propertyId.toLowerCase(), 'us'],
      range: [MULTI_COLORS[0], COLOR],
    },
    legend: {
      direction: 'horizontal',
      orient: 'bottom',
      title: null,
      symbolType: 'stroke',
      labelExpr: `{'${state.propertyId.toLowerCase()}': '${state.displayName}', us: 'State Median'}[datum.value]`,
    },
  };
  // spec.layer[0].encoding.strokeWidth = {
  //   condition: {
  //     test: `datum['${compareField}'] === "${compare[0]}"`,
  //     value: 3,
  //   },
  //   value: 1,
  // };
  spec.layer[1].encoding.color = {
    field: 'group',
    type: 'nominal',
  };
  spec.layer.unshift(
    {
      transform: [
        {
          filter: "datum.group == 'us'",
        },
        {
          calculate: '[datum.values[0].value, datum.values[1].value]',
          as: 'q_low',
        },
        {
          calculate: '[datum.values[4].value, datum.values[3].value]',
          as: 'q_high',
        },
        {
          calculate: `['5th-95th', '25th-75th']`,
          as: 'q_name',
        },
        {
          flatten: ['q_low', 'q_high', 'q_name'],
        },
      ],
      mark: {
        type: 'area',
      },
      encoding: {
        y: {
          field: 'q_low',
          type: 'quantitative',
        },
        y2: {
          field: 'q_high',
          type: 'quantitative',
        },
        fill: {
          field: 'q_name',
          type: 'ordinal',
          scale: {
            domain: ['5th-95th', '25th-75th'],
            range: ['#eeeeee', '#dddddd'],
          },
          legend: {
            direction: 'horizontal',
            orient: 'bottom',
            title: null,
            symbolType: 'square',
          },
        },
      },
    },
    {
      transform: [
        {
          filter: "datum.group == 'us'",
        },
      ],
      mark: {
        type: 'area',
        color: COLOR,
        opacity: 0.2,
      },
      encoding: {
        y: {
          field: 'q25',
          type: 'quantitative',
        },
        y2: {
          field: 'q75',
          type: 'quantitative',
        },
      },
    },
  );
  return spec;
}

/**
 *
 * @param {import('../maps').NameInfo} state
 */
export function generateDistributionLineSpec2(state, options = {}) {
  const spec = generateLineChartSpec(options);
  spec.padding.bottom = 50;
  spec.layer[0].encoding.color = {
    condition: {
      test: `datum.geo_value == '${state.propertyId.toLowerCase()}'`,
      value: MULTI_COLORS[0],
    },
    value: COLOR,
  };
  spec.layer[0].encoding.detail = {
    field: 'geo_value',
  };
  spec.layer[0].encoding.opacity = {
    condition: {
      test: `datum.geo_value == '${state.propertyId.toLowerCase()}'`,
      value: 1,
    },
    value: 0.1,
  };
  spec.layer[0].encoding.strokeWidth = {
    condition: {
      test: `datum.geo_value == '${state.propertyId.toLowerCase()}'`,
      value: 3,
    },
    value: 2,
  };
  spec.layer[1].encoding.color = {
    condition: {
      test: `datum.geo_value == '${state.propertyId.toLowerCase()}'`,
      value: MULTI_COLORS[0],
    },
    value: COLOR,
  };
  spec.layer[1].encoding.detail = {
    field: 'geo_value',
  };
  return spec;
}