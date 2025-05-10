// === 0. 基础大页面交互 ===
// 导航栏下拉
function selectCity(city) {
  console.log("City selected:", city);

  // TODO: 可以根据 city 名称跳转或切换内容
  // 比如：
  // if (city === 'paris') window.location.href = 'culture_paris.html';
  // 或调用函数 loadCity(city)
}

// 左侧面板交互
// 控制箭头方向
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.card-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      body.classList.toggle('collapsed');
      header.classList.toggle('collapsed'); // 控制箭头旋转
    });
  });
});

// === 1. 添加mapbox图层 ===
mapboxgl.accessToken = 'pk.eyJ1IjoiaXh4aWlyaXMiLCJhIjoiY202aTB2bTI1MDNpNTJqc2h0NW0xeTdlZSJ9.Oh-wamriLR992Hi8Vqm8tg';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ixxiiris/cm8lrey81005d01s9byfx4474', // 铅笔风格地图
  center: [139.75, 35.68], // 东京中心
  zoom: 11
});

map.on('load', () => {

  // === 1. Cafe POIs 点图层 ===
  map.addSource('cafes', {
    type: 'vector',
    url: 'mapbox://ixxiiris.0en235v1'
  });

  map.addLayer({
    id: 'poi-layer',
    type: 'circle',
    source: 'cafes',
    'source-layer': 'tokyo_cafes_classified-6yg9ud',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8, 2,
        10, 3,   // 在 zoom=10 时
        12, 4,   // zoom=12 时
        16, 6    // zoom=16 时
      ],
      'circle-color': [
        'match',
        ['get', 'cafe_cat_1'],
        'Chain', '#b1150c',
        'Independent', '#5079b2',
        'Community/Old-fashioned', '#c8691c',
        '#888'
      ],
      'circle-opacity': 0.8,

    // 白色描边
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 0.6
    }
  });

  // === 2. Boundary 边界图层 ===
  // 添加边界 source
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
  }, 'poi-layer'); // 确保放在点图层下面

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
  }, 'poi-layer');

  // === 3. KDE 热力图（GeoTIFF Raster） ===
  map.addSource('kde', {
    type: 'raster',
    url: 'mapbox://ixxiiris.bqp74p6f',
    tileSize: 256
  });

  map.addLayer({
    id: 'heatmap-layer',
    type: 'raster',
    source: 'kde',
    layout: {
      visibility: 'none'
    },
    paint: {
      'raster-opacity': 0.7
    }
  });

  // === 4. 图层控制器 ===
  document.getElementById('layer-poi').addEventListener('change', (e) => {
    map.setLayoutProperty(
      'poi-layer',
      'visibility',
      e.target.checked ? 'visible' : 'none'
    );
  });

  document.getElementById('layer-heatmap').addEventListener('change', (e) => {
    map.setLayoutProperty(
      'heatmap-layer',
      'visibility',
      e.target.checked ? 'visible' : 'none'
    );
  });
});

