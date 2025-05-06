let fullData = [];  // 保存全部数据

// 初始化地球
const globe = Globe()
.globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
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
        infoBox.innerHTML = `
            <strong> Route:</strong> ${d.Exporter} → ${d.Importer}<br>
            <strong> Weight:</strong> ${d['Weight (1000kg)']} metric ton<br>
            <strong> Value:</strong> ${d['Value (1000USD)']}k USD<br>
            <strong> Commondity:</strong> ${d['commodity']}
        `;
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
    d3.json("data/sim_bond.geojson"),
    d3.csv("data/combined_tradeflow.csv")
]).then(function([boundaryData, raw_flow]) {

    console.log("加载的数据：", raw_flow.slice(0, 5));
    globe
        .polygonsData(boundaryData.features);
    

    fullData = raw_flow;  // 保存所有数据

    // 初始化显示（比如默认显示全部）
    updateGlobeArcs('all');
});

 
// 更新飞线数据函数
function updateGlobeArcs(commodityType) {
    let filteredData = fullData
        .filter(d => !isNaN(+d['Weight (1000kg)']));

    if (commodityType !== 'all') {
        filteredData = filteredData.filter(d => d['commodity'] === commodityType);
    }

    // 这里比如取前 1%
    const topData = filteredData
        .sort((a, b) => +b['Weight (1000kg)'] - +a['Weight (1000kg)'])
        .slice(0, Math.max(1, Math.floor(filteredData.length * 0.008)));

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
});
