let fullData = []; 
let rawData = [];   
let roastData = []; 
 // 保存全部数据

// 初始化地球
const globe = Globe()
  // 1. 地球表面贴图（暗面）
  .globeImageUrl('globesurface2.png')
  .backgroundImageUrl('bg2.png')
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
            return [`rgb(255, 255, 255)`, `rgba(255, 248, 231, 0.5)`, `rgb(255, 209, 161)`];
        } else if (d.commodity === 'roasted bean') {
            return [`rgb(255, 232, 220)`, `rgba(252, 212, 200, 0.5)`,`rgb(247, 187, 165)`];
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
// //章节监听器
// const sidebar = document.getElementById('sidebarContent');
// const section2 = document.getElementById('scrollContent2');
// sidebar.addEventListener('scroll', () => {
//   const inSection2 = (() => {
//     const sb = sidebar.getBoundingClientRect();
//     const s2 = section2.getBoundingClientRect();
//     return s2.top < sb.bottom && s2.bottom > sb.top;
//   })();
  
//   console.log('滚动检测，第二章显示：', inSection2);
//   // flightLines 在下面 Promise.then 中由 globe.arcsData() 创建，这里直接遍历 scene
//   globe.scene().traverse(obj => {
//     if (obj.userData && obj.userData.arc) {
//       obj.material.transparent = true;
//       obj.material.opacity     = inSection2 ? 0 : 1;
//     }
//   });
// });

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
    const countryMeshes = [];
    // 三维场景中，所有多边形都是 Mesh，挂载了它的 feature 在 userData
    globe.scene().traverse(obj => {
    if (obj.type === 'Mesh' && obj.userData && obj.userData.properties) {
        countryMeshes.push(obj);
    }
    });

    // —— 定义高亮函数 ——  
    function highlightCountry(isoA3) {
    countryMeshes.forEach(mesh => {
        const iso = mesh.userData.properties.ISO_A3 || mesh.userData.properties.iso_a3;
        if (iso === isoA3) {
        mesh.material.emissive.setHex(0xffcc00);
        mesh.scale.set(1.05, 1.05, 1.05);
        } else {
        mesh.material.emissive.setHex(0x000000);
        mesh.scale.set(1, 1, 1);
        }
    });
    }
    // 调用示例：
    highlightCountry('FRA');
    
    // const raycaster = new window.THREE.Raycaster();
    // const mouse     = new window.THREE.Vector2();
    // const canvas    = globe.renderer().domElement;

    // // 鼠标移动时射线检测
    // canvas.addEventListener('mousemove', event => {
    // const rect = canvas.getBoundingClientRect();
    // mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    // mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;

    // raycaster.setFromCamera(mouse, globe.camera());
    // const hits = raycaster.intersectObjects(countryMeshes);
    // if (hits.length) {
    //     const props = hits[0].object.userData.properties;
    //     showCountryInfo(props);
    // } else {
    //     hideCountryInfo();
    // }
    // });

    // // —— 占位：在页面上显示 / 隐藏信息框 ——  
    // function showCountryInfo(props) {
    // // 这里留个接口：props 里可能有 ISO_A3, NAME, GDP……随你定义
    // console.log('Hover country:', props);
    // // 你可以在页面上插入 tooltip 或更新侧边栏某个 DOM 节点
    // }
    // function hideCountryInfo() {
    // // 隐藏 tooltip / 清空 info 区
    // }

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
        const marginLeft  = 80;
        const width       = 480;
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
    .attr("fill", "#b29e8e")
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

}
    
);
// —— 在 Promise.then(...) 的最后，飞线和多边形都已设置好后 ——  
function toggleArcsOpacity() {
  // 计算是否滚到第二章
  const sb = sidebarContent.getBoundingClientRect();
  const s2 = section2.getBoundingClientRect();
  const inSection2 = s2.top < sb.bottom && s2.bottom > sb.top;
  
  let count = 0;
  globe.scene().traverse(obj => {
    // 只处理带 arc 标记的飞线
    if (obj.userData && obj.userData.arc) {
      obj.material.transparent  = true;
      obj.material.opacity      = inSection2 ? 0 : 1;
      obj.material.needsUpdate  = true;
      count++;
    }
  });
  // 调试：看看改了多少条线
  console.log(`toggleArcsOpacity: matched ${count} arcs, inSection2=${inSection2}`);
  
  // 手动触发渲染
  globe.renderer().render(globe.scene(), globe.camera());
}

// 注册滚动监听
sidebarContent.addEventListener('scroll', toggleArcsOpacity);

