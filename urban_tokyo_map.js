mapboxgl.accessToken = 'pk.eyJ1IjoiaXh4aWlyaXMiLCJhIjoiY202aTB2bTI1MDNpNTJqc2h0NW0xeTdlZSJ9.Oh-wamriLR992Hi8Vqm8tg';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ixxiiris/cm8lrey81005d01s9byfx4474',
  center: [139.75, 35.68],
  zoom: 11
});

map.on('load', () => {

  //用于记录当前行政区的 polygon filter
  let currentPolygonFilter = null;

  //用于统计图card
  let coffeeStatsChart = null;
  let chartInitialized = false;

  //监听事件
  const regionPopup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  offset: 16
  });
  

  // === 1. 边界图层（底层） ===
  map.addSource('boundary', {
    type: 'vector',
    url: 'mapbox://ixxiiris.b34cxgn7'
  });

  map.addLayer({
    id: 'boundary-fill',
    type: 'fill',
    source: 'boundary',
    'source-layer': 'tokyo_boundary-ag2grl',
    paint: {
      'fill-color': [
        'match',
        ['get', 'region_type_en'],
        'Central', '#b08968',
        'Non-central', '#ddb892',
        '#CCCCCC'
      ],
      'fill-opacity': 0.3
    }
  });

  map.addLayer({
    id: 'boundary-line',
    type: 'line',
    source: 'boundary',
    'source-layer': 'tokyo_boundary-ag2grl',
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#972d07', // 鼠标悬停时的描边颜色
        [
          'match',
          ['get', 'region_type_en'],
          'Central', '#012340',
          'Non-central', '#364559',
          '#888'
        ]
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        4.5, // 悬停时加粗
        1.3
      ],
      'line-opacity': 0.6,
      'line-dasharray': [2, 2]
    }
  });


  // === 2. 咖啡 POI 数据源 === 
  map.addSource('cafes', {
    type: 'vector',
    url: 'mapbox://ixxiiris.axyx3gbe' 
  });

  // === 3. 热力图图层（插入在 POI 点图层前） ===
  map.addLayer({
    id: 'poi-heatmap',
    type: 'heatmap',
    source: 'cafes',
    'source-layer': 'tokyo_cafes_classified_utf8-cxgrm9', 
    layout: { visibility: 'visible' },
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': [
        'interpolate', ['linear'], ['zoom'],
        10, 1,
        15, 2.5
      ],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,255,0)',
        0.2, '#74add1',
        0.4, '#abd9e9',
        0.6, '#fdae61',
        0.8, '#f46d43',
        1, '#d73027'
      ],
      'heatmap-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, 15,
        14, 30
      ],
      'heatmap-opacity': 0.4
    }
  });

  // === 4. 三类咖啡店点图层 ===
  const cafeTypes = {
    'Chain': '#b1150c',
    'Independent': '#7E8EA5',
    'Community/Old-fashioned': '#5E382F'
  };

  Object.entries(cafeTypes).forEach(([type, color]) => {
    map.addLayer({
      id: `poi-${type.toLowerCase().replace(/[^a-z]/g, '')}`,
      type: 'circle',
      source: 'cafes',
      'source-layer': 'tokyo_cafes_classified_utf8-cxgrm9', 
      filter: ['==', ['get', 'cafe_cat_1'], type], 
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          8, 2.5,
          10, 3.5,
          12, 4.5,
          16, 6
        ],
        'circle-color': color,
        'circle-opacity': 0.6,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 0.6
      }
    });
  });

  // === 5. 图层控制联动（热力图 + POI） ===
  document.querySelectorAll('.layer-toggle').forEach(input => {
    input.addEventListener('change', () => {
      const activeTypes = Array.from(document.querySelectorAll('.layer-toggle'))
        .filter(i => i.checked)
        .map(i => i.dataset.type);

      const typeToLayerId = {
        'Chain': 'poi-chain',
        'Independent': 'poi-independent',
        'Community/Old-fashioned': 'poi-communityoldfashioned'
      };

      // 点图层：恢复类型 filter，并设置显隐
      Object.entries(typeToLayerId).forEach(([type, layerId]) => {
        if (!map.getLayer(layerId)) return;
        map.setLayoutProperty(
          layerId,
          'visibility',
          activeTypes.includes(type) ? 'visible' : 'none'
        );

        const baseFilter = ['==', ['get', 'cafe_cat_1'], type];

        const finalFilter = currentPolygonFilter
          ? ['all', currentPolygonFilter, baseFilter]  // 如果点击过行政区，叠加 polygon + 类型
          : baseFilter;                                // 否则只按类型过滤

        map.setFilter(layerId, finalFilter);
      });


      // 热力图筛选（类别聚合）
      if (map.getLayer('poi-heatmap')) {
        if (activeTypes.length > 0) {
          map.setLayoutProperty('poi-heatmap', 'visibility', 'visible');

          const heatmapFilter = currentPolygonFilter
            ? ['all', currentPolygonFilter, ['in', ['get', 'cafe_cat_1'], ['literal', activeTypes]]]
            : ['in', ['get', 'cafe_cat_1'], ['literal', activeTypes]];

          map.setFilter('poi-heatmap', heatmapFilter);
        } else {
          map.setLayoutProperty('poi-heatmap', 'visibility', 'none');
        }
      }

      // infotext控制
      if (!currentPolygonFilter) {
        updateInfoGlobal(activeTypes);
      }

    });
  });


  // 卡片折叠功能
  document.querySelectorAll('.card-header').forEach(header => {
    if (header.classList.contains('no-collapse')) return; // 不对统计图卡片绑定点击事件

    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const wasCollapsed = body.classList.contains('collapsed');

      body.classList.toggle('collapsed');
      header.classList.toggle('collapsed');

    });
  });

