mapboxgl.accessToken = 'pk.eyJ1IjoiaXh4aWlyaXMiLCJhIjoiY202aTB2bTI1MDNpNTJqc2h0NW0xeTdlZSJ9.Oh-wamriLR992Hi8Vqm8tg';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ixxiiris/cm8lrey81005d01s9byfx4474',
  center: [139.714, 35.669], // Aoyama center
  zoom: 15
});

map.on('load', () => {

  // 监听事件
  let coffeeStatsChart = null;

  // Aoyama Boundary图层
  // === Aoyama 边界图层 ===
  map.addSource('aoyama-boundary', {
    type: 'vector',
    url: 'mapbox://ixxiiris.33k3uexb'
    });

  map.addLayer({
    id: 'aoyama-boundary-fill',
    type: 'fill',
    source: 'aoyama-boundary',
    'source-layer': 'tokyo_ayoma_boundary-2cw7di', 
    paint: {
        'fill-color': '#f6e9cd',
        'fill-opacity': 0.25
    }
    });

  map.addLayer({
    id: 'aoyama-boundary-line',
    type: 'line',
    source: 'aoyama-boundary',
    'source-layer': 'tokyo_ayoma_boundary-2cw7di',
    paint: {
        'line-color': '#8c5e3c',
        'line-width': 2,
        'line-dasharray': [2, 1.5]
    }
    });

    // === 添加主轴线数据源 ===
    map.addSource('aoyama-axis', {
    type: 'vector',
    url: 'mapbox://ixxiiris.ch1d5akl'
    });

    // === 主轴线图层（线条 + 箭头） ===
    map.addLayer({
        id: 'aoyama-axis-line',
        type: 'line',
        source: 'aoyama-axis',
        'source-layer': 'aoyama_axis-27o82p',
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color': '#912f56',
            'line-width': 3
        }
    });


  // === aoyama cafe === 
  map.addSource('cafes_aoyama', {
    type: 'vector',
    url: 'mapbox://ixxiiris.6bngd8eg'
  });

  // 地铁图层
  map.addSource('aoyama-metro', {
    type: 'vector',
    url: 'mapbox://ixxiiris.d40r7h06'
    });

  map.loadImage('image/TOYKO/Tokyo_Metro_logo.png', (error, image) => {
  if (error) throw error;
  map.addImage('metro-icon', image);

  map.addLayer({
    id: 'aoyama-metro-symbol',
    type: 'symbol',
    source: 'aoyama-metro',
    'source-layer': 'aoyama_metro-9zwz3d',
    layout: {
      'icon-image': 'metro-icon',
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11, 0.02,   // zoom 11 及以下：缩小显示
        14, 0.05,   // zoom 14：正常显示
        17, 0.1 ,   // zoom 17：稍大一点
        ],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'text-field': ['get', 'name_en'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-offset': [0, 0.8],
      'text-anchor': 'top'
    },
      paint: {
      'icon-opacity': 0.8,
      'text-opacity': 0.9,
      'text-color': '#333'
    }
    });
  });

  // 热力图图层
  map.addLayer({
    id: 'aoyama-heatmap',
    type: 'heatmap',
    source: 'cafes_aoyama',
    'source-layer': 'aoyama_cafes_utf8-c1r9t3',
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

  // 三类咖啡点图层
  const cafeTypes = {
    'Chain': '#b1150c',
    'Independent': '#7E8EA5',
    'Community/Old-fashioned': '#5E382F'
  };

  Object.entries(cafeTypes).forEach(([type, color]) => {
    const layerId = `aoyama-${type.toLowerCase().replace(/[^a-z]/g, '')}`;
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: 'cafes_aoyama',
      'source-layer': 'aoyama_cafes_utf8-c1r9t3',
      filter: ['==', ['get', 'cafe_cat_1'], type],
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, 3,
          14, 6
        ],
        'circle-color': color,
        'circle-opacity': 0.6,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 0.5
      }
    });
  });

  // 图层 toggle
  document.querySelectorAll('.layer-toggle').forEach(input => {
    input.addEventListener('change', () => {
      const activeTypes = Array.from(document.querySelectorAll('.layer-toggle'))
        .filter(i => i.checked)
        .map(i => i.dataset.type);

      Object.keys(cafeTypes).forEach(type => {
        const layerId = `aoyama-${type.toLowerCase().replace(/[^a-z]/g, '')}`;
        if (!map.getLayer(layerId)) return;
        map.setLayoutProperty(
          layerId,
          'visibility',
          activeTypes.includes(type) ? 'visible' : 'none'
        );
      });

      if (map.getLayer('aoyama-heatmap')) {
        if (activeTypes.length > 0) {
          map.setLayoutProperty('aoyama-heatmap', 'visible');
          map.setFilter('aoyama-heatmap', ['in', ['get', 'cafe_cat_1'], ['literal', activeTypes]]);
        } else {
          map.setLayoutProperty('aoyama-heatmap', 'none');
        }
      }
    });
  });

  // 统计图（全区域）
  function updateStats() {
    const features = map.querySourceFeatures('cafes_aoyama', {
    sourceLayer: 'aoyama_cafes_utf8-c1r9t3' 
    });


    const counts = {
        'Chain': 0,
        'Independent': 0,
        'Community/Old-fashioned': 0
    };

    features.forEach(f => {
        const cat = f.properties.cafe_cat_1;
        if (counts[cat] !== undefined) counts[cat]++;
    });

    drawStats(counts, 'Cafés in Aoyama');
    }

    function drawStats(counts, chartTitle) {
    const ctx = document.getElementById('coffee-stats-chart').getContext('2d');

    if (coffeeStatsChart) {
        coffeeStatsChart.destroy();
    }

    coffeeStatsChart = new Chart(ctx, {
        type: 'bar',
        data: {
        labels: ['Chain', 'Independent', 'Community'],
        datasets: [{
            data: [
            counts['Chain'],
            counts['Independent'],
            counts['Community/Old-fashioned']
            ],
            backgroundColor: ['#b1150c', '#7E8EA5', '#5E382F']
        }]
        },
        options: {
        responsive: true,
        indexAxis: 'y',
        layout: { padding: 0 },
        plugins: {
            legend: { display: false },
            title: {
            display: true,
            text: chartTitle,
            font: { size: 16, weight: 'bold' }
            },
            tooltip: { enabled: true }
        },
        scales: {
            x: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Number',
                font: { size: 13, weight: 'bold' }
            },
            ticks: { display: false },
            grid: { display: false }
            },
            y: {
            title: {
                display: true,
                text: 'Type',
                font: { size: 13, weight: 'bold' }
            },
            ticks: { display: false },
            grid: { display: false }
            }
        }
        }
    });
    }


  map.once('idle', () => {
    updateStats();
  });

  // POIhover 显示名称类别
  // 创建全局 popup 对象，避免重复创建
  const poiPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  const poiLayers = [
    'aoyama-chain',
    'aoyama-independent',
    'aoyama-communityoldfashioned'
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

  // info - text 区域
  document.getElementById('info-text').innerHTML = `
    <p>
      Aoyama hosts a refined cluster of cafés. Chains are few and orbit Omotesando,
      while independent shops dot the quiet alleys. The scene is defined by quality over quantity.
    </p>
  `;

  //点击轴线
  map.on('click', 'aoyama-axis-line', e => {
  const props = e.features[0].properties;
  const info = props.plan_info || 'No planning info available.';

  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`<strong>Main Axis</strong><br>${info}`)
    .addTo(map);
});

});
