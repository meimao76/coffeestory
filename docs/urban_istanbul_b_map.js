mapboxgl.accessToken = 'pk.eyJ1IjoiY3N5LWNmIiwiYSI6ImNtN3AwMGNwcDBiZ2QyanF5MjY3enNjYmUifQ.PtjSbRT97fZ1jfmVSdJ7gw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/csy-cf/cmawrlx76006e01sdeb23ga5d',
  center: [28.9764, 41.0305], // galata tower center
  zoom: 14.5
});

map.on('load', () => {

  // 监听事件
  let coffeeStatsChart = null;
  let axisFlashInterval = null;
  let hoveredAxisId = null;

  // 比例尺指北针
    // 添加比例尺
    map.addControl(new mapboxgl.ScaleControl({
      maxWidth: 120,
      unit: 'metric'
    }), 'bottom-right');

    // 添加指北针（罗盘控制）
    map.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true
    }), 'top-right');

  // beyogul Boundary图层
  // === beyogul 边界图层 ===
  map.addSource('beyogul-boundary', {
    type: 'vector',
    url: 'mapbox://csy-cf.d5ob0yz2'
    });

  map.addLayer({
    id: 'beyogul-boundary-fill',
    type: 'fill',
    source: 'beyogul-boundary',
    'source-layer': 'b_boundary-46gwce', 
    paint: {
        'fill-color': '#f6e9cd',
        'fill-opacity': 0.25
    }
    });

  map.addLayer({
    id: 'beyogul-boundary-line',
    type: 'line',
    source: 'beyogul-boundary',
    'source-layer': 'b_boundary-46gwce',
    paint: {
        'line-color': '#8c5e3c',
        'line-width': 2,
        'line-dasharray': [2, 1.5]
    }
    });
  
    map.addLayer({
    id: 'beyogul-boundary-shadow',
    type: 'line',
    source: 'beyogul-boundary',
    'source-layer': 'b_boundary-46gwce',
    paint: {
      'line-color': 'rgba(0, 0, 0, 0.13)', // 黑色透明度即阴影感
      'line-width': 6, // 阴影比主线宽
      'line-blur': 2   // 模糊边缘
    }
  }, 'beyogul-boundary-line'); //


    // === 添加主轴线数据源 ===
    map.addSource('b-line', {
    type: 'vector',
    url: 'mapbox://csy-cf.34elyui6'
    });

    // === 主轴线图层 ===
    map.addLayer({
        id: 'beyogul-axis-line',
        type: 'line',
        source: 'b-line',
        'source-layer': 'b_line-c7qmoo',
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color': '#6f1d1b',
            'line-width': [
              'interpolate', ['linear'], ['zoom'],
              10, 2,    // 在 zoom 10 时线宽为 2
              13, 8,    // 在 zoom 13 时线宽为 8
              16, 15    // 在 zoom 16 时线宽为 15
            ],
            'line-opacity': 0.8
        }
    });


  // === aoyama cafe === 
  map.addSource('cafes_beyogul', {
    type: 'vector',
    url: 'mapbox://csy-cf.6y6sw3sa'
  });

  // 地铁图层
  map.addSource('beyogul_tourism', {
    type: 'vector',
    url: 'mapbox://csy-cf.d54fgodk'
    });

  map.loadImage('image/ist/tourism.png', (error, image) => {
  if (error) throw error;
  map.addImage('tourism-icon', image);

  map.addLayer({
    id: 'beyogul_tourism-symbol',
    type: 'symbol',
    source: 'beyogul_tourism',
    'source-layer': 'b_tourism2-3zs1p1',
    layout: {
      'icon-image': 'tourism-icon',
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11, 0.1,   // zoom 11 及以下：缩小显示
        14, 0.2,   // zoom 14：正常显示
        17, 0.5 ,   // zoom 17：稍大一点
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
    id: 'beyogul-heatmap',
    type: 'heatmap',
    source: 'cafes_beyogul',
    'source-layer': 'b_cafe-de1a7u',
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
      source: 'cafes_beyogul',
      'source-layer': 'b_cafe-de1a7u',
      filter: ['==', ['get', 'category'], type],
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, 3,
          14, 6
        ],
        'circle-color': color,
        'circle-opacity': 0.8,
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

      // 精选咖啡
      const featuredChecked = activeTypes.includes('Featured');
      if (map.getLayer('beyogul-featured-cafes')) {
        map.setLayoutProperty('beyogul-featured-cafes', 'visibility', featuredChecked ? 'visible' : 'none');
      }

      // 三类咖啡
      const typeToLayerId = {
        'Chain': 'beyogul-chain',
        'Independent': 'beyogul-independent',
        'Community/Old-fashioned': 'beyogul-communityoldfashioned'
      };
        
      // 控制三类 POI 图层显隐
      Object.entries(typeToLayerId).forEach(([type, layerId]) => {
        if (!map.getLayer(layerId)) return;
        map.setLayoutProperty(layerId, 'visibility',
          activeTypes.includes(type) ? 'visible' : 'none'
        );
      });

      // 控制热力图图层显隐与过滤
      if (map.getLayer('beyogul-heatmap')) {
        if (activeTypes.length > 0) {
          map.setLayoutProperty('beyogul-heatmap', 'visibility', 'visible');
          map.setFilter('beyogul-heatmap', ['in', ['get', 'category'], ['literal', activeTypes]]);
        } else {
          map.setLayoutProperty('beyogul-heatmap', 'visibility', 'none');
        }
      }
    });
  });


  // 统计图（全区域）
  function updateStats() {
    const features = map.querySourceFeatures('cafes_beyogul', {
    sourceLayer: 'b_cafe-de1a7u' 
    });


    const counts = {
        'Chain': 0,
        'Independent': 0,
        'Community/Old-fashioned': 0
    };

    features.forEach(f => {
        const cat = f.properties.category;
        if (counts[cat] !== undefined) counts[cat]++;
    });

    drawStats(counts, 'Cafés in Beyoğlu');
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
    'beyogul-chain',
    'beyogul-independent',
    'beyogul-communityoldfashioned'
  ];

  poiLayers.forEach(layerId => {
    map.on('mouseenter', layerId, e => {
      // 检查是否也命中 featured café
        const overlapped = map.queryRenderedFeatures(e.point, {
          layers: ['beyogul-featured-cafes']
        });

        if (overlapped.length > 0) return; // 如果命中精选，跳过普通 hover

      map.getCanvas().style.cursor = 'pointer';

      const coordinates = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;
      const name = props.name || 'Unnamed Café';
      const type = props.category;

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

  // === 轴线信息展示 ===
  const axisHoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  map.on('mouseenter', 'beyogul-axis-line', e => {
    const feature = e.features[0];
    hoveredAxisId = feature.id;

    map.getCanvas().style.cursor = 'pointer';

    // 启动闪烁动画
    let toggle = true;
    axisFlashInterval = setInterval(() => {
      map.setPaintProperty('beyogul-axis-line', 'line-color', toggle ? '#f09134' : '#862906');
      toggle = !toggle;
    }, 500);

    // 使用全局唯一 popup 实例
    axisHoverPopup
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>Beyoğlu Cultural Route</strong><br>
        Where Heritage Meets Hospitality.<br>
        <em>Click to see more →</em>
      `)
      .addTo(map);
  });

  map.on('mouseleave', 'beyogul-axis-line', () => {
    map.getCanvas().style.cursor = '';
    
    // 停止闪烁
    clearInterval(axisFlashInterval);
    axisFlashInterval = null;

    // 恢复颜色
    map.setPaintProperty('beyogul-axis-line', 'line-color', '#6f1d1b');

    // 移除 popup
    axisHoverPopup.remove();

    hoveredAxisId = null;
  });

    // 点击后展现信息 + Area guide
    map.on('click', 'beyogul-axis-line', e => {

      // 检查该点是否也命中了地铁站图层
      const overlappingMetro = map.queryRenderedFeatures(e.point, {
        layers: ['beyogul_tourism-symbol']
      });

      // 如果有地铁图层点在这个位置，跳过轴线逻辑
      if (overlappingMetro.length > 0) {
        return; // 提前结束：优先执行地铁 click
      }

      //正常轴线click
      const lngLat = e.lngLat;

      new mapboxgl.Popup({
          className: 'axis-popup',
          closeButton: true,
          closeOnClick: true
        })
        .setLngLat(lngLat)
        .setHTML(`
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <img src="image/ist/beyogul.png" width="30" height="40" alt="When in Tokyo logo" />
              <div>
                <strong style="font-size: 15px;">Beyoğlu Cultural Route</strong><br>
                <em style="color: #666;">Where Heritage Meets Hospitality</em>
              </div>
            </div>
            <p style="margin: 4px 0;">
              Stretching from Galata Tower to Taksim Square, this cultural corridor invites visitors to explore Istanbul's rich layers — from Ottoman-era streets to contemporary arts venues — all interwoven with the scent of coffee.
            </p>
            <p style="margin: 4px 0;">
              Traditional Turkish cafés sit beside modern roasters, each acting as a node in a walkable urban web shaped by tourism and cultural revival.
            </p>
            <p style="margin: 4px 0;">
              <strong>Planning Vision:</strong> Promote local identity and tourism through heritage preservation, spatial charm, and vibrant café culture.
            </p>
            <p style="margin-top: 8px;">
            🔗 <a href="https://test.akmistanbul.gov.tr/beyoglu-culture-route" target="_blank" rel="noopener">
              View Beyoglu Culture Route Guide (external link)
              </a>
            </p>
          </div>
        `)
        .addTo(map);
    });
  
  // === 地铁站信息展示 ===
  // hover信息
    const tourismPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    map.on('mouseenter', 'beyogul_tourism-symbol', e => {
      map.getCanvas().style.cursor = 'pointer';

      const name = e.features[0].properties.name || 'Tourism';
      tourismPopup
        .setLngLat(e.lngLat)
        .setHTML(`
        <div style="display: flex; align-items: center; gap: 6px;">
          <img src="image/ist/tourism.png" width="40" height="40" alt="toursm Icon" />
          <div>
            <strong>Beyogul Tourism Attraction</strong><br>
            <em>Click to explore nearby cafés</em>
          </div>
        </div>
        `)
        .addTo(map);
    });

    map.on('mouseleave', 'beyogul_tourism-symbol', () => {
      map.getCanvas().style.cursor = '';
      tourismPopup.remove();
    });

  // Click + 生成buffer 与统计咖啡厅
    // 封装函数先
    function removeMetroBuffer() {
    if (map.getLayer('tourism-buffer')) {
      map.removeLayer('tourism-buffer');
    }
    if (map.getSource('tourism-buffer')) {
      map.removeSource('tourism-buffer');
    }
  }

  function handleMetroClick(e) {
    const feature = e.features[0];
    const lngLat = e.lngLat;
    const stationName = feature.properties.name || 'Tourism';

    // 1. Create 300m buffer using Turf
    const center = turf.point(lngLat.toArray());
    const buffer = turf.buffer(center, 0.3, { units: 'kilometers' });

    // 2. Draw buffer on map
    removeMetroBuffer(); // remove previous one if exists
    map.addSource('tourism-buffer', {
      type: 'geojson',
      data: buffer
    });
    map.addLayer({
      id: 'tourism-buffer',
      type: 'fill',
      source: 'tourism-buffer',
      paint: {
        'fill-color': '#f09134',
        'fill-opacity': 0.3,
        'fill-outline-color': '#a6490c'
      }
    }, 'beyogul-chain'); // insert below POI layer

    // 3. Query cafés within buffer
    const allPOIs = map.querySourceFeatures('cafes_beyogul', {
      sourceLayer: 'b_cafe-de1a7u'
    });

    const cafesInBuffer = allPOIs.filter(f => {
      const pt = turf.point(f.geometry.coordinates);
      return turf.booleanPointInPolygon(pt, buffer);
    });

    const counts = {
      'Chain': 0,
      'Independent': 0,
      'Community/Old-fashioned': 0
    };
    cafesInBuffer.forEach(f => {
      const cat = f.properties.category;
      if (counts[cat] !== undefined) counts[cat]++;
    });

    // 4. Show popup
    const popupHTML = `
      <div style="max-width: 340px;">
        <strong> ${stationName}</strong><br>
        <em>Cafés within 300m walking distance:</em>
        <ul style="margin-top: 4px; padding-left: 10px;">
          <li><strong>Chain:</strong> ${counts['Chain']}</li>
          <li><strong>Independent:</strong> ${counts['Independent']}</li>
          <li><strong>Community:</strong> ${counts['Community/Old-fashioned']}</li>
        </ul>
      </div>
    `;

    const popup = new mapboxgl.Popup({ closeButton: true })
      .setLngLat(lngLat)
      .setHTML(popupHTML)
      .addTo(map);

    // 5. Remove buffer when popup closed
    popup.on('close', () => {
      removeMetroBuffer();
    });
  }
  
  // 点击地铁站调用click后显示buffer与弹窗
  map.on('click', 'beyogul_tourism-symbol', handleMetroClick);

  // 点击空白处清除
  map.on('click', e => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['beyogul_tourism-symbol']
    });

    if (features.length === 0) {
      removeMetroBuffer();
    }
  });

  // // === 精选咖啡厅 ===
  // 1. 定义精选 café 名称精确列表
    const featuredCafeNames = [
      "Mandabatmaz",
      "Hafiz Mustafa 1864",
      "Viyana Kahvesi",
      "Drip Coffee",
      "Noir Pit"
    ];

    // 2. 每个 café 的详细信息
    const featuredCafeInfo = {
      "Mandabatmaz": {
        title: "Mandabatmaz Beyogul",
        description: "An iconic Turkish café near Istiklal Avenue, known for its authentic brews, tiny stools, and deep-rooted local charm.",
        image: "image/ist/mandabatmaz.jpg",
        link: "https://www.instagram.com/mandabatmazkahvesi/?hl=en"
      },
      "Hafiz Mustafa 1864": {
        title: "Hafiz Mustafa 1864",
        description: "An iconic Istanbul dessert institution since 1864, blending Ottoman tradition with indulgent sweets in a gilded setting.",
        image: "image/ist/hafiz_mustafa_1864.jpg",
        link: "https://www.hafizmustafa.com/en"
      },
      "Viyana Kahvesi": {
        title: "Viyana Kahvesi",
        description: "nspired by Vienna's coffee legacy, this café reinterprets Turkish flavors and hospitality with a modern twist of chocolate and elegance.",
        image: "image/ist/viyana_kahvesi.jpg",
        link: "https://viyanakahvesi.com/"
      },
      "Drip Coffee": {
        title: "Drip Coffee",
        description: "A hidden local favorite for serious coffee lovers, offering peaceful patio vibes and a devotion to drip.",
        image: "image/ist/drip_coffee.jpg",
        link: "https://www.yelp.com/biz/drip-coffeeist-istanbul-4"
      },
      "Noir Pit": {
        title: "Noir Pit Coffee Co. Pera",
        description: "A friendly and relaxed café praised for its cold brews, affordable treats, and quietly welcoming atmosphere.",
        image: "image/ist/noir.jpg",
        link: "https://www.noirpit.com/"
      }
    };

    // 3. 全局 hover 弹窗
    const featuredPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    // 4. 加载图标 + 添加图层 + hover/click绑定
    map.loadImage('image/TOYKO/star.png', (error, image) => {
      if (error) throw error;

      if (!map.hasImage('featured-star-icon')) {
        map.addImage('featured-star-icon', image);
      }

      map.addLayer({
        id: 'beyogul-featured-cafes',
        type: 'symbol',
        source: 'cafes_beyogul',
        'source-layer': 'b_cafe-de1a7u',
        filter: ['in', ['get', 'name'], ['literal', featuredCafeNames]],
        layout: {
          'icon-image': 'featured-star-icon',
          'icon-size': [
            'interpolate', ['linear'], ['zoom'],
            10, 0.08,
            14, 0.11,
            16, 0.15
          ],
          'icon-allow-overlap': true
        }
      }, null);
      
      // 强制刷新一次
      map.setLayoutProperty('beyogul-featured-cafes', 'visibility', 'none');
      map.setLayoutProperty('beyogul-featured-cafes', 'visibility', 'visible');

      // Hover 提示
      map.on('mouseenter', 'beyogul-featured-cafes', e => {
        if (map.getLayoutProperty('beyogul-featured-cafes', 'visibility') !== 'visible') return;

        const name = e.features[0].properties.name;
        map.getCanvas().style.cursor = 'pointer';

        featuredPopup
          .setLngLat(e.lngLat)
          .setHTML(`<strong>☕ ${name}</strong><br><em>Click to learn more →</em>`)
          .addTo(map);
      });

      map.on('mouseleave', 'beyogul-featured-cafes', () => {
        map.getCanvas().style.cursor = '';
        featuredPopup.remove();
      });

      // Click 弹出图文介绍
      map.on('click', 'beyogul-featured-cafes', e => {
        if (map.getLayoutProperty('beyogul-featured-cafes', 'visibility') !== 'visible') return;

        const props = e.features[0].properties;
        const cafeData = featuredCafeInfo[props.name];
        if (!cafeData) return;

        const popupHTML = `
          <div style="max-width: 320px;">
            <img src="${cafeData.image}" style="width: 100%; border-radius: 6px; margin-bottom: 6px;" />
            <strong>${cafeData.title}</strong>
            <p style="margin: 6px 0;">${cafeData.description}</p>
            ${cafeData.link ? `
              <p><a href="${cafeData.link}" target="_blank" rel="noopener">
              🔗 Visit Official/Related Page</a></p>` : ''}
          </div>
        `;

        new mapboxgl.Popup({ closeButton: true })
          .setLngLat(e.lngLat)
          .setHTML(popupHTML)
          .addTo(map);
      });
    });

  // 跳转istanbul
  document.getElementById('btn-istanbul').addEventListener('click', () => {
    window.open('urban_istanbul.html', '_blank'); // 新窗口打开
  });
});