// 左上方统计图表
  // 东京全域
  function updateDistrictChartGlobal() {
    const features = map.queryRenderedFeatures({ 
      layers: ['poi-chain', 'poi-independent', 'poi-communityoldfashioned']
    });

    const cafeCounts = {
      'Chain': 0,
      'Independent': 0,
      'Community/Old-fashioned': 0
    };

    features.forEach(f => {
      const cat = f.properties.cafe_cat_1;
      if (cafeCounts[cat] !== undefined) cafeCounts[cat]++;
    });

    updateDistrictChart(cafeCounts, 'Cafés in Tokyo');
  }


  // 各行政区
  function updateDistrictChart(cafeCounts, title = 'Cafés in Tokyo') {
  const data = [
    cafeCounts['Chain'],
    cafeCounts['Independent'],
    cafeCounts['Community/Old-fashioned']
  ];

  const labels = ['Chain', 'Independent', 'Community'];
  const colors = ['#b1150c', '#7E8EA5', '#5E382F'];

  const ctx = document.getElementById('coffee-stats-chart').getContext('2d');

  if (coffeeStatsChart) {
    coffeeStatsChart.data.datasets[0].data = data;
    coffeeStatsChart.options.plugins.title.text = title;
    coffeeStatsChart.update();
  } else {
    coffeeStatsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '', // 不显示 legend label
          data: data,
          backgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        layout: {
          padding: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 0,
              bottom: 0
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number',
              font: {
                size: 12,
                weight: 'bold'
              },
              padding: {
                top: 0
              }
            },
            ticks: {
              display: false
            },
            grid: {
              display: false
            }
          },
          y: {
            title: {
              display: true,
              text: 'Type',
              font: {
                size: 13,
                weight: 'bold'
              },
              padding: {
                bottom: 0
              }
            },
            ticks: {
              display: false
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
  }

// POIhover 显示名称类别
  // 创建全局 popup 对象，避免重复创建
  const poiPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  const poiLayers = [
    'poi-chain',
    'poi-independent',
    'poi-communityoldfashioned'
  ];

  poiLayers.forEach(layerId => {
    map.on('mouseenter', layerId, e => {
      map.getCanvas().style.cursor = 'pointer';

      const coordinates = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;
      const name = props.name || 'Unnamed Café';
      const type = props.cafe_cat_1;

      const popupHTML = `<strong>${name}</strong><br><em>${type}</em>`;

      poiPopup
        .setLngLat(coordinates)
        .setHTML(popupHTML)
        .addTo(map);
    });
  
    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
      poiPopup.remove();
    });
  });

