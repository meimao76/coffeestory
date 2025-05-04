const container = document.querySelector(".coffee-floating");

function createCoffeeBean() {
  const img = document.createElement("img");
  img.src = "coffebeans.png"; // 可换成你自己的图
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
  const count = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < count; i++) {
    createCoffeeBean();
  }
}, 1000);
