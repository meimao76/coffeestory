// script.js
// --------------
// 假设 links.csv 已经放在同级目录，格式：source,target,value

const Swidth = 300;
const Sheight = 200;

// 选中 SVG 并设定画布大小
const svg = d3.select("#sankey")
    .attr("width", Swidth)
    .attr("height", Sheight);

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
    .extent([[1, 1], [Swidth - 1, Sheight - 6]]);

  const graph = sankeyGen({
    nodes: nodes.map(d => Object.assign({}, d)),
    links: allLinks
  });

  // 4) 画 links（流）
  svg.append("g")
    .selectAll("path")
    .data(graph.links)
    .join("path")
      .attr("class", "link")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke-width", d => Math.max(1, d.Swidth));

  // 5) 画 nodes（节点矩形）
  svg.append("g")
    .selectAll("rect")
    .data(graph.nodes)
    .join("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);

  // 6) 加上节点标签
  svg.append("g")
    .selectAll("text")
    .data(graph.nodes)
    .join("text")
      .attr("x", d => d.x0 < Swidth / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < Swidth / 2 ? "start" : "end")
      .text(d => d.name);
});