// 行政区事件
  let hoveredRegionId = null;
  let selectedRegionName = null;

  // 1️.hover 效果：描边 + 阴影 + 显示名字
  map.on('mousemove', 'boundary-fill', e => {
    map.getCanvas().style.cursor = 'pointer';

    if (hoveredRegionId !== null) {
      map.setFeatureState(
        { source: 'boundary', sourceLayer: 'tokyo_boundary-ag2grl', id: hoveredRegionId },
        { hover: false }
      );
    }

    hoveredRegionId = e.features[0].id;

    map.setFeatureState(
      { source: 'boundary', sourceLayer: 'tokyo_boundary-ag2grl', id: hoveredRegionId },
      { hover: true }
    );
  });

  map.on('mouseleave', 'boundary-fill', () => {
    map.getCanvas().style.cursor = '';

    if (hoveredRegionId !== null) {
      map.setFeatureState(
        { source: 'boundary', sourceLayer: 'tokyo_boundary-ag2grl', id: hoveredRegionId },
        { hover: false }
      );
    }
    hoveredRegionId = null;
  });

  // 2.点击行政区：边界高亮 + 弹出 popup
  map.on('click', 'boundary-fill', e => {
    const feature = e.features[0];
    const regionNameJa = feature.properties.name || '---';
    const regionNameEn = feature.properties.name_en || '';
    const regionType = feature.properties.region_type_en || 'N/A';
    const selectedPolygon = feature.geometry;
    const center = turf.center(feature).geometry.coordinates;

    selectedRegionName = regionNameEn;

    // zoom 到该区域
    map.fitBounds(turf.bbox(feature), { padding: 40, duration: 800 });

    // 高亮当前区域
    map.setPaintProperty('boundary-fill', 'fill-opacity', [
      'match',
      ['get', 'name_en'],
      regionNameEn, 0.5,
      0.1
    ]);
    map.setPaintProperty('boundary-line', 'line-opacity', [
      'match',
      ['get', 'name_en'],
      regionNameEn, 0.9,
      0.3
    ]);

    // 设置 POI 图层的过滤器：只显示当前 polygon 范围内的点
    const withinFilter = ['within', selectedPolygon];
    currentPolygonFilter = withinFilter; 

    // 当前勾选的类型（从 Layer Toggle 拿）
    const activeTypes = Array.from(document.querySelectorAll('.layer-toggle'))
    .filter(i => i.checked)
    .map(i => i.dataset.type);

    // POI 图层设置
    map.setFilter('poi-chain', [
      'all',
      withinFilter,
      ['==', ['get', 'cafe_cat_1'], 'Chain']
    ]);

    map.setFilter('poi-independent', [
      'all',
      withinFilter,
      ['==', ['get', 'cafe_cat_1'], 'Independent']
    ]);

    map.setFilter('poi-communityoldfashioned', [
      'all',
      withinFilter,
      ['==', ['get', 'cafe_cat_1'], 'Community/Old-fashioned']
    ]);

    // 热力图图层设置
    const heatmapFilter = ['all', withinFilter, ['in', ['get', 'cafe_cat_1'], ['literal', activeTypes]]];
    map.setFilter('poi-heatmap', heatmapFilter);

    // 统计该行政区内的咖啡店类型数量
    const featuresInPolygon = map.queryRenderedFeatures({ 
      layers: ['poi-chain', 'poi-independent', 'poi-communityoldfashioned'] 
    });

    const cafeCounts = {
      'Chain': 0,
      'Independent': 0,
      'Community/Old-fashioned': 0
    };

    featuresInPolygon.forEach(f => {
      const cat = f.properties.cafe_cat_1;
      if (cafeCounts[cat] !== undefined) cafeCounts[cat]++;
    });

    // 弹出 popup 显示中英文和类型
    regionPopup
      .setLngLat(center)
      .setHTML(`<strong>${regionNameJa}</strong> (${regionNameEn})<br><em>${regionType}</em>`)
      .addTo(map);

    // 更新底部信息栏 info text
    updateInfoForRegion(regionNameJa, regionNameEn, cafeCounts);

    // 更新图表
    updateDistrictChart(cafeCounts, `Cafés in ${regionNameEn} (${regionNameJa})`);

  });


