#  CASA0003 Report Writing Guide (Focus on Section 4)

##  文件结构总览（章节顺序）
- **1. Introduction**：引出项目主题、研究问题与理论背景（习撰写）
- **2. Global Trade**：展示咖啡贸易流动、利润分布、人均消费（翁撰写）
- **3. Urban Grounds**：东京 + 青山 + 伊斯坦布尔的咖啡空间（习 & 诗雨）
- **4. Design, Interactivity, and Technical Challenges**  **本指南重点**
- **5. Conclusion**：总结发现与反思（习）
- **6. References & Contributions**：统一格式（最后汇总）

---

##  第四章结构说明（Section 4）

本章分为多个小节，对网站每个模块分别描述：

**4.1 Narrative Structure and Page Architecture**
→ 说明网站页面结构、滚动机制与模块划分

**4.2 Tools and Visualisation Techniques**
→ 4.2.1 3D可视化（Three.js, Globe.gl）→ 4.2.1 3D 可视化（Three.js、Globe.gl）
→ 4.2.2 Urban地图（Mapbox GL + Chart.js + 模块化结构）

**4.3 Layer Logic and Interaction Design**
→ 4.3.1 Homepage 动画联动逻辑
→ 4.3.2 World Trade 图层联动
→ 4.3.3 Urban Culture 图层联动 + 函数结构说明（无代码）

**4.4 Technical Challenges and Solutions 核心段落**
→ 每个模块前用表格列出问题 + 解决方案
→ 后续选取2–3个典型挑战，用函数 + 代码块解释

---

## PDF 渲染依赖安装说明（首次配置时请完成）

若你计划通过 `jupyter nbconvert` 将 `.ipynb` 转换为 PDF，请确保安装以下组件：

### 所需依赖清单

| 依赖工具 | 用途 | 检查命令 | 安装方式 |
|----------|------|-----------|-----------|
| **nbconvert** | 核心转换工具 | `jupyter nbconvert --version` | 已包含在 Jupyter 中，若缺失：`pip install nbconvert` |
| **pandoc** | Markdown → LaTeX 支持 | `pandoc --version` | 推荐命令：`brew install pandoc` / `conda install -c conda-forge pandoc` |
| **LaTeX 环境**（如 `xelatex`） | PDF 渲染引擎 | `xelatex --version` / `which xelatex` | **macOS**：`brew install --cask mactex` <br>**Windows**：下载 [MiKTeX](https://miktex.org/download) 并完整安装 |

---

### 检查是否已安装的快速命令（复制运行）

```bash
jupyter nbconvert --version
pandoc --version
xelatex --version
```

### 转换PDF的命令
``` bash
jupyter nbconvert --to pdf Template_submission_CASA0003.ipynb
```