mapboxgl.accessToken = 'pk.eyJ1IjoiaXh4aWlyaXMiLCJhIjoiY202aTB2bTI1MDNpNTJqc2h0NW0xeTdlZSJ9.Oh-wamriLR992Hi8Vqm8tg';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ixxiiris/cm8lrey81005d01s9byfx4474',
  center: [139.714, 35.669], // Aoyama center
  zoom: 14.5
});

map.on('load', () => {

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

  // 数据源占位[需替换]
  map.addSource('cafes_aoyama', {
    type: 'vector',
    url: 'mapbox://your.mapbox.tileset.id'
  });

  // 热力图图层
  map.addLayer({
    id: 'aoyama-heatmap',
    type: 'heatmap',
    source: 'cafes_aoyama',
    'source-layer': 'your-layer-name',
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
      'source-layer': 'your-layer-name',
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
    const features = map.queryRenderedFeatures({
      layers: Object.keys(cafeTypes).map(type => `aoyama-${type.toLowerCase().replace(/[^a-z]/g, '')}`)
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

    drawStats(counts);
  }

  function drawStats(counts) {
    const ctx = document.getElementById('coffee-stats-chart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(cafeTypes),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: Object.values(cafeTypes)
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true },
          y: { ticks: { display: false }, grid: { display: false } }
        }
      }
    });
  }

  map.on('idle', () => {
    updateStats();
  });

  document.getElementById('reset-view-btn').addEventListener('click', () => {
    map.flyTo({ center: [139.717, 35.664], zoom: 14 });
  });

  document.getElementById('info-text').innerHTML = `
    <p>
      Aoyama hosts a refined cluster of cafés. Chains are few and orbit Omotesando,
      while independent shops dot the quiet alleys. The scene is defined by quality over quantity.
    </p>
  `;

});
