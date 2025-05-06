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
  const scrollY = window.scrollY;

  if (scrollY > 80) {
    earth.classList.add('scrolled');
  } else {
    earth.classList.remove('scrolled');
  }
}

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