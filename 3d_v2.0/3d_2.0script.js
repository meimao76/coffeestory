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

    // 保存所有数据
    fullData = merged_flow
        .filter(d => !isNaN(+d['Weight (1000kg)']))
        .filter(d => !isNaN(+d.Year))
        .filter(d => !isNaN(+d.lat_export))
        .filter(d => !isNaN(+d.lng_export))
        .filter(d => !isNaN(+d.lat_import))
        .filter(d => !isNaN(+d.lng_import));

    globe.polygonsData(boundaryData.features);

    // 初始化显示
    updateGlobeArcs('all');
    const defaultYear    = document.getElementById('yearSelector').value;
    const defaultMeasure = 'Weight (1000kg)'; // or 根据 radio 读出来

    renderBarByDimension(fullData, 'barChartTradeFlows',  'Trade_route', defaultYear, defaultMeasure);
    renderBarByDimension(fullData, 'barChartExporters', 'Exporter',    defaultYear, defaultMeasure);
    renderBarByDimension(fullData, 'barChartImporters', 'Importer',    defaultYear, defaultMeasure);

    function renderBarChart(data, containerId, keyField, valueField) {

    data = data.filter(d => !isNaN(+d[valueField]));
        const barHeight   = 20;
        const marginTop   = 30;
        const marginLeft  = 160;
        const width       = 500;
        const height      = (data.length + 0.1) * barHeight + marginTop + 10;

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => +d[valueField])])
      .range([marginLeft, width]);

    const y = d3.scaleBand()
      .domain(data.map(d => d[keyField]))
      .range([marginTop, height])
      .padding(0.1);

    const format = d3.format(",.0f");

    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .style("font", "10px sans-serif");

    // 条形
    svg.append("g")
    .attr("fill", "steelblue")
    .selectAll("rect")
    .data(data)
    .join("rect")
      .attr("x", x(0))
      .attr("y", d => y(d[keyField]))
      .attr("width", d => x(+d[valueField]) - x(0))
      .attr("height", y.bandwidth());

    // 数值标签
    svg.append("g")
    .attr("fill", "white")
    .attr("text-anchor", "end")
    .selectAll("text")
    .data(data)
    .join("text")
    // 先把锚点放到条形的起点
    .attr("x", d => x(+d[valueField]))
    // 垂直居中
    .attr("y", d => y(d[keyField]) + y.bandwidth() / 2)
    // 改成左对齐
    .attr("text-anchor", "start")
    // 往右再移动一点，避免紧贴得太死
    .attr("dx", "-60px")
    // 纵向基准依然居中
    .attr("alignment-baseline", "middle")
    .text(d => format(d[valueField]));

    // 轴
    svg.append("g")
    .attr("transform", `translate(0,${marginTop})`)
    .call(d3.axisTop(x).ticks(width / 80).tickSizeOuter(0));
    svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0));

    document.getElementById(containerId).innerHTML = "";
    document.getElementById(containerId).appendChild(svg.node());
    }

    //bar chart
    function renderBarByDimension(data, containerId, dim, year, measure, topN=6) {
        const yearData = data.filter(d => +d.Year === +year);
        const agg = Array.from(
            d3.rollup(
                yearData,
                vs => d3.sum(vs, d => +d[measure]),
                d => d[dim]
            ),
            ([key, total]) => ({ key, total })
    );
    const top = agg.sort((a,b) => b.total - a.total).slice(0, topN);
    const reformatted = top.map(d => ({
    [dim]: d.key,
    [measure]: d.total
    }));
    renderBarChart(reformatted, containerId, dim, measure);
    }

    // 读取所有控件（从筛选器中读信息）
    const commoditySel = document.getElementById('commoditySelector');
    const yearSel      = document.getElementById('yearSelector');
    const measureInputs= document.getElementsByName('measure1');      // radio
    const chartBtns    = document.querySelectorAll('#chartSwitch1 .switch-btn');

    // 将 active 类名切换给 span
    chartBtns.forEach(btn => {
    btn.addEventListener('click', () => {
    chartBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateGraphs();
  });
});

    // 年份或商品类型或统计类型变化都触发(监听器)
    commoditySel.addEventListener('change', updateGraphs);
    yearSel.addEventListener('change', updateGraphs);
    measureInputs.forEach(r => r.addEventListener('change', updateGraphs));

    // 真正的更新函数
    function updateGraphs() {
    // 1. 读筛选值
    const commodity = commoditySel.value;              // 'all' | 'raw bean' | ...
    const year      = yearSel.value;                   // '2022' | ...
    const measureKey= Array.from(measureInputs)
                         .find(r => r.checked).value; 
    // map to列名
    const measureCol = measureKey === 'value'
    ? 'Value (1000USD)'
    : 'Weight (1000kg)';
    console.log("measureCol长度：", measureCol.length)

    // 2. 根据商品类型再过滤一遍 fullData
    let filtered = fullData;
    if (commodity !== 'all') filtered = filtered.filter(d => d.commodity === commodity);

    // 3. 找出当前激活的按钮
  const activeBtn = document.querySelector('#chartSwitch1 .switch-btn.active');
  const view = activeBtn.dataset.view; // 'flows' | 'exporters' | 'importers'

  // 4. 面板映射表
  const panels = {
    flows:      document.getElementById('barChartTradeFlows'),
    exporters:  document.getElementById('barChartExporters'),
    importers:  document.getElementById('barChartImporters')
  };

  // 5. 隐藏所有面板，显示当前面板
  Object.values(panels).forEach(panel => panel.classList.add('hidden'));
  panels[view].classList.remove('hidden');

  // 6. 按维度渲染
  if (view === 'flows') {
    renderBarByDimension(filtered, 'barChartTradeFlows', 'Trade_route', year, measureCol);
  } else if (view === 'exporters') {
    renderBarByDimension(filtered, 'barChartExporters', 'Exporter', year, measureCol);
  } else {
    renderBarByDimension(filtered, 'barChartImporters', 'Importer', year, measureCol);
  }
}

// 页面初始化完毕之后，第一次渲染
updateGraphs();

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



