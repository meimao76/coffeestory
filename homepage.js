const container = document.querySelector(".coffee-floating");

function createCoffeeBean() {
  const img = document.createElement("img");
  img.src = "image/coffebeans.png"; 
  img.className = "coffee-bean";

  const size = 20 + Math.random() * 40;
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

const canvas = document.getElementById("coffee-halo");
const ctx = canvas.getContext("2d");

canvas.width = 1200;
canvas.height = 1200;

const center = {x: 600, y: 1020};// 球心位置
const particles = [];

function createRing() {
  const count = 200; // 粒子数量
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    particles.push({
      angle,
      radius: 350 + Math.random() * 5, // 起始半径
      speed: 0.5 + Math.random() * 0.5,
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
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(235, 223, 192, ${p.alpha})`; // 白色
    ctx.fill();

    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);
}
animate();
//20250505新增离子扩散特效