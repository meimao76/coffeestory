// Some definitions presupposed by pandoc's typst output.
#let blockquote(body) = [
  #set text( size: 0.92em )
  #block(inset: (left: 1.5em, top: 0.2em, bottom: 0.2em))[#body]
]

#let horizontalrule = [
  #line(start: (25%,0%), end: (75%,0%))
]

#let endnote(num, contents) = [
  #stack(dir: ltr, spacing: 3pt, super[#num], contents)
]

#show terms: it => {
  it.children
    .map(child => [
      #strong[#child.term]
      #block(inset: (left: 1.5em, top: -0.4em))[#child.description]
      ])
    .join()
}

// Some quarto-specific definitions.

#show raw.where(block: true): set block(
    fill: luma(230),
    width: 100%,
    inset: 8pt,
    radius: 2pt
  )

#let block_with_new_content(old_block, new_content) = {
  let d = (:)
  let fields = old_block.fields()
  fields.remove("body")
  if fields.at("below", default: none) != none {
    // TODO: this is a hack because below is a "synthesized element"
    // according to the experts in the typst discord...
    fields.below = fields.below.amount
  }
  return block.with(..fields)(new_content)
}

#let empty(v) = {
  if type(v) == "string" {
    // two dollar signs here because we're technically inside
    // a Pandoc template :grimace:
    v.matches(regex("^\\s*$")).at(0, default: none) != none
  } else if type(v) == "content" {
    if v.at("text", default: none) != none {
      return empty(v.text)
    }
    for child in v.at("children", default: ()) {
      if not empty(child) {
        return false
      }
    }
    return true
  }

}

// Subfloats
// This is a technique that we adapted from https://github.com/tingerrr/subpar/
#let quartosubfloatcounter = counter("quartosubfloatcounter")

#let quarto_super(
  kind: str,
  caption: none,
  label: none,
  supplement: str,
  position: none,
  subrefnumbering: "1a",
  subcapnumbering: "(a)",
  body,
) = {
  context {
    let figcounter = counter(figure.where(kind: kind))
    let n-super = figcounter.get().first() + 1
    set figure.caption(position: position)
    [#figure(
      kind: kind,
      supplement: supplement,
      caption: caption,
      {
        show figure.where(kind: kind): set figure(numbering: _ => numbering(subrefnumbering, n-super, quartosubfloatcounter.get().first() + 1))
        show figure.where(kind: kind): set figure.caption(position: position)

        show figure: it => {
          let num = numbering(subcapnumbering, n-super, quartosubfloatcounter.get().first() + 1)
          show figure.caption: it => {
            num.slice(2) // I don't understand why the numbering contains output that it really shouldn't, but this fixes it shrug?
            [ ]
            it.body
          }

          quartosubfloatcounter.step()
          it
          counter(figure.where(kind: it.kind)).update(n => n - 1)
        }

        quartosubfloatcounter.update(0)
        body
      }
    )#label]
  }
}

