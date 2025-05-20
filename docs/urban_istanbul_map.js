// Istanbul Map JS — adapted from Tokyo version
mapboxgl.accessToken = 'pk.eyJ1IjoiaXh4aWlyaXMiLCJhIjoiY202aTB2bTI1MDNpNTJqc2h0NW0xeTdlZSJ9.Oh-wamriLR992Hi8Vqm8tg';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ixxiiris/cm8lrey81005d01s9byfx4474',
  center: [28.9784, 41.0082],
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
  // 比例尺指北针
    map.addControl(new mapboxgl.ScaleControl({
    maxWidth: 120,
    unit: 'metric'
  }), 'bottom-right');

  map.addControl(new mapboxgl.NavigationControl({
    visualizePitch: true
  }), 'top-right');

  // === 1. 边界图层（底层） ===
  map.addSource('boundary', {
    type: 'vector',
    url: 'mapbox://ixxiiris.2ivdudev'
  });

  map.addLayer({
    id: 'boundary-fill',
    type: 'fill',
    source: 'boundary',
    'source-layer': 'istanbul_with_centrality-1ixb5e',
    paint: {
      'fill-color': [
        'match',
        ['get', 'centrality'],
        'central', '#b08968',
        'non-central', '#ddb892',
        '#CCCCCC'
      ],
      'fill-opacity': 0.3
    }
  });

  map.addLayer({
    id: 'boundary-line',
    type: 'line',
    source: 'boundary',
    'source-layer': 'istanbul_with_centrality-1ixb5e',
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#972d07', // 鼠标悬停时的描边颜色
        [
          'match',
          ['get', 'centrality'],
          'central', '#012340',
          'non-central', '#364559',
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

    // === 1. 添加 POI 数据源 ===
    map.addSource('cafes', {
    type: 'vector',
    url: 'mapbox://ixxiiris.3a9hlzm8'
    });

    // === 2. 热力图层 ===
    map.addLayer({
    id: 'poi-heatmap',
    type: 'heatmap',
    source: 'cafes',
    'source-layer': 'istanbul_cafes_within-4k2ym6',
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

    // === 3. 添加三类咖啡店点图层 ===
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
        'source-layer': 'istanbul_cafes_within-4k2ym6',
        filter: ['==', ['get', 'category'], type],
        paint: {
        'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            8, 2.5,
            10, 3.5,
            12, 4.5,
            16, 6
        ],
        'circle-color': color,
        'circle-opacity': [
            'interpolate', ['linear'], ['zoom'],
            10, 0.4,
            12, 0.6,
            14, 0.8,
            16, 1
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': [
            'interpolate', ['linear'], ['zoom'],
            10, 0.2,
            12, 0.4,
            14, 0.6,
            16, 1
        ]
        }
    });
    });

    // === 4. 图层控制联动（热力图 + POI 点图层） ===
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

        // 点图层：更新 filter 和显隐
        Object.entries(typeToLayerId).forEach(([type, layerId]) => {
        if (!map.getLayer(layerId)) return;
        map.setLayoutProperty(
            layerId,
            'visibility',
            activeTypes.includes(type) ? 'visible' : 'none'
        );

        const baseFilter = ['==', ['get', 'category'], type];
        const finalFilter = currentPolygonFilter
            ? ['all', currentPolygonFilter, baseFilter]
            : baseFilter;

        map.setFilter(layerId, finalFilter);
        });

        // 热力图：聚合类别过滤
        if (map.getLayer('poi-heatmap')) {
        if (activeTypes.length > 0) {
            map.setLayoutProperty('poi-heatmap', 'visibility', 'visible');
            const heatmapFilter = currentPolygonFilter
            ? ['all', currentPolygonFilter, ['in', ['get', 'category'], ['literal', activeTypes]]]
            : ['in', ['get', 'category'], ['literal', activeTypes]];
            map.setFilter('poi-heatmap', heatmapFilter);
        } else {
            map.setLayoutProperty('poi-heatmap', 'visibility', 'none');
        }
        }

        // 信息面板更新
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
    //全域
    function updateDistrictChartGlobal({ layers, title }) {
        const features = map.queryRenderedFeatures({ layers });

        const cafeCounts = {
            'Chain': 0,
            'Independent': 0,
            'Community/Old-fashioned': 0
        };

        features.forEach(f => {
            const cat = f.properties.category; // 从 category 字段读取
            if (cafeCounts[cat] !== undefined) cafeCounts[cat]++;
        });

        updateDistrictChart(cafeCounts, title);
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
        const type = props.category

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

    // 1. Hover 效果：描边 + 阴影 + 显示名字
    map.on('mousemove', 'boundary-fill', e => {
    map.getCanvas().style.cursor = 'pointer';

    if (hoveredRegionId !== null) {
        map.setFeatureState(
        { source: 'boundary', sourceLayer: 'istanbul_with_centrality-1ixb5e', id: hoveredRegionId },
        { hover: false }
        );
    }

    hoveredRegionId = e.features[0].id;

    map.setFeatureState(
        { source: 'boundary', sourceLayer: 'istanbul_with_centrality-1ixb5e', id: hoveredRegionId },
        { hover: true }
    );
    });

    map.on('mouseleave', 'boundary-fill', () => {
    map.getCanvas().style.cursor = '';

    if (hoveredRegionId !== null) {
        map.setFeatureState(
        { source: 'boundary', sourceLayer: 'istanbul_with_centrality-1ixb5e', id: hoveredRegionId },
        { hover: false }
        );
    }
    hoveredRegionId = null;
    });

    // 2. 点击行政区：边界高亮 + 弹出 popup
    map.on('click', 'boundary-fill', e => {
    const feature = e.features[0];
    const regionName = feature.properties.NAME_2 || '---';
    const centrality = feature.properties.centrality || 'N/A';
    const selectedPolygon = feature.geometry;
    const center = turf.center(feature).geometry.coordinates;

    selectedRegionName = regionName;

    // zoom 到该区域
    map.fitBounds(turf.bbox(feature), { padding: 40, duration: 800 });

    // 高亮当前区域
    map.setPaintProperty('boundary-fill', 'fill-opacity', [
        'match',
        ['get', 'NAME_2'],
        regionName, 0.5,
        0.1
    ]);
    map.setPaintProperty('boundary-line', 'line-opacity', [
        'match',
        ['get', 'NAME_2'],
        regionName, 0.9,
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
        ['==', ['get', 'category'], 'Chain']
    ]);
    map.setFilter('poi-independent', [
        'all',
        withinFilter,
        ['==', ['get', 'category'], 'Independent']
    ]);
    map.setFilter('poi-communityoldfashioned', [
        'all',
        withinFilter,
        ['==', ['get', 'category'], 'Community/Old-fashioned']
    ]);

   // 设置热力图图层过滤器
    const heatmapFilter = ['all', withinFilter, ['in', ['get', 'category'], ['literal', activeTypes]]];
    map.setFilter('poi-heatmap', heatmapFilter);

    // 等待 Mapbox 完成所有渲染后，再统计并更新图表
    map.once('idle', () => {
    const featuresInPolygon = map.queryRenderedFeatures({
        layers: ['poi-chain', 'poi-independent', 'poi-communityoldfashioned']
    });

    const cafeCounts = {
        'Chain': 0,
        'Independent': 0,
        'Community/Old-fashioned': 0
    };

    featuresInPolygon.forEach(f => {
        const cat = f.properties.category;
        if (cafeCounts[cat] !== undefined) cafeCounts[cat]++;
    });

    // 弹出 popup 显示行政区名和中心性
    regionPopup
        .setLngLat(center)
        .setHTML(`<strong>${regionName}</strong><br><em>${centrality}</em>`)
        .addTo(map);

    // 更新底部信息栏 info text
    updateInfoForRegion(regionName, centrality, cafeCounts);

    // 更新图表
    updateDistrictChart(cafeCounts, `Cafés in ${regionName}`);
    });


    });

    // Reset View 按钮
    let defaultBounds = null;

    // 1. 获取默认地图边界
        map.once('idle', () => {
        const features = map.querySourceFeatures('boundary', {
            sourceLayer: 'istanbul_with_centrality-1ixb5e'
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

        // 加载 global 图表
        updateDistrictChartGlobal({
            layers: ['poi-chain', 'poi-independent', 'poi-communityoldfashioned'],
            title: 'Cafés in Istanbul'
        });
        chartInitialized = true;

        setTimeout(() => {
            if (coffeeStatsChart) coffeeStatsChart.resize();
        }, 400); // 等待容器撑开后 resize
        });

        // 2. 定义清除 POI 过滤的函数（在 load 内部，全局可调用）
        function resetPOIFilters() {
        map.setFilter('poi-chain', ['==', ['get', 'category'], 'Chain']);
        map.setFilter('poi-independent', ['==', ['get', 'category'], 'Independent']);
        map.setFilter('poi-communityoldfashioned', ['==', ['get', 'category'], 'Community/Old-fashioned']);
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
        updateDistrictChartGlobal({
            layers: ['poi-chain', 'poi-independent', 'poi-communityoldfashioned'],
            title: 'Cafés in Istanbul'
        });

        // 热力图重新设置
        if (map.getLayer('poi-heatmap')) {
            if (activeTypes.length > 0) {
            map.setLayoutProperty('poi-heatmap', 'visibility', 'visible');
            map.setFilter('poi-heatmap', ['in', ['get', 'category'], ['literal', activeTypes]]);
            } else {
            map.setLayoutProperty('poi-heatmap', 'visibility', 'none');
            }
        }
        });

        // Info-text
        const infoText = document.getElementById('info-text');

        // 用于全图模式的 infoText 更新（文字留空，结构保留）
        function updateInfoGlobal(activeTypes) {
        const baseText = `
        <p>
        <strong>Chain cafés</strong> cluster along Istanbul's key commercial corridors — particularly in <strong>Beşiktaş-Levent</strong>, <strong>Kadıköy</strong>, and <strong>Bakırköy</strong> — often following metro lines, ferries, and retail hubs. Their spatial logic is infrastructural and market-oriented.<br>
        <strong>Independent cafés</strong> dominate the landscape with high-density, belt-like patterns in creative and residential districts. Zones like <strong>Moda</strong>, <strong>Nişantaşı</strong>, and <strong>Şişli</strong> host thriving café scenes, often near universities and artistic neighborhoods.<br>
        <strong>Community / Old-fashioned cafés</strong> appear frequently in Istanbul's outer rings — such as <strong>Avcılar</strong>, <strong>Kartal</strong>, and <strong>Pendik</strong>. These locations suggest slower, more localized café cultures grounded in everyday life and older social ties.
        </p>
        `;

        const activeStr = `<p><em>Currently displaying:</em> <strong>${activeTypes.join(', ')}</strong></p>`;

        infoText.innerHTML = activeStr + baseText;
        }

        // 用于点击行政区后的 infoText 更新
        function updateInfoForRegion(regionName, centrality, cafeCounts) {
        const regionLabel = `<strong>${regionName}</strong>${centrality ? ` (${centrality})` : ''}`;

        const total = cafeCounts['Chain'] + cafeCounts['Independent'] + cafeCounts['Community/Old-fashioned'];

        const countText = `
            <strong>Chain: </strong> ${cafeCounts['Chain']} | 
            <strong>Independent: </strong> ${cafeCounts['Independent']} | 
            <strong>Community/Old-fashioned: </strong> ${cafeCounts['Community/Old-fashioned']}<br>
            <strong>Total:</strong> ${total} cafés
        `;

        infoText.innerHTML = `<p>${regionLabel}</p><p>${countText}</p>`;
        }

        // 初始 infoText 设置（全图状态）
        const initialActiveTypes = Array.from(document.querySelectorAll('.layer-toggle'))
        .filter(i => i.checked)
        .map(i => i.dataset.type);

        updateInfoGlobal(initialActiveTypes);

        // 行政区 hover box（字段已更新为 NAME_2）
        const hoverLabel = document.getElementById('hover-label');

        map.on('mousemove', 'boundary-fill', e => {
        const feature = e.features[0];
        const regionName = feature.properties.NAME_2 || '';
        hoverLabel.innerText = regionName;
        hoverLabel.style.display = 'block';
        });

        map.on('mouseleave', 'boundary-fill', () => {
        hoverLabel.style.display = 'none';
        });

        // 跳转aoyama
        document.getElementById('btn-aoyama').addEventListener('click', () => {
        window.open('urban_istanbul_b.html', '_blank'); // 新窗口打开
});

  })