// 页面初始也执行一次，保证加载后状态正确
toggleArcsOpacity();

 
// 1. 先改造 updateGlobeArcs，接收两个参数
function updateGlobeArcs(commodityType, year) {
  // 从 fullData 里先把基本的经纬度、重量非 NA 的记录过滤掉
  let filteredData = fullData
    .filter(d => !isNaN(+d['Weight (1000kg)']))
    .filter(d => !isNaN(+d.lat_export))
    .filter(d => !isNaN(+d.lng_export))
    .filter(d => !isNaN(+d.lat_import))
    .filter(d => !isNaN(+d.lng_import));

  // 根据 commodity 过滤
  if (commodityType !== 'all') {
    filteredData = filteredData.filter(d => d.commodity === commodityType);
  }

  // 根据年份再过滤
  if (year && year !== 'all') {
    filteredData = filteredData.filter(d => +d.Year === +year);
  }

  // 再取前 0.6%
  const intercept = 0.006;
  const topData = filteredData
    .sort((a, b) => +b['Weight (1000kg)'] - +a['Weight (1000kg)'])
    .slice(0, Math.max(1, Math.floor(filteredData.length * intercept)));

  // 其余不变
  const weightExtent = d3.extent(topData, d => +d['Weight (1000kg)']);
  const strokeScale  = d3.scaleSqrt().domain(weightExtent).range([0.1, 3]);

  globe
    .arcsData(topData)
    .arcStartLat(d => +d.lat_export)
    .arcStartLng(d => +d.lng_export)
    .arcEndLat(d => +d.lat_import)
    .arcEndLng(d => +d.lng_import)
    .arcStroke(d => strokeScale(+d['Weight (1000kg)']));
}

// 2. 把两个下拉都选出来
const commoditySel = document.getElementById('commoditySelector');
const yearSel      = document.getElementById('yearSelector');

// 3. 写一个统一的回调，去读两个值再更新
function onFilterChange() {
  const commodity = commoditySel.value;
  const year      = yearSel.value;
  updateGlobeArcs(commodity, year);
}

// 4. 挂监听
commoditySel.addEventListener('change', onFilterChange);
yearSel     .addEventListener('change', onFilterChange);

// 5. 页面加载完成时先渲染一次
onFilterChange();


//Sankey
const width =500;
const height = 200;

// 选中 SVG 并设定画布大小
const svg = d3.select("#sankey")
    .attr("width", width)
    .attr("height", height);

// 从 d3-sankey 插件拿到布局函数
const { sankey, sankeyLinkHorizontal } = d3;

// 读取 CSV 数据
d3.csv("coffee_value_distribution_unweighted.csv", d3.autoType).then(raw => {
  // data 是一个数组，形如 [{source: "...", target: "...", value: 1.23}, ...]
   const data = raw.map(d => ({
    source: d["Country"],                      // 用 Country 作为源
    target: d["Type of cost"],            // 用 Value chain stage 作为中间节点
    value: d["Value"],                       // 用 Value (€) 作为流量大小
    middle: d["Value chain stage"]
  }));
  // 1) 构造节点列表（唯一去重）
  const nodeNames = Array.from(
    new Set(data.flatMap(d => [d.source, d.target, d.middle]))
  );

  const nodes = nodeNames.map(name => ({ name }));
  const nodeIndex = new Map(nodes.map((d,i) => [d.name, i]));

  // 2) 构造 links 数组，注意 source/target 用索引
  const links = data.map(d => ({
    source: nodeIndex.get(d.source),
    target: nodeIndex.get(d.middle),
    value: d.value
  }));

    const links2 = data.map(d => ({
    source: nodeIndex.get(d.middle),
    target: nodeIndex.get(d.target),
    value: d.value
  }));

  const allLinks = [...links, ...links2];

  // 3) 计算 sankey 布局
  const sankeyGen = sankey()
    .nodeWidth(20)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 6]]);

  const graph = sankeyGen({
    nodes: nodes.map(d => Object.assign({}, d)),
    links: allLinks
  });

svg.append("g")
  .selectAll("path")
  .data(graph.links)
  .join("path")
    .attr("class", "link")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke-width", d => Math.max(1, d.width));

svg.append("g")
  .selectAll("rect")
  .data(graph.nodes)
  .join("rect")
    .attr("x",      d => d.x0)
    .attr("y",      d => d.y0)
    .attr("width",  d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0);

  // 6) 加上节点标签
  svg.append("g")
    .selectAll("text")
    .data(graph.nodes)
    .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(d => d.name);
});