// callout rendering
// this is a figure show rule because callouts are crossreferenceable
#show figure: it => {
  if type(it.kind) != "string" {
    return it
  }
  let kind_match = it.kind.matches(regex("^quarto-callout-(.*)")).at(0, default: none)
  if kind_match == none {
    return it
  }
  let kind = kind_match.captures.at(0, default: "other")
  kind = upper(kind.first()) + kind.slice(1)
  // now we pull apart the callout and reassemble it with the crossref name and counter

  // when we cleanup pandoc's emitted code to avoid spaces this will have to change
  let old_callout = it.body.children.at(1).body.children.at(1)
  let old_title_block = old_callout.body.children.at(0)
  let old_title = old_title_block.body.body.children.at(2)

  // TODO use custom separator if available
  let new_title = if empty(old_title) {
    [#kind #it.counter.display()]
  } else {
    [#kind #it.counter.display(): #old_title]
  }

  let new_title_block = block_with_new_content(
    old_title_block, 
    block_with_new_content(
      old_title_block.body, 
      old_title_block.body.body.children.at(0) +
      old_title_block.body.body.children.at(1) +
      new_title))

  block_with_new_content(old_callout,
    block(below: 0pt, new_title_block) +
    old_callout.body.children.at(1))
}

// 2023-10-09: #fa-icon("fa-info") is not working, so we'll eval "#fa-info()" instead
#let callout(body: [], title: "Callout", background_color: rgb("#dddddd"), icon: none, icon_color: black) = {
  block(
    breakable: false, 
    fill: background_color, 
    stroke: (paint: icon_color, thickness: 0.5pt, cap: "round"), 
    width: 100%, 
    radius: 2pt,
    block(
      inset: 1pt,
      width: 100%, 
      below: 0pt, 
      block(
        fill: background_color, 
        width: 100%, 
        inset: 8pt)[#text(icon_color, weight: 900)[#icon] #title]) +
      if(body != []){
        block(
          inset: 1pt, 
          width: 100%, 
          block(fill: white, width: 100%, inset: 8pt, body))
      }
    )
}



#let article(
  title: none,
  subtitle: none,
  authors: none,
  date: none,
  abstract: none,
  abstract-title: none,
  cols: 1,
  margin: (x: 1.25in, y: 1.25in),
  paper: "us-letter",
  lang: "en",
  region: "US",
  font: "linux libertine",
  fontsize: 11pt,
  title-size: 1.5em,
  subtitle-size: 1.25em,
  heading-family: "linux libertine",
  heading-weight: "bold",
  heading-style: "normal",
  heading-color: black,
  heading-line-height: 0.65em,
  sectionnumbering: none,
  toc: false,
  toc_title: none,
  toc_depth: none,
  toc_indent: 1.5em,
  doc,
) = {
  set page(
    paper: paper,
    margin: margin,
    numbering: "1",
  )
  set par(justify: true)
  set text(lang: lang,
           region: region,
           font: font,
           size: fontsize)
  set heading(numbering: sectionnumbering)
  if title != none {
    align(center)[#block(inset: 2em)[
      #set par(leading: heading-line-height)
      #if (heading-family != none or heading-weight != "bold" or heading-style != "normal"
           or heading-color != black or heading-decoration == "underline"
           or heading-background-color != none) {
        set text(font: heading-family, weight: heading-weight, style: heading-style, fill: heading-color)
        text(size: title-size)[#title]
        if subtitle != none {
          parbreak()
          text(size: subtitle-size)[#subtitle]
        }
      } else {
        text(weight: "bold", size: title-size)[#title]
        if subtitle != none {
          parbreak()
          text(weight: "bold", size: subtitle-size)[#subtitle]
        }
      }
    ]]
  }

  if authors != none {
    let count = authors.len()
    let ncols = calc.min(count, 3)
    grid(
      columns: (1fr,) * ncols,
      row-gutter: 1.5em,
      ..authors.map(author =>
          align(center)[
            #author.name \
            #author.affiliation \
            #author.email
          ]
      )
    )
  }

  if date != none {
    align(center)[#block(inset: 1em)[
      #date
    ]]
  }

  if abstract != none {
    block(inset: 2em)[
    #text(weight: "semibold")[#abstract-title] #h(1em) #abstract
    ]
  }

  if toc {
    let title = if toc_title == none {
      auto
    } else {
      toc_title
    }
    block(above: 0em, below: 2em)[
    #outline(
      title: toc_title,
      depth: toc_depth,
      indent: toc_indent
    );
    ]
  }

  if cols == 1 {
    doc
  } else {
    columns(cols, doc)
  }
}

#set table(
  inset: 6pt,
  stroke: none
)

#show: doc => article(
  title: [Coffee Road: From Commodity to Cultur],
  toc_title: [Table of contents],
  toc_depth: 3,
  cols: 1,
  doc,
)

= Exploring Global Trade and Urban Networks Through Coffee
<exploring-global-trade-and-urban-networks-through-coffee>
= 1.Introduction – Coffee as a Global Urban Perspective
<introduction-coffee-as-a-global-urban-perspective>
texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext \
texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext

= 2. Global Trade – From Colonial Commodity to Cultural Mediator
<global-trade-from-colonial-commodity-to-cultural-mediator>
=== 2.1 Who grows, and who drinks?\*\*
<who-grows-and-who-drinks>
3D 飞线图展示产地与消费地流向（南产北消） 理论嵌入：全球价值链（Gereffi et al.~2005） 可视化工具：Globe.gl + D3 arc animation + data hover

#block[
```python
print("hello world")
```

]
== 2.2 Who makes the money?\*\*
<who-makes-the-money>
Sankey 图展示利润分布（农民 vs 品牌） 引入 Bourdieu 的“象征资本”与消费等级结构 品牌国与消费空间之间的结构性分离

== 2.3 Consumption is culture, too.\*\*
<consumption-is-culture-too.>
人均消费地图 + hover 展示国家饮用习惯 消费不只是数量，也是社会身份与文化结构的体现（Arnould & Thompson, 2005）

= 3. Urban Grounds – Coffee as City Practice
<urban-grounds-coffee-as-city-practice>
== 3.1 Tokyo – Precision and Pause（≈400–450 字）
<tokyo-precision-and-pause400450-字>
引入东京咖啡文化特征（功能化、仪式感） 说明 POI 数据分类（Chain / Independent / Community） 描述 Mapbox 图层联动结构（polygon + heatmap + toggle） 引用理论：Practice System（Warde）、Third Space（Oldenburg）

== Aoyama: Micro-network and Design Culture（嵌入3.1中，≈150–200 字）
<aoyama-micro-network-and-design-culture嵌入3.1中150200-字>
说明青山作为东京代表区域的理由 使用子页面分析 Featured cafés、主轴线（Axis）、Metro buffer 分析 体现文化+消费+空间的微观交织

