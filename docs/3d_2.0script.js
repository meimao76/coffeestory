let fullData = []; 
let borders = []
let rawData = [];   
let roastData = []; 
let topData = []; 
let coffeeByCountry = new Map();
let info = [];
 // 保存全部数据
let selectedCountryIso = null;
let tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// 声明为全局变量，以便在多个函数中访问
// 1.定义设置交互对话框可见性的函数
const infoBox     = document.getElementById('infoBox');
const selectorBox = document.getElementById('commoditySelectorWrapper');

function showBordersFlows() {
  globe
    .arcsData(topData);     
  selectorBox.style.display = 'block'; 
}

function showBordersOnly() {
  globe
    .polygonsData(borders)   // 显示国界
    .arcsData([]);           // 隐藏所有飞线

  infoBox.style.display     = 'none';  // 隐藏
  selectorBox.style.display = 'none'; // 
}

function showFlowsOnly() {
  globe
    .polygonsData([])        // 隐藏国界
    .arcsData(topData);     // 显示所有飞线

  infoBox.style.display     = 'none';  // 隐藏
  selectorBox.style.display = 'none'; // 
}

// 2. 章节映射
const sectionActions = {
  scrollContent1: showBordersFlows,
  scrollContent2: showBordersOnly,
  scrollContent3: showFlowsOnly
};

// 3. Observer
const sidebar = document.getElementById('sidebarContent');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting && sectionActions[entry.target.id]) {
      sectionActions[entry.target.id]();
    }
  });
}, { root: sidebar, threshold: 0.5 });

['scrollContent1','scrollContent2','scrollContent3']
  .forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });


//3 初始化地球
const globe = Globe()

  // 1. 地球表面贴图（暗面）
  .globeImageUrl('globesurface3.png')
  .backgroundColor('rgba(0,0,0,0)')
  // 2. 地球高光／凹凸贴图（模拟山脉、海洋波纹）
  .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
  .showAtmosphere(true)

  // 飞线样式
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
  // 飞线点击
  .onArcClick(d => {
    infoBox.style.display = 'block';
    document.getElementById('infoRoute').textContent     = `${d.Exporter} → ${d.Importer}`;
    document.getElementById('infoWeight').textContent    = `${d['Weight (1000kg)']} metric ton`;
    document.getElementById('infoValue').textContent     = `${d['Value (1000USD)']}k USD`;
    document.getElementById('infoCommodity').textContent = d.commodity;
  })
  .arcsTransitionDuration(200)
  // 多边形样式
  .polygonsTransitionDuration(0) 
  .polygonCapColor(d => 
  d.properties.ISO_A3?.toUpperCase?.() === selectedCountryIso 
    ? 'rgba(255,255,255,0.5)' 
    : 'rgba(7, 166, 223, 0.2)'
)
  .polygonSideColor(() => 'rgba(0, 0, 0, 0)') // 侧边
  .polygonStrokeColor(() => '#54361a') // 国界线颜色
  .polygonAltitude(0.01)
  .polygonLabel(({  id,properties }) => {
    const iso = id?.toUpperCase?.();
    const brands = coffeeByCountry.get(iso) || [];
    const listItems = brands.length
      ? brands.map(d => `<li>${d.Name} (${d['Number of locations']})</li>`).join('')
      : '<li>No brands found</li>';
    return `
      <div style="pointer-events:none; max-width:200px;">
        <b style="font-size:1.1em;">${properties.name}</b><br/>
        <small>${brands.length} brand${brands.length>1?'s':''}</small>
        <ul style="margin:4px 0 0 8px; padding:0; list-style:disc;">
          ${listItems}
        </ul>
      </div>
    `;
  });

  

//飞线监听器
document.addEventListener('click', (e) => {
    const infoBox = document.getElementById('infoBox');
    // 如果点的不是飞线（这里简单判断）
    if (!e.target.closest('canvas')) {
        infoBox.style.display = 'none';
    }
})


