let fullData = []; 
let rawData = [];   
let roastData = []; 
 // 保存全部数据

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
        <div class="info-line">
            <span class="info-label">Route:</span>
            <span class="info-value">${d.Exporter} → ${d.Importer}</span>
        </div>
        <div class="info-line">
            <span class="info-label">Weight:</span>
            <span class="info-value">${d['Weight (1000kg)']} metric ton</span>
        </div>
        <div class="info-line">
            <span class="info-label">Value:</span>
            <span class="info-value">${d['Value (1000USD)']}k USD</span>
        </div>
        <div class="info-line">
            <span class="info-label">Commodity:</span>
            <span class="info-value">${d['commodity']}</span>
        </div>
        
    `;
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
    d3.json("data/sim_bond.geojson"),
    d3.csv("data/combined_tradeflow.csv"),
    d3.csv("data/raw_tradeflow_merged.csv"),
    d3.csv("data/roasted_tradeflow_merged.csv")
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




});

//条形图
function renderBarChart(data, containerId) {

    // 只取前 5 名，按重量降序
    data = data
    .filter(d => !isNaN(+d['Weight (1000kg)']))
    .sort((a, b) => +b['Weight (1000kg)'] - +a['Weight (1000kg)'])
    .slice(0, Math.max(1, Math.floor(data.length * 0.001)));

    console.log("加载的数据：", data.slice(0, 100));
    const barHeight = 10;
    const marginTop = 30;
    const marginRight = 0;
    const marginBottom = 10;
    const marginLeft = 100;  // 左边适当加大，避免名字显示不下
    const width = 600;
    const height = Math.ceil((data.length + 0.1) * barHeight) + marginTop + marginBottom;

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d['Weight (1000kg)'])])
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleBand()
        .domain(data.map(d => d['Exporter']))
        .rangeRound([marginTop, height - marginBottom])
        .padding(0.1);

    const format = d3.format(",.0f");  // 格式化为整数

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    svg.append("g")
        .attr("fill", "steelblue")
      .selectAll()
      .data(data)
      .join("rect")
        .attr("x", x(0))
        .attr("y", d => y(d['Exporter']))
        .attr("width", d => x(+d['Weight (1000kg)']) - x(0))
        .attr("height", y.bandwidth());

    svg.append("g")
        .attr("fill", "white")
        .attr("text-anchor", "end")
      .selectAll()
      .data(data)
      .join("text")
        .attr("x", d => x(+d['Weight (1000kg)']))
        .attr("y", d => y(d['Exporter']) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("dx", -4)
        .text(d => format(d['Weight (1000kg)']))
      .call(text => text.filter(d => x(+d['Weight (1000kg)']) - x(0) < 40)
        .attr("dx", +4)
        .attr("fill", "black")
        .attr("text-anchor", "start"));

    svg.append("g")
        .attr("transform", `translate(0,${marginTop})`)
        .call(d3.axisTop(x).ticks(width / 80))
        .call(g => g.select(".domain").remove());

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).tickSizeOuter(0));

    // 画到指定容器，先清空再添加
    const container = document.getElementById(containerId);
    container.innerHTML = '';  // 清空
    container.appendChild(svg.node());
}




