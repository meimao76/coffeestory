const container = document.querySelector(".coffee-floating");

function createCoffeeBean() {
  const img = document.createElement("img");
  img.src = "image/coffebeans.png"; 
  img.className = "coffee-bean";

  const size = 20 + Math.random() * 30;
  img.style.width = `${size}px`;
  img.style.left = `${Math.random() * 100}%`;
  img.style.animationDuration = `${6 + Math.random() * 6}s`;
  img.style.top = `${Math.random() * 100 + 60}px`;
  img.style.opacity = Math.random() * 0.6 + 0.3;

  container.appendChild(img);

  setTimeout(() => {
    img.remove();
  }, 12000);
}

setInterval(() => {
  const count = Math.floor(Math.random() * 4) + 1;
  for (let i = 0; i < count; i++) {
    createCoffeeBean();
  }
}, 1000);
//20250504新增咖啡雨特效

const earthContainer = document.querySelector(".earth-container");
const canvas = document.getElementById("coffee-halo");
const ctx = canvas.getContext("2d");

canvas.width = earthContainer.offsetWidth;
canvas.height = earthContainer.offsetHeight;

const center = {
  x: canvas.width / 2,
  y: canvas.height
}; //球心位置

const particles = [];

function createRing() {
  const count = 200; // 粒子数量
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    particles.push({
      angle,
      radius: 300 + Math.random() * 5, // 起始半径
      speed: 0.1 + Math.random() * 0.3,
      alpha: 1,
      size: 0.5 + Math.random() * 1,
    });
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 每隔一段时间创建新光圈
  if (Math.random() < 0.02) {
    createRing();
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.radius += p.speed;
    p.alpha -= 0.005;

    const x = center.x + p.radius * Math.cos(p.angle);
    const y = center.y + p.radius * Math.sin(p.angle);

    ctx.beginPath();
    ctx.shadowColor = "rgba(255, 255, 200, 0.7)";  // 浅黄色发光
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(235, 223, 192, ${Math.max(0, Math.min(1, p.alpha))})`;
    ctx.fill();
    ctx.shadowBlur = p.glow;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);
}
animate();
//20250505新增离子扩散特效

const earth = document.querySelector('.earth-container');

function handleScrollStages() {
  const homepage = document.getElementById("homepage");
  const section1 = document.getElementById("section1");
  const section2 = document.getElementById("section2");

  const homepageTop = homepage.getBoundingClientRect().top;
  const section1Top = section1.getBoundingClientRect().top;
  const section2Top = section2.getBoundingClientRect().top;

  earth.classList.remove("scrolled-1", "scrolled-2");

  if (Math.abs(section2Top) < window.innerHeight / 2) {
    // 当前处于 section2
    earth.classList.add("scrolled-2");
  } else if (Math.abs(section1Top) < window.innerHeight / 2) {
    // 当前处于 section1
    earth.classList.add("scrolled-1");
  }// 否则处于 homepage，保持原位
  const section3 = document.getElementById("section3");
  const section4Top = section4.getBoundingClientRect().top;

  if (Math.abs(section4Top) < window.innerHeight / 2) {
    earth.classList.add("earth-3d-active");
    document.getElementById("earth-3d").style.display = "block";
    if (!earth3DRenderer) init3DEarth();
  } else {
    earth.classList.remove("earth-3d-active");
    document.getElementById("earth-3d").style.display = "none";
  }

}
//20250506修改滑动逻辑

function updateCanvasSize() {
  canvas.width = earthContainer.offsetWidth;
  canvas.height = earthContainer.offsetHeight;
  center.x = canvas.width / 2;
  center.y = canvas.height / 2;
}

window.addEventListener("resize", updateCanvasSize);
updateCanvasSize(); // 初始调用一次

window.addEventListener('scroll', handleScrollStages);
window.addEventListener('load', handleScrollStages);
//20250505新增地区滚动的逻辑

const boxes1 = document.querySelectorAll('.image-box-1');
const desc1 = document.getElementById('culture-description-1');

boxes1.forEach(box => {
    box.addEventListener('mouseenter', () => {
      desc1.textContent = box.dataset.text;
    });

    box.addEventListener('mouseleave', () => {
      desc1.textContent = "鼠标移到下方图片上，会显示对应文化文字。";
    });
});
//20250505新增sec1

const scrollContainer = document.getElementById('scroll-content');
const boxes2 = document.querySelectorAll('.image-box-2');
const desc2 = document.getElementById('culture-description-2');

boxes2.forEach(box => {
  box.addEventListener('mouseenter', () => {
    scrollContainer.style.animationPlayState = 'paused';
    desc2.textContent = box.dataset.text;
  });

  box.addEventListener('mouseleave', () => {
    scrollContainer.style.animationPlayState = 'running';
    desc2.textContent = "鼠标移到下方图片上，会显示对应文化文字。";
  });
});
//20250505新增sec2

let earth3DRenderer, earth3DScene, earth3DCamera, earth3DModel;

function init3DEarth() {
  const container = document.getElementById('earth-3d');
  earth3DRenderer = new THREE.WebGLRenderer({ alpha: true });
  earth3DRenderer.setSize(300, 300);
  container.appendChild(earth3DRenderer.domElement);

  earth3DScene = new THREE.Scene();
  earth3DCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  earth3DCamera.position.z = 3;

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(2, 2, 2).normalize();
  earth3DScene.add(light);

  const loader = new THREE.GLTFLoader();
  loader.load('model/earth_globe.glb', function (gltf) {
    earth3DModel = gltf.scene;
    earth3DModel.scale.set(1, 1, 1);
    earth3DScene.add(earth3DModel);
    animate3DEarth();
  });
}

function animate3DEarth() {
  requestAnimationFrame(animate3DEarth);
  if (earth3DModel) {
    earth3DModel.rotation.y += 0.005;
  }
  earth3DRenderer.render(earth3DScene, earth3DCamera);
}
// 20250506新增3d地球