//渲染
globe(document.getElementById('globeViz'));

// 加载数据：国界线 + 贸易流
Promise.all([
    d3.json("world2.geojson"),
    d3.csv("combined_tradeflow.csv"),
    d3.csv("List_of_coffeehouse_chains_3.csv"),
]).then(function([boundaryData, merged_flow, brands]) {

    console.log("加载的数据：", merged_flow.slice(0, 5));

    // 保存所有数据
    fullData = merged_flow
        .filter(d => !isNaN(+d['Weight (1000kg)']))
        .filter(d => !isNaN(+d.Year))
        .filter(d => !isNaN(+d.lat_export))
        .filter(d => !isNaN(+d.lng_export))
        .filter(d => !isNaN(+d.lat_import))
        .filter(d => !isNaN(+d.lng_import));
    borders = boundaryData.features
    boundaryData.features.forEach(f => { 
      f.id = f.properties.id; 
    });
    console.table( boundaryData.features.map(f => f.id) )
    globe
    .arcsData(topData);

    // 建立 ISO3 -> 品牌列表 的映射
    coffeeByCountry = d3.group(brands, d => d.ISO3?.toUpperCase?.());
  
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
        const marginLeft  = 50;
        const width       = 450;
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
    const bars = svg.append("g")
  .selectAll("rect")
  .data(data)
  .join("rect")
    .attr("x", x(0))
    .attr("y", d => y(d[keyField]))
    .attr("width", 0)  // 初始为 0，动画展开
    .attr("height", y.bandwidth())
    .attr("fill", "#b29e8e")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .attr("fill", "#a67b5b")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

      tooltip
        .style("opacity", 1)
        .html(`<strong>${d[keyField]}</strong><br>${valueField}: ${d[valueField]}`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseleave", function () {
      d3.select(this)
        .attr("fill", "#b29e8e")
        .attr("stroke", "none");

      tooltip.style("opacity", 0);
    });

// ✅ 添加动画：从 0 width 抬升展开
bars.transition().duration(800)
  .attr("width", d => x(+d[valueField]) - x(0));



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


//飞线制图
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
  topData = filteredData
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

// Sankey
function Sankey() {
  const width = 450, height = 200;
  const svg = d3.select("#sankey")
    .attr("width", width)
    .attr("height", height);

  const { sankey, sankeyLinkHorizontal } = d3;

  d3.csv("coffee_value_distribution_unweighted.csv", d3.autoType)
    .then(raw => {
      // —— 1. 构造 nodes & links & 布局 —— 
      const data = raw.map(d => ({
        source: d.Country,
        middle: d["Value chain stage"],
        target: d["Type of cost"],
        value: d.Value
      }));
      const nodeNames = Array.from(
        new Set(data.flatMap(d => [d.source, d.middle, d.target]))
      );
      const nodes = nodeNames.map(name => ({ name }));
      const nodeIndex = new Map(nodes.map((d,i) => [d.name,i]));

      const links1 = data.map(d => ({
        source: nodeIndex.get(d.source),
        target: nodeIndex.get(d.middle),
        value: d.value,
        raw: d
      }));

      const links2 = data.map(d => ({
        source: nodeIndex.get(d.middle),
        target: nodeIndex.get(d.target),
        value: d.value,
        raw: d
      }));

      const allLinks = [...links1, ...links2];

      const graph = sankey()
        .nodeWidth(20)
        .nodePadding(10)
        .extent([[1,1],[width-1, height-6]])({
          nodes: nodes.map(d=> ({...d})),
          links: allLinks
        });

      // —— 2. 定义配色 —— 
      const nodeColorMap = {
        "Brazil": "#b29e8e",
        "Colombia": "#b29e8e",
        "VAT": "#f7e8bd",
        "Taxes": "#fff8e7",
        "Retail": "#f7e8bd",
        "Net profit margin": "#fff8e7",
        "Costs": "#fff8e7",
        "German Coffee Tax": "#f7e8bd",
        "Roasting & Finished product manufacturing": "#f7e8bd",
        "European logistic and trading": "#f7e8bd",
        "Collection & Exportation": "#f7e8bd",
        "Agricultural production": "#f7e8bd",
        "Net coffee farm income": "#fff8e7"
      };

      const color = name => nodeColorMap[name] || "#ccc";

      // —— 3. 绘制 link —— 
      const link = svg.append("g")
        .attr("class","links")
        .selectAll("path")
        .data(graph.links)
        .join("path")
          .attr("class","link")
          .attr("d", sankeyLinkHorizontal())
          .attr("stroke", d => color(d.source.name))
          .attr("stroke-width", d => Math.max(1, d.width))
          .attr("opacity", 0.5)
          .attr("fill","none");

      // —— 4. 绘制 node —— 
      const node = svg.append("g")
        .attr("class","nodes")
        .selectAll("rect")
        .data(graph.nodes)
        .join("rect")
          .attr("x", d=>d.x0)
          .attr("y", d=>d.y0)
          .attr("width",  d=>d.x1-d.x0)
          .attr("height", d=>d.y1-d.y0)
          .attr("fill", d => color(d.name))   
          .append("title")
            .text(d=>d.name);

      // —— 5. 绘制标签 —— 
      svg.append("g")
        .selectAll("text")
        .data(graph.nodes)
        .join("text")
          .attr("x", d=> d.x0 < width/2 ? d.x1+6 : d.x0-6)
          .attr("y", d=> (d.y0+d.y1)/2)
          .attr("dy","0.35em")
          .attr("text-anchor", d=> d.x0<width/2 ? "start":"end")
          .text(d=>d.name)
          .style("font-size","11px")
          .style("fill","#fff");

      // —— 6. 选中 tooltip —— 
      const tooltip = d3.select("#tooltip");

      // —— 7. 给 link 加交互 —— 
      link
        .on("mouseover", (event,d) => {
          link.attr("opacity", 0.1);
          d3.select(event.currentTarget)
            .attr("opacity", 1)
            .raise();
          tooltip
            .html(`<b>${d.source.name} → ${d.target.name}</b><br/>${d.value}`)
            .style("left", event.pageX + 10 + "px")
            .style("top",  event.pageY +  5 + "px")
            .style("opacity",1);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top",  event.pageY +  5 + "px");
        })
        .on("mouseout", () => {
          link.attr("opacity", 0.5);
          tooltip.style("opacity", 0);
        });

      // —— 8. 给 node 加交互（高亮所有相关 flow） —— 
      node
        .on("mouseover", (event,nodeData) => {
          link.attr("opacity", 0.1);
          link.filter(d =>
            d.source.name === nodeData.name ||
            d.target.name === nodeData.name
          )
          .attr("opacity",1)
          .raise();
          tooltip
            .html(`<b>${nodeData.name}</b>`)
            .style("left", event.pageX + 10 + "px")
            .style("top",  event.pageY +  5 + "px")
            .style("opacity",1);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top",  event.pageY +  5 + "px");
        })
        .on("mouseout", () => {
          link.attr("opacity", 0.5);
          tooltip.style("opacity", 0);
        });

    }); // end then
}
Sankey();


//Part 3 barchart
// —— 1. 基本配置 —— 
function mouseover(event, d) {
  console.log("🎯 mouseover 触发", d);
  tooltip.style("opacity", 1);
}

function mousemove(event, d) {
  const countryData = d3.select(this.parentNode).datum();
  console.log("🖱️ 鼠标悬停数据:", { d, countryData });
  tooltip
    .html(`<strong>${countryData.Country}</strong><br>${d.key}: ${d.value}`)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px");
}

function mouseleave(event, d) {
  tooltip.style("opacity", 0);
}

const margin = { top: 10, right: 60, bottom: 60, left: 60 };
const svgTotalWidth = 500;
const width  = svgTotalWidth - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

// 把整个绘图流程封装
function renderChart(data, metrics) {
  // 先清空旧图
  d3.select('#barChart').selectAll('*').remove();
  
  // 重新创建 svg + g
  const svg = d3.select('#barChart')
    .append('svg')
      .attr('width',  svgTotalWidth)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  // scales
  const x0 = d3.scaleBand().range([0, width]).paddingInner(0.1).paddingOuter(0.1);
  const x1 = d3.scaleBand().padding(0.05);
  const y0 = d3.scaleLinear().range([height, 0]);
  const y1 = d3.scaleLinear().range([height, 0]);
  const color = d3.scaleOrdinal(["#b29e8e",  "#d8c3a5",  "#eae7dc",  "#a67b5b",  "#6b4c3b",  "#ffddc1"]);

  // axes placeholders
  const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height})`);
  const yAxisLeft  = svg.append('g');
  const yAxisRight = svg.append('g')
      .attr('transform', `translate(${width},0)`);

  // 取前 10 排序 & slice
  const sorted = data
    .slice()      // 不破坏原 data
    .sort((a,b) => b[metrics[0]] - a[metrics[0]])
    .slice(0, 10);

  // domains
  x0.domain(sorted.map(d => d.Country));
  x1.domain(metrics).range([0, x0.bandwidth()]);
  y0.domain([0, d3.max(sorted, d => d[metrics[0]])]).nice();
  if (metrics[1]) y1.domain([0, d3.max(sorted, d => d[metrics[1]])]).nice();

  // draw axes
  xAxis.call(d3.axisBottom(x0))
       .selectAll("text")
         .attr("transform","rotate(-20)")
         .style("text-anchor","end");
  yAxisLeft.call(d3.axisLeft(y0));
  if (metrics[1]) yAxisRight.call(d3.axisRight(y1));

  // draw bars
  const country = svg.selectAll('.country')
    .data(sorted)
    .enter().append('g')
      .attr('transform', d => `translate(${x0(d.Country)},0)`);

  const bars = country.selectAll('rect')
  .data(d => metrics.map(m => ({ key: m, value: d[m] })))
  .enter().append('rect')
    .attr('x', d => x1(d.key))
    .attr('width', x1.bandwidth())
    .attr('y', height)
    .attr('height', 0)
    .attr('fill', d => color(d.key));

// 添加交互效果
bars
  .on("mouseover", function(event, d) {
    d3.select(this)
      .attr("fill", "#a67b5b") // 深一点
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    tooltip
      .style("opacity", 1)
      .html(`<strong>${d.key}</strong><br>${d.value}`);
  })
  .on("mousemove", function(event) {
    tooltip
      .style("left", `${event.pageX + 12}px`)
      .style("top", `${event.pageY - 10}px`);
  })
  .on("mouseleave", function() {
    d3.select(this)
      .attr("fill", d => color(d.key))  // 恢复原色
      .attr("stroke", "none");

    tooltip.style("opacity", 0);
  });

// 再加动画
bars
  .transition().duration(500)
  .attr('y', d => d.key === metrics[0] ? y0(d.value) : y1(d.value))
  .attr('height', d => d.key === metrics[0]
      ? height - y0(d.value)
      : height - y1(d.value));
}

// 初次加载数据
d3.csv('coffee_consumption_cleaned.csv', d3.autoType).then(data => {
     // create a tooltip
  tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);
  // 读取 checkbox 选项的函数
  function getMetrics() {
    const ms = d3.selectAll('input[name="sortOption"]:checked')
      .nodes().map(n=>n.value);
    return ms.length? ms
           : [ d3.select('input[name="sortOption"]').node().value ];
  }

  // 绑定 change 事件
  d3.selectAll('input[name="sortOption"]')
  .on('change', () => {
    renderChart(data, getMetrics())
    ;
  });

  // 初始渲染
  renderChart(data, getMetrics());
});

