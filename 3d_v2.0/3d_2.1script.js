const THREE = window.THREE;
// 全局状态
let fullData = [], borders = [], topData = [], coffeeByCountry;
let borderGroup, flowsGroup;

// 章节控制函数
function showBordersFlows() {
  borderGroup.visible = true;
  flowsGroup.visible  = true;
  selectorBox.style.display = 'block';
  infoBox.style.display     = 'none';
}
function showBordersOnly() {
  borderGroup.visible = true;
  flowsGroup.visible  = false;
  selectorBox.style.display = 'none';
  infoBox.style.display     = 'none';
}
function showFlowsOnly() {
  borderGroup.visible = false;
  flowsGroup.visible  = true;
  selectorBox.style.display = 'none';
  infoBox.style.display     = 'none';
}

//章节监听
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


// 1. 初始化 Globe，并一次性配置好所有样式 + label 显示咖啡品牌
const POLY_DEFAULT   = '#54361a';
const POLY_HIGHLIGHT = '#ffeb3b';

const globe = Globe(document.getElementById('globeViz'))
  .globeImageUrl('bg3.png')
  .backgroundColor('rgba(0,0,0,0)')
  .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
  .showAtmosphere(true)

  // 飞线样式
  .arcDashLength(0.7)
  .arcDashGap(0.3)
  .arcDashAnimateTime(4000)
  .arcsTransitionDuration(0)
  .arcColor(d => d.commodity === 'raw bean'
    ? ['#fff', 'rgba(255,248,231,0.5)','rgb(255,209,161)']
    : d.commodity === 'roasted bean'
      ? ['#ffe8dc','rgba(252,212,200,0.5)','rgb(247,187,165)']
      : ['#ccc','#ccc']
  )

  // 多边形（国界）基础样式
  .polygonsTransitionDuration(0)
  .polygonCapColor(() => 'rgba(0,0,0,0)')
  .polygonSideColor(() => 'rgba(0,0,0,0)')
  .polygonStrokeColor(() => POLY_DEFAULT)
  .polygonAltitude(0.01)

  // 悬停高亮
  .onPolygonHover(feat => {
    borderGroup.children.forEach(mesh =>
      mesh.material.color.set(
        mesh.userData.feature === feat ? POLY_HIGHLIGHT : POLY_DEFAULT
      )
    );
  })

  // 点击标签显示品牌（可选，.polygonLabel 也可实现）
  .onPolygonClick(({ properties }) => {
    const iso = properties.ISO_A3;
    const brands = coffeeByCountry.get(iso) || [];
    showCoffeeList(brands, properties.NAME);
  })

  // 飞线点击
  .onArcClick(d => {
    infoBox.style.display = 'block';
    document.getElementById('infoRoute').textContent     = `${d.Exporter} → ${d.Importer}`;
    document.getElementById('infoWeight').textContent    = `${d['Weight (1000kg)']} metric ton`;
    document.getElementById('infoValue').textContent     = `${d['Value (1000USD)']}k USD`;
    document.getElementById('infoCommodity').textContent = d.commodity;
  });

// 2. 拿到所有数据后，一次性渲染并分组
Promise.all([
  d3.json('selected_bond.geojson'),
  d3.csv('combined_tradeflow.csv'),
  d3.csv('List_of_coffeehouse_chains_3.csv')
]).then(([geo, csv, brands]) => {
  // 2.1 清洗 fullData
  fullData = csv.filter(d =>
    +d['Weight (1000kg)'] && +d.lat_export && +d.lng_export && +d.lat_import && +d.lng_import
  );

  // 2.2 取前 0.6% topData
  const N = fullData.length;
  topData = fullData
    .sort((a,b) => +b['Weight (1000kg)'] - +a['Weight (1000kg)'])
    .slice(0, Math.max(1, Math.floor(N * 0.006)));

  // 2.3 建立 ISO → 品牌映射
  coffeeByCountry = d3.group(brands, d => d.ISO3);

  // 2.4 一次性渲染：国界 + 飞线
  borders = geo.features;
  globe.polygonsData(borders).arcsData(topData);

  // 2.5 延后一 tick 分组
  setTimeout(() => {
    borderGroup = new THREE.Group();
    flowsGroup  = new THREE.Group();
    globe.scene().traverse(obj => {
      if (obj.userData.feature)    borderGroup.add(obj);
      else if (obj.userData.__arc) flowsGroup.add(obj);
    });
    globe.scene().add(borderGroup, flowsGroup);
    // 初始都可见
    borderGroup.visible = true;
    flowsGroup.visible  = true;
  }, 0);

  // 2.6 初始化柱状图、Sankey、年份切换等（同你原来逻辑）…
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


//Sankey
const width =500;
const height = 160;

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