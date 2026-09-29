# 风格审计 · 纸样工作台 v3

## 1. 色板（来源 `prototype-v3/src/index.css`、`src/three/Viewer.tsx`、`src/components/PatternView.tsx`）

| 语义 | 值 | 来源 |
| --- | --- | --- |
| 背景（纸面） | hsl(38 33% 96%) ≈ #F8F5F0 | `--background` |
| 表面 / 卡片 | hsl(40 40% 99%) ≈ #FDFCFA | `--card` |
| 正文 | hsl(40 6% 11%) ≈ #1E1D1A | `--foreground` |
| 弱文本 | hsl(32 7% 40%) ≈ #6B665D | `--muted-foreground` |
| 描边 | hsl(34 18% 84%) | `--border` |
| 强调（铁锈红） | hsl(19 90% 38%) ≈ #B83C0A；深 #8F2E07 | `--primary`；PatternView 选中文字 |
| 3D 舞台 | #2B2A33 | Viewer `scene.background`、Workspace |
| 缝线 / 高亮 | #F3A27A | Viewer 缝线虚线与高亮色 |
| 切割垫网格 | #DCE6DD | PatternView `pattern#mat` |

## 2. 字体
- 产品：正文 Noto Sans SC 400/500/700；标题 Noto Serif SC 700/900（`.font-display`）。组件内部保持原样。
- 宣传标题（按 skill 规则中英分开指定）：英文 Instrument Serif Italic（Google Fonts，OFL），中文 Noto Sans SC 900（OFL）。中文标题不用宋体。

## 3. 空间与形状
圆角 18–20px 卡片、胶囊按钮、2px 描边；阴影柔和、偏暖。密度适中，手机宽度 390px。上镜倍数 2.1–2.3（正文 13px → 27–30px，满足 ≥ 22px）。

## 4. 品牌
没有正式 app icon，只有首页左上角的圆顶纸样线稿标志（`Home.tsx` 内联 SVG：外轮廓 + 虚线缝份 + 中缝）。片尾使用这一原图形；正式 icon 待品牌素材补齐。

## 5. 镜头适配
- 可直接复用：TemplateDetail（跟着缝）、Workspace（3D + 纸样联动、透明度、坐标轴）、Flow 各阶段（平面纸样、对缝 QA、缝好登记、平台打样、发起材料包）、Me / Apply、CreatorPage、KitDetail、PatternView、Viewer、CaseArt。
- 需要处理：工作区高度用 `46vh / 26vh`，在 1920 高的影片视口会失真，已在 film.css 固定为手机等效值；three.js 渲染循环接到影片时钟（`fake-api.js` 的 rAF 队列）。
- 没有暗色主题。暗色只出现在 3D 舞台本身。

## 6. 母题候选
- 纸样裁片轮廓：净样线 + 缝份虚线 + 刻口（PatternView 三层路径）。
- 缝线虚线：铁锈红 / #F3A27A 的虚线，贯穿 3D 模型与纸样。
- 切割垫网格。
- 3D 部位与裁片同时高亮（产品最核心的交互）。
- 用户历程本身：看案例 → 开版 → 缝好登记 → 申请创作者 → 平台打样 → 材料包 → 被别人买到。

## 7. 决策
hybrid：产品界面、色板、字体原样；外层舞台（背景、标题、转场、路径）为本片原创，从上面的母题推导，不引入 CodePilot 默认样式。
