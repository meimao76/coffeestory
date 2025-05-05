d3.csv("data/raw_cleaned.csv").then(function(raw_flow) {

    console.log(raw_flow.slice(0, 5));



// 选择 id 为 chart-area 的 div，添加 svg

const width = 800;
const height = 600;

const svg = d3.select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// 设置投影
const projection = d3.geoMercator()
    .center([0, 20])      // 中心点（经纬度）
    .scale(130)           // 缩放大小
    .translate([width / 2, height / 2]);  // 平移到画布中心


svg.selectAll(".exporter")
    .data(raw_flow)
    .enter()
    .append("circle")
    .attr("class", "exporter")
    .attr("cx", d => {
        const coords = projection([+d.lng_export,+d.lat_export]);
        return coords[0];
    })
    .attr("cy", d => {
        const coords = projection([+d.lng_export,+d.lat_export]);
        return coords[1];
    })
    .attr("r", 3)
    .attr("fill", "red");

svg.selectAll(".importer")
    .data(raw_flow)
    .enter()
    .append("circle")
    .attr("class", "exporter")
    .attr("cx", d => {
        const coords = projection([+d.lng_import,+d.lat_import]);
        return coords[0];
    })
    .attr("cy", d => {
        const coords = projection([+d.lng_import,+d.lat_import]);
        return coords[1];
    })
    .attr("r", 0)
    .attr("fill", "blue");

});