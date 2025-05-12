const globe = Globe()

  // 1. 地球表面贴图（暗面）
  .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg')
  .backgroundColor('rgba(0, 0, 0, 0)')
  // 2. 地球高光／凹凸贴图（模拟山脉、海洋波纹）
  .showAtmosphere(true)

  // 多边形样式
  .polygonsTransitionDuration(0) 
  .polygonCapColor(feat => 'rgb(7, 166, 223)') // 国界内部
  .polygonSideColor(() => 'rgba(0, 0, 0, 0)') // 侧边
  .polygonStrokeColor(() => '#54361a') // 国界线颜色


//首次渲染
globe(document.getElementById('globeViz'));

// 加载数据：国界线 + 贸易流
fetch('ne_110m.geojson').then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return res.json();
    }) .then(geojson => {
      // 给 Globe 传入多边形 Feature 数组
      globe.polygonsData(geojson.features);

      setTimeout(() => globe
        .polygonsTransitionDuration(4000)
        .polygonAltitude(500)
      , 3000);
    })
    .catch(err => console.error('加载边界时出错：', err));

// 假设你已经有了 globe = Globe(...)
// 等到数据加载、第一次渲染之后再运行这段
setTimeout(() => {
  let sphereMesh = null;

  globe.scene().traverse(obj => {
    // 找到那个球体 Mesh：它有 geometry.parameters.radius
    if (
      obj.type === 'Mesh' &&
      obj.geometry &&
      obj.geometry.parameters &&
      typeof obj.geometry.parameters.radius === 'number'
    ) {
      sphereMesh = obj;
    }
  });

  if (sphereMesh) {
    const { radius, widthSegments, heightSegments } = sphereMesh.geometry.parameters;
    console.log('🌍 当前地球球体半径:', radius);
    console.log('🌍 widthSegments:', widthSegments, 'heightSegments:', heightSegments);
  } else {
    console.warn('找不到 SphereGeometry');
  }
}, 1000);
