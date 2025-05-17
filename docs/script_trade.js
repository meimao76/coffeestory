
//全局变量s
const width = 800;//画布大小
const height = 600;

//主数据加载
Promise.all([
    d3.json("data/world-administrative-boundaries.geojson"),
    d3.csv("data/raw_cleaned.csv")
]).then(function([boundaryData, raw_flow]) {

//建立svg
const svg = d3.select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

//这里调图层顺序，append("g")相当于建立图层组,图层数据先加载到图层组，再加载到svg，这样方便管理还能调图层顺序
const boundaryLayer = svg.append("g").attr("class", "map-layer");
//const flowsLayer = svg.append("g").attr("class", "flows-layer");
//const pointsLayer = svg.append("g").attr("class", "points-layer");

// 设置投影
const projection = d3.geoOrthographic()
.scale(250)
.translate([width / 2, height / 2])
.clipAngle(90);  // 保证显示正面

// 定义地理路径生成器（把地理坐标转换为屏幕上的坐标）
const path = d3.geoPath().projection(projection);

svg.call(d3.drag().on("drag", (event) => {
    const rotate = projection.rotate();
    const k = 1 / projection.scale();
    projection.rotate([
        rotate[0] + event.dx * k * 150,
        rotate[1] - event.dy * k * 150
    ]);
    refresh();  // 重新渲染地图路径
}));

//国界线数据
boundaryLayer
    .selectAll("path")
    .data(boundaryData.features)//path接受数组的输入，geojson整个传入要加上.feature作为数组
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 1);


//始发点
// pointsLayer.selectAll(".exporter")
//     .data(raw_flow)
//     .enter()
//     .append("circle")
//     .attr("class", "exporter")
//     .attr("cx", d => {
//         const coords = projection([+d.lng_export,+d.lat_export]);
//         return coords[0];
//     })
//     .attr("cy", d => {
//         const coords = projection([+d.lng_export,+d.lat_export]);
//         return coords[1];
//     })
//     .attr("r", 3)
//     .attr("fill", "red");
//终到点
// pointsLayer.selectAll(".importer")
//     .data(raw_flow)
//     .enter()
//     .append("circle")
//     .attr("class", "importer")
//     .attr("cx", d => {
//         const coords = projection([+d.lng_import,+d.lat_import]);
//         return coords[0];
//     })
//     .attr("cy", d => {
//         const coords = projection([+d.lng_import,+d.lat_import]);
//         return coords[1];
//     })
//     .attr("r", 0)
//     .attr("fill", "blue");

//连线
// flowsLayer.selectAll(".flows")
//     .data(raw_flow)
//     .enter()
//     .append("line")
//     .attr("class", "flows")
//     .attr("x1", d => {/
//         const coords = projection([+d.lng_export,+d.lat_export]);
//         return coords[0];
//     })
//     .attr("y1", d => {
//         const coords = projection([+d.lng_export,+d.lat_export]);
//         return coords[1];
//     })
//     .attr("x2", d => {
//         const coords = projection([+d.lng_import,+d.lat_import]);
//         return coords[0];
//     })
//     .attr("y2", d => {
//         const coords = projection([+d.lng_import,+d.lat_import]);
//         return coords[1];
//     })
//     .attr("fill", "none")
//     .attr("stroke", "#ccc")
//     .attr("stroke-width", 0.5);
});