== 3.2 Istanbul – Layered Café Histories（≈350–400 字）
<istanbul-layered-café-histories350400-字>
引入伊斯坦布尔的空间二元性（新旧城区、文化层叠） 描述 café 类型变化和街区功能分布的初步发现 若尚未完成地图，可以作为概念引导，结合图片+理论 可选引用：Bookman / Dolbec et al.~强调品牌与文化的共构过程

= 4. Design and Technical Challenges
<design-and-technical-challenges>
== 4.1 Narrative Structure and Page Architecture
<narrative-structure-and-page-architecture>
解释整体网页结构 \
页面采用纵向滚动结构（index.html），结合多个跳转子页面（如 `urban_tokyo.html`, `3d_earth.html` 等） 顶部导航栏支持快速锚点跳转，右侧拼贴图与左侧地图构成立体信息空间 \
段落滚动与状态切换（scroll-based staging）控制动画效果与视觉节奏： \
首页引入 `coffee-floating`（咖啡豆雨）与 `coffee-halo`（离子扩散） 地球视觉切换通过 `.scrolled-*` class 实现 scale 与 fade 效果

== 4.2 Tools and Visualisation Techniques
<tools-and-visualisation-techniques>
#strong[4.2.1 3D]

`Three.js` + `Globe.gl` 实现 3D 飞线地图，支持 arc 动画与点击信息展示 `D3.js` 用于柱状图、飞线数据排序与缩放尺度构建

#block[
```python
print("hello world")
```

]
#strong[4.2.2 urban]

`Mapbox GL JS` 用于东京/伊斯坦布尔城市 POI 可视化、KDE 热力图、polygon 图层 `Chart.js` 生成行政区内咖啡类型统计图，动态响应交互行为 多页面组件通过统一样式（CSS class）与功能脚本（JavaScript module）保持风格与逻辑一致

#block[
```python
print("hello world")
```

]
== 4.3 Layer Logic and Interaction Design
<layer-logic-and-interaction-design>
#strong[4.3.1 home page]

texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext \
texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext

#strong[4.3.2 world trade]

texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext \
texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext

#strong[4.3.3 urban culture]

图层联动逻辑： 使用 `filter` 实现 POI 分类（Chain / Independent / Community） Polygon 点击后调用 `within` 和 `queryRenderedFeatures` 限定显示范围，并联动统计图与 info-text KDE 热力图层与点图层通过 checkbox 控制可见性并联动切换 组件解耦： 所有交互函数模块化封装，使用状态变量（如 `currentPolygonFilter`）隔离逻辑冲突 hover、click、reset 等功能均通过 event listener 精准触发、管理

== 4.4 Technical Challenges and Solutions
<technical-challenges-and-solutions>
texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext \
texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext

#strong[4.4.1 home page]

texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext \
texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext

#strong[4.4.2 world trade]

texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext \
texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext

#strong[4.4.3 urban culture]

texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext \
texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext

= 5. Conclusion – A Global Network in a Cup
<conclusion-a-global-network-in-a-cup>
总结项目核心发现：咖啡是连接全球与地方的媒介 回应问题：咖啡如何体现现代城市节奏与文化结构 学术反思：叙事可视化的优势与限制；理论+设计的交叉可能性 可延伸方向：加入实时数据、用户参与、城市比较拓展等

#emph[\[Note: a table that describes the selected variables for analysis and modelling is required - see the example below.\]]

#table(
  columns: (33.64%, 11.82%, 48.18%, 6.36%),
  align: (auto,auto,auto,auto,),
  table.header([Variable], [Type], [Description], [Notes],),
  table.hline(),
  [Burglary crime rate], [Numeric], [The burglary rate of MSOAs. Used as dependent var.], […],
  [Temperature], [Numeric], [The daytime temperature], […],
  [Indicator of Inner or Outer London], [Categorical], [Whether the MSOA is in Inner London], […],
  […], […], […], […],
)
#table(
  columns: (33.64%, 11.82%, 48.18%, 6.36%),
  align: (auto,auto,auto,auto,),
  table.header([Variable], [Type], [Description], [Notes],),
  table.hline(),
  [Burglary crime rate], [Numeric], [The burglary rate of MSOAs. Used as dependent var.], [~],
  [Temperature], [Numeric], [The daytime temperature], [~],
  [Indicator of Inner or Outer London], [Categorical], [Whether the MSOA is in Inner London], [~],
)
= 6. Individual Contributions
<individual-contributions>
#link(<Table-of-contents>)[\[ go back to the top \]]

#block[
```python
print("hello world")
```

]
= 7. References
<references>
#emph[见你提供的参考书目格式]
