mapboxgl.accessToken = 'pk.eyJ1IjoiaXh4aWlyaXMiLCJhIjoiY202aTB2bTI1MDNpNTJqc2h0NW0xeTdlZSJ9.Oh-wamriLR992Hi8Vqm8tg';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ixxiiris/cm8lrey81005d01s9byfx4474',
  center: [139.75, 35.68],
  zoom: 11
});

map.on('load', () => {

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
        'Central', '#7E8EA5',
        'Non-central', '#CFD6D4',
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
        'match',
        ['get', 'region_type_en'],
        'Central', '#012340',
        'Non-central', '#364559',
        '#888'
      ],
      'line-opacity': 0.6,
      'line-width': 1.3,
      'line-dasharray': [2, 2]
    }
  });

  // === 2. 咖啡 POI 数据源 === 
map.addSource('cafes', {
  type: 'vector',
  url: 'mapbox://ixxiiris.axyx3gbe' // ✅ 使用你的新 tileset ID
});

// === 3. 热力图图层（插入在 POI 点图层前） ===
map.addLayer({
  id: 'poi-heatmap',
  type: 'heatmap',
  source: 'cafes',
  'source-layer': 'tokyo_cafes_classified_utf8-cxgrm9', // ✅ 新上传的 source-layer 名
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
    'heatmap-opacity': 0.5
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
      'source-layer': 'tokyo_cafes_classified_utf8-cxgrm9', // ✅ 更新 source-layer 名
      filter: ['==', ['get', 'cafe_cat_1'], type], // ✅ 正确字段是 "cafe_cat_1"
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          8, 2.5,
          10, 3.5,
          12, 4.5,
          16, 6
        ],
        'circle-color': color,
        'circle-opacity': 0.8,
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

      // POI 图层显隐
      Object.keys(cafeTypes).forEach(type => {
        const layerId = `poi-${type.toLowerCase().replace(/[^a-z]/g, '')}`;
        map.setLayoutProperty(
          layerId,
          'visibility',
          activeTypes.includes(type) ? 'visible' : 'none'
        );
      });

      // 热力图过滤器同步更新
      if (activeTypes.length > 0) {
        map.setLayoutProperty('poi-heatmap', 'visibility', 'visible');
        map.setFilter('poi-heatmap', ['in', ['get', 'cafe_cat_1'], ['literal', activeTypes]]); // ✅ 用正确字段
      } else {
        map.setLayoutProperty('poi-heatmap', 'visibility', 'none');
      }
    });
  });

  // 卡片折叠功能
  document.querySelectorAll('.card-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      body.classList.toggle('collapsed');
      header.classList.toggle('collapsed');
    });
  });

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

      const popupHTML = `<strong>${name_}</strong><br><em>${type}</em>`;

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

  // 点击行政区显示信息+切换
  let defaultBounds = null;
  const defaultInfoText = "Toggle layers to reveal how Tokyo's urban coffee culture clusters across districts. Statistics and densities will appear here.";

  // 第一次 idle 后获取全图范围
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
  });

  // 点击行政区：聚焦 + 高亮 + 显示双语信息
  map.on('click', 'boundary-fill', e => {
    const feature = e.features[0];
    const regionNameJa = feature.properties.name || '---';
    const regionNameEn = feature.properties.name_en || '';
    const regionType = feature.properties.region_type_en || 'N/A';

    // 聚焦行政区范围
    const bounds = turf.bbox(feature);
    map.fitBounds(bounds, {
      padding: 40,
      duration: 800
    });

    // 高亮当前区域，淡化其余
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

    // 更新 info-text 内容（中英+类型）
    document.getElementById('info-text').textContent =
      `Now viewing: ${regionNameJa} (${regionNameEn}) [${regionType}]`;
  });

  // 行政区按钮
  document.getElementById('reset-view').addEventListener('click', () => {
  if (defaultBounds) {
    map.fitBounds(defaultBounds, { padding: 40 });
  }
  map.setPaintProperty('boundary-fill', 'fill-opacity', 0.3);
  map.setPaintProperty('boundary-line', 'line-opacity', 0.6);
  document.getElementById('info-text').textContent = defaultInfoText;
});

});
