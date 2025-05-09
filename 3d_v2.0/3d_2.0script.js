let fullData = []; 
let rawData = [];   
let roastData = []; 
 // 保存全部数据

// 初始化地球
const globe = Globe()
  // 1. 地球表面贴图（暗面）
  .globeImageUrl('https://raw.githubusercontent.com/meimao76/coffeestory/main/image/world.topo.bathy.200412.3x5400x2700.png')
  .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
  // 2. 地球高光／凹凸贴图（模拟山脉、海洋波纹）
  .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
  .showAtmosphere(true)

    .arcDashLength(0.5)
    .arcDashGap(0)
    .arcDashAnimateTime(0)

    .arcDashLength(0.7)  // 每条虚线长度
    .arcDashGap(0.3)        // 虚线间隔
    .arcDashInitialGap(() => Math.random())  // 初始偏移（让飞线动感更自然）
    .arcDashAnimateTime(4000)  // 动画一圈的时间（毫秒）

    // 飞线颜色（起点颜色 + 终点颜色）
    .arcColor(d => {
        if (d.commodity === 'raw bean') {
            return [`rgba(186, 191, 192, 1)`, `rgba(215, 207, 166, 0.6)`,`rgba(42, 38, 39, 0.8)`];
        } else if (d.commodity === 'roasted bean') {
            return [`rgba(42, 38, 39, 0.8)`, `rgba(212, 219, 85, 0.6)`,`rgba(225, 101, 7, 0.8)`];
        } else {
            return ['#cccccc', '#cccccc'];
        }
    })

    // 飞线出现的动画时间（设为 0 表示立即出现）
    .arcsTransitionDuration(0)
    
    .polygonCapColor(() => 'rgba(0, 0, 0, 0)') // 国界内部透明
    .polygonSideColor(() => 'rgba(0, 0, 0, 0)') // 无侧边
    .polygonStrokeColor(() => '#cccccc') // 国界线颜色
    .polygonAltitude(0.01) // 国界线稍微凸起一点
    .onArcClick(d =>{
        const infoBox = document.getElementById('infoBox');
        
        document.getElementById('infoRoute').textContent = `${d.Exporter} → ${d.Importer}`;
        document.getElementById('infoWeight').textContent = `${d['Weight (1000kg)']} metric ton`;
        document.getElementById('infoValue').textContent = `${d['Value (1000USD)']}k USD`;
        document.getElementById('infoCommodity').textContent = d.commodity;
        console.log(d);
        
        infoBox.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
        const infoBox = document.getElementById('infoBox');
        // 如果点的不是飞线（这里简单判断）
        if (!e.target.closest('canvas')) {
            infoBox.style.display = 'none';
        }
    });

globe(document.getElementById('globeViz'));

// 加载数据：国界线 + 贸易流
Promise.all([
    d3.json("sim_bond.geojson"),
    d3.csv("combined_tradeflow.csv"),
    d3.csv("raw_tradeflow_merged.csv"),
    d3.csv("roasted_tradeflow_merged.csv")
]).then(function([boundaryData, merged_flow, raw, roast]) {

    console.log("加载的数据：", merged_flow.slice(0, 5));
    globe
        .polygonsData(boundaryData.features);
    

    fullData = merged_flow;  // 保存所有数据
    rawData = raw;   
    roastData = roast; 

    // 初始化显示
    updateGlobeArcs('all');
    renderBarChart(rawData, 'barChartraw');
    renderBarChart(roastData, 'barChartroast');
});

 
// 更新飞线数据函数
function updateGlobeArcs(commodityType) {
    let filteredData = fullData
        .filter(d => !isNaN(+d['Weight (1000kg)']))
        .filter(d => !isNaN(+d.lat_export))
        .filter(d => !isNaN(+d.lng_export))
        .filter(d => !isNaN(+d.lat_import))
        .filter(d => !isNaN(+d.lng_import));

    if (commodityType !== 'all') {
        filteredData = filteredData.filter(d => d['commodity'] === commodityType);
    }

    // 这里比如取前 1%
    intercept = 0.006
    const topData = filteredData
        .sort((a, b) => +b['Weight (1000kg)'] - +a['Weight (1000kg)'])
        .slice(0, Math.max(1, Math.floor(filteredData.length * intercept)));

    console.log(`更新为 ${commodityType}，数据量:`, topData.length);

    const weightExtent = d3.extent(topData, d => +d['Weight (1000kg)']);
    console.log('权重范围:', weightExtent);

    const strokeScale = d3.scaleSqrt()
        .domain(weightExtent)
        .range([0.5, 2]);  // 调整范围看效果

    globe
        .arcsData(topData)
        .arcStartLat(d => +d.lat_export)
        .arcStartLng(d => +d.lng_export)
        .arcEndLat(d => +d.lat_import)
        .arcEndLng(d => +d.lng_import)
        .arcStroke(d => strokeScale(+d['Weight (1000kg)']));;
}

// 监听下拉框
document.getElementById('commoditySelector').addEventListener('change', (e) => {
    const selectedCommodity = e.target.value;
    updateGlobeArcs(selectedCommodity);


function renderBarByDimension(data, containerId, dim, year, measure='Weight (1000kg)', topN=5) {
  // 1. 先按年份过滤
  const yearData = data.filter(d => +d.Year === year);

  // 2. 按 dim（'Exporter'／'Importer'／'Trade_route'）聚合
  const agg = Array.from(
    d3.rollup(
      yearData,
      vs => d3.sum(vs, d => +d[measure]),
      d => d[dim]
    ),
    ([key, total]) => ({ key, total })
  );

  // 3. 取前 N
  const top = agg.sort((a,b)=>b.total - a.total).slice(0, topN);

  // 4. 调用你现有的条形图渲染函数，把 top 传进去就行
  drawBar(top, containerId, {key: 'key', value: 'total'});
}
renderBarByDimension(fullData, barChartExportRaw, dim, year, measure='Weight (1000kg)', topN=5)
});