// Rest View按钮
  let defaultBounds = null;

  // 1. 获取默认地图边界
  map.once('idle', () => {
    const features = map.querySourceFeatures('boundary', {
      sourceLayer: 'tokyo_boundary-ag2grl'
    });

    const geojson = {
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: f.properties
      }))
    };

    defaultBounds = turf.bbox(geojson);

    // 加载global 图表
    updateDistrictChartGlobal();
    chartInitialized = true;

    setTimeout(() => {
      if (coffeeStatsChart) coffeeStatsChart.resize();
    }, 400); // 等待容器撑开后 resize
  });

  // 2. 定义清除 POI 过滤的函数（在 load 内部，全局可调用）
  function resetPOIFilters() {
    map.setFilter('poi-chain', ['==', ['get', 'cafe_cat_1'], 'Chain']);
    map.setFilter('poi-independent', ['==', ['get', 'cafe_cat_1'], 'Independent']);
    map.setFilter('poi-communityoldfashioned', ['==', ['get', 'cafe_cat_1'], 'Community/Old-fashioned']);
    map.setFilter('poi-heatmap', null); // 热力图恢复全局范围
  }

  // 3. 绑定按钮点击事件
  const resetButton = document.getElementById('reset-view-btn');
  resetButton.addEventListener('click', () => {
    if (!defaultBounds) {
      console.warn('Default bounds not ready yet.');
      return;
    }

    currentPolygonFilter = null;
    
    map.fitBounds(defaultBounds, { padding: 40 });
    map.setPaintProperty('boundary-fill', 'fill-opacity', 0.3);
    map.setPaintProperty('boundary-line', 'line-opacity', 0.6);

    if (regionPopup) regionPopup.remove();

    resetPOIFilters(); // 清除 POI 筛选

    // 获取当前勾选的 layer 类型
    const activeTypes = Array.from(document.querySelectorAll('.layer-toggle'))
      .filter(i => i.checked)
      .map(i => i.dataset.type);

    // 恢复 info text
    updateInfoGlobal(activeTypes);

    // 恢复统计图表
    updateDistrictChartGlobal();

    //热力图重新设置
    if (map.getLayer('poi-heatmap')) {
      if (activeTypes.length > 0) {
        map.setLayoutProperty('poi-heatmap', 'visibility', 'visible');
        map.setFilter('poi-heatmap', ['in', ['get', 'cafe_cat_1'], ['literal', activeTypes]]);
      } else {
        map.setLayoutProperty('poi-heatmap', 'visibility', 'none');
      }
    }
  });

// Info-text
  const infoText = document.getElementById('info-text');

  // 用于全图模式的 infoText 更新
  function updateInfoGlobal(activeTypes) {
    const baseText = `
      <p>
      <strong>Chain cafés</strong> are strongly clustered around central commercial zones such as 
      <strong>Shinjuku</strong>, <strong>Ikebukuro</strong>, and <strong>Minato</strong>, 
      closely following Tokyo's retail and transportation corridors.<br>
      <strong>Independent cafés</strong> form scattered yet dense clusters in creative and residential districts like 
      <strong>Setagaya</strong>, <strong>Bunkyo</strong>, and <strong>Suginami</strong>, 
      often appearing near university and cultural hubs.<br>
      <strong>Community/Old-fashioned cafés</strong> tend to be located in traditional, older neighborhoods such as 
      <strong>Katsushika</strong>, <strong>Arakawa</strong>, and <strong>Sumida</strong>, 
      reflecting a more localized and slower-paced coffee culture.
    </p>
    `
      ;

    const activeStr = `<p><em>Currently displaying:</em> <strong>${activeTypes.join(', ')}</strong></p>`;

    infoText.innerHTML = baseText + activeStr;
  }

  // 用于点击行政区后的 infoText 更新
  function updateInfoForRegion(regionNameJa, regionNameEn, cafeCounts) {
    const regionLabel = `<strong>${regionNameEn}</strong>${regionNameJa ? ` (${regionNameJa})` : ''}`;

    const total = cafeCounts['Chain'] + cafeCounts['Independent'] + cafeCounts['Community/Old-fashioned'];

    const countText = `
      <strong>Chain: </strong> ${cafeCounts['Chain']} | 
      <strong>Independent: </strong> ${cafeCounts['Independent']} | 
      <strong>Community/Old-fashioned: </strong> ${cafeCounts['Community/Old-fashioned']}<br>
      <strong>Total:</strong> ${total} cafés
    `;

    infoText.innerHTML = `<p>${regionLabel}</p><p>${countText}</p>`;
  }


//初始 infoText 设置（全图状态）
const initialActiveTypes = Array.from(document.querySelectorAll('.layer-toggle'))
  .filter(i => i.checked)
  .map(i => i.dataset.type);

updateInfoGlobal(initialActiveTypes);

// 行政区hover box
const hoverLabel = document.getElementById('hover-label');

map.on('mousemove', 'boundary-fill', e => {
  const feature = e.features[0];
  const regionNameJa = feature.properties.name || '';
  const regionNameEn = feature.properties.name_en || '';

  hoverLabel.innerText = `${regionNameEn}${regionNameJa ? ` (${regionNameJa})` : ''}`;
  hoverLabel.style.display = 'block';
});

map.on('mouseleave', 'boundary-fill', () => {
  hoverLabel.style.display = 'none';
});

// 跳转aoyama
document.getElementById('btn-aoyama').addEventListener('click', () => {
  window.open('urban_tokyo_aoyama.html', '_blank'); // 新窗口打开
});

});