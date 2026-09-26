# 毛绒纸样工作台 · Claude Code 执行手册

用法：把本文件和 `CLAUDE.md` 放在仓库根目录。每次开新会话时对 Claude Code 说：

> 读 CLAUDE_CODE_PLAYBOOK.md，执行 Step X.Y。先进入计划模式给我看计划。

每个 Step 的格式固定为：目标 / 输入 / 要做的事 / 约束 / 验收。上一个 Step 验收通过前不要开始下一个。技术选型已在 `docs/decisions.md` 定稿，Step 内不再重新讨论。

---

## 权限配置（阶段 0 开始前由你手动完成）

在仓库创建 `.claude/settings.json`：

```json
{
  "permissions": {
    "allow": [
      "Bash(git status)", "Bash(git diff:*)", "Bash(git log:*)", "Bash(git checkout -b:*)", "Bash(git add:*)", "Bash(git commit:*)",
      "Bash(npm install:*)", "Bash(npm run:*)", "Bash(npm test:*)", "Bash(npx vitest:*)", "Bash(npx tsc:*)", "Bash(npx vite:*)", "Bash(npx playwright:*)", "Bash(npx eslint:*)",
      "Bash(node scripts/*:*)",
      "Bash(pip install:*)", "Bash(python -m pytest:*)", "Bash(python scripts/*:*)"
    ],
    "deny": [
      "Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)", "Read(./research/**)",
      "Bash(git push:*)", "Bash(rm -rf:*)", "Bash(curl:*)",
      "Bash(git clone:*NvidiaWarp*)", "Bash(pip install:*warp*)"
    ]
  }
}
```

说明：
- `git push` 保留给你手动执行，确保每个 PR 都经过你看一眼
- `.env` 里放 API 密钥，`research/` 里放打版师的自有纸样和姓名对照表，禁止 Claude Code 读取
- 禁止克隆 NvidiaWarp 分支、禁止安装任何 warp 包，从工具层面配合 CLAUDE.md 的独立实现纪律
- Python 命令只在阶段 4 用到，提前放进允许列表不影响前面阶段

---

## 阶段 0：基础设施

### Step 0.1 仓库骨架

- 目标：建立 monorepo 结构，后续 Step 有地方放代码
- 输入：空仓库（当前只有一个甘特图 notebook，移到 `docs/planning/`）
- 要做的事：
  - pnpm workspace：`apps/web`（React + TS + Vite）、`packages/schema`、`packages/engine`（参数化几何）、`packages/geometry`（Clipper2 封装与曲线离散）、`packages/export`（PDF / SVG / DXF）、`packages/events`、`scripts/`
  - ESLint、Prettier、Vitest、Playwright 配置；CI 跑 lint + typecheck + test
  - `docs/progress.md` 与 `docs/open_questions.md` 已存在，不要覆盖
- 约束：不装任何几何或导出库，只搭骨架
- 验收：`pnpm install && pnpm -r test` 通过；CI 绿

### Step 0.2 许可扫描

- 目标：让违规依赖无法进入主干
- 要做的事：
  - Node 用 `license-checker-rseidelsohn`，写 `scripts/license_check`：允许 Apache-2.0、MIT、BSD-2/3、BSL-1.0、MPL-2.0、ISC、0BSD、CC0、Unlicense；遇到 GPL、AGPL、LGPL、NVSCL、CC-BY-NC、Unknown 时退出码非零
  - 生成 `THIRD_PARTY_NOTICES.md`
  - 把扫描加入 CI
- 验收：故意临时加一个 GPL 包，CI 失败；移除后通过

### Step 0.3 PlushPattern Schema v0

- 目标：定义全平台共用的纸样数据结构
- 要做的事：
  - `schema/plush_pattern.schema.json`（JSON Schema draft 2020-12）
  - 字段：pattern_id、schema_version、generated_by、units（固定 mm）、pieces[]、seams[]、preview、extensions、history_ref
  - piece：id、name、cut_count、mirror、grain_line、nap_direction、cut_outline（边列表）、sew_outline（边列表）、seam_allowance（按边）、notches[]（含 type：v / t / castle / u）、drill_holes[]、opening（返口边引用）、labels[]
  - edge：id、kind（line / cubic）、p0、p1、c0、c1（cubic 才有）
  - seam：id、side_a（piece_id + edge_ids[]）、side_b、notch_pairs[]
  - `packages/schema`：由 Schema 生成 TypeScript 类型（json-schema-to-typescript）
  - 校验器，除结构校验外实现几何校验：边首尾相接（容差 0.001 mm）、裁片闭合、缝合双方边长差、引用的 edge_id 存在、cut_outline 完全包含 sew_outline
  - `schema/examples/`：三份手写示例：六瓣球、两片式圆头、两片式简单熊（头身一体）
- 约束：单位毫米，存三位小数；所有 ID 为字符串；曲线不得预先离散；预留 `extensions`
- 验收：三份示例全部通过校验；故意破坏一条边，校验报出具体裁片与边 ID

### Step 0.4 几何层 spike

- 目标：验证 D-002 与 D-003 的路线，把不确定性在写业务代码前消掉
- 要做的事，在 `packages/geometry/`：
  - 贝塞尔边按 max sagitta（默认 0.1 mm）自适应离散
  - Clipper2（`clipper2-ts`）偏移封装：输入 sew_outline 与按边缝份，输出 cut_outline；接头默认 miter，内凹处自动处理；自相交清理
  - 弧长、等分点、法向、两曲线求交
  - 用两片式圆头 + 圆耳做参数化 demo：改头围时耳朵接缝长度自动适配
  - 基准测试：100 个裁片全部重新偏移的耗时
- 约束：只用 `bezier-js` 和 `clipper2-ts`；不引入其他几何库
- 验收：`packages/geometry/REPORT.md`：接缝适配是否成立、偏移在内凹与窄条上的表现、100 片偏移耗时（目标 < 50 ms）；若不达标，写明切换 `clipper2-wasm` 的结论

---

## 阶段 1：内测版

阶段 1 的全部 Step 构成第一次内测版本。内测目标与数据要求见 `docs/beta_plan.md`。

### Step 1.1 模板引擎

- 目标：参数进，PlushPattern 出，全部在浏览器内
- 要做的事，在 `packages/engine/`：
  - 部件定义格式：参数（名称、单位、范围、默认值、联动关系）、几何构造函数、接口边（与其他部件缝合的边）
  - 预设定义：部件组合 + 默认参数
  - `generate(preset, params, fabric)` 纯函数，输出通过 0.3 校验的 PlushPattern
  - 参数越界返回带参数名的可读错误
  - 首批部件：两片头、三片头（带中缝）、圆耳、尖耳、梨形身、筒形腿、手臂、尾巴
  - 预设：熊、兔、猫，存为 `templates/presets/*.yaml`
- 约束：每个部件文件头部有 `source` 元数据；参数范围按 `data/pattern_maker/params_*.csv` 填写，表格未到位时用占位范围并在 `docs/open_questions.md` 登记（已登记 Q-004）
- 验收：每个预设在参数全范围内随机采样 200 次，全部通过几何校验；单次生成 < 30 ms

### Step 1.2 Web 编辑器

- 目标：内测的核心界面，包含专业用户需要的手动编辑
- 要做的事，在 `apps/web/`：
  - 流程：预设选择 → 参数面板 → 面料选择（占位，见 Q-009）→ 2D 纸样视图
  - 纸样视图用 React 渲染 SVG：显示裁剪线、缝合线、缝份、布纹方向、毛向箭头、对位记号、裁片编号与裁剪数量；缩放平移用 viewBox
  - 手动编辑：选中裁片后可拖动点、拖控制柄、逐边改缝份、增删对位记号；编辑后该裁片标记为 manual，参数再变时提示会覆盖
  - 参数拖动时防抖 50 ms，显示最近一次成功结果
  - 项目存 Dexie：自动保存、项目列表、导入导出 PlushPattern JSON
  - PWA：离线可打开与编辑
- 约束：不引入画布库（D-004）；移动端可看不可编辑；手动编辑粒度见 Q-002，未决定前只做拖点与控制柄
- 验收：拖动任一参数，纸样视图在 300 ms 内更新；断网后刷新页面仍能打开上次项目并编辑；手动编辑后导出的 JSON 通过校验

### Step 1.3 纸样体检

- 规则：缝合边长度差 > 2 mm 报警；裁片未闭合；缺对位记号；无返口；裁片最小边 < 15 mm；缝份缺失；cut_outline 未包含 sew_outline
- 输出：每条问题带裁片 ID、边 ID、严重程度，编辑器中高亮并可点击定位
- 每次体检结果写入事件流（check_passed / check_failed）
- 验收：为每条规则写一个触发用例和一个不触发用例

### Step 1.4 导出

- 要做的事，在 `packages/export/`，全部跑在 Web Worker：
  - SVG：单文件，全部裁片，mm 单位，图层分组（cut / sew / marks / text）
  - PDF（jsPDF + svg2pdf.js）：纸张 A4 到 A0、Letter、Tabloid、自定义；分页拼贴可设页边距与重叠，自动选页数最少的方向；A2 及以上单张输出；首页为拼贴总图 + 校验方块（尺寸见 Q-005，未决定前用 100 mm × 50 mm）+ 打印说明（Actual size / 100%，禁用 Fit to page）；每页 X 形对齐标记与页码矩阵；裁片名称、裁剪数量、布纹与毛向
  - DXF（`@tarikjabiri/dxf`）：按 D-006 的 ASTM 结构，每片一个 BLOCK，数字图层，曲线按 max sagitta 0.1 mm 离散，转折点与曲线点分别写图层 2 / 3，$INSUNITS = 4；另提供普通 DXF 选项（单图层纯折线，切割机用）
  - 每次导出写 export 事件：格式、纸张、页数、耗时、文件大小
- 约束：不使用 `window.print()`；导出的 PDF 与 DXF 用固定示例做快照测试
- 验收：打印 PDF 后量校验方块误差 < 0.5 mm；DXF 在 CLO3D 试用版与至少一款免费 CAD（如 LibreCAD）里打开，曲线点数与裁片数正确；A0 单张 PDF 在绘图仪上尺寸正确（由你实测）

### Step 1.5 事件流与应用内反馈

- 目标：内测数据闭环，无后端
- 要做的事，在 `packages/events/` 与 `apps/web/`：
  - 事件：session_start、session_end、preset_selected、param_changed、fabric_changed、manual_edit、check_passed、check_failed、export、feedback_submitted、feature_missing
  - 每个事件带：event_id、ts、anonymous_user_id、tier、pattern_id、schema_version、payload；manual_edit 的 payload 必须含对象类型、对象 ID、before / after 差量
  - 写 `docs/event_spec.md`
  - 应用内反馈：裁片右键标记问题（类型 + 文字）；导出后三题评分；工具栏常驻的我想做但做不了按钮
  - 设置页一键导出事件包（JSON：全部事件 + 当前全部纸样），文件名含 user_id 与日期
  - 首次打开时输入内测邀请码，映射到预分配的 anonymous_user_id
- 约束：不记录任何个人身份信息；事件包导出前展示内容摘要供打版师确认
- 验收：一次完整操作后，可从事件流重放出最终纸样；事件包能被 Step 1.6 的脚本读取

### Step 1.6 内测报告脚本

- 目标：把多份事件包变成可决策的报告
- 要做的事：`scripts/beta_report`（Node）：读取 `research/event_packs/*.json`，输出 `docs/beta_report_YYYYMMDD.md`，内容按 `docs/beta_plan.md` 的数据回收一节
- 约束：脚本只读 `research/`，输出不含 user_id 以外的身份信息
- 验收：用两份合成事件包跑出报告，各节均有数据

### Step 1.7 部署与内测发布

- 要做的事：Cloudflare Workers Static Assets 部署；`_headers` 设置缓存；PWA manifest 与图标；内测入口页说明版本范围与反馈方式
- 约束：WASM 单线程；不加 COOP / COEP
- 验收：Lighthouse PWA 通过；在 Windows Chrome、macOS Safari、iPad Safari 上打开并完成一次导出

> 阶段 1 全部验收后进入内测。内测结束、`docs/beta_report_*.md` 产出后，由我决定阶段 2 各 Step 的顺序。

---

## 阶段 2：内测后（顺序待内测报告决定）

### Step 2.1 纸样还原模拟（独立实现）

- 目标：从平面纸样出发，按缝合关系缝回去、充棉，模拟出成品会长成什么样，与目标形体对比
- 依据：只读 Plushie 论文（Mori & Igarashi 2007）、Igarashi & Igarashi 2009 ARAP flattening 论文和公开的 PBD / XPBD、体积与压力约束资料；Seams to Sewing Pattern 只参考思路，不读代码
- 要做的事：
  - 裁片三角化 → 放到 3D 目标形体的大致位置 → 按缝合关系逐对拉合边界顶点 → XPBD 布料约束 + 封闭体积内部压力 → 简单自碰撞；跑在 Web Worker
  - 面料弹性参数影响拉伸刚度；缝合时对位记号优先对齐
  - three.js 显示：模拟结果与目标形体叠加对比，偏差按颜色显示，给出高、宽、厚差
  - 输出模拟后体积（mm³），供 Step 3.3；导出逐顶点裁片标签写入 preview
- 约束：遵守 CLAUDE.md 授权纪律；`packages/inflate/SOURCES.md` 列出实现依据
- 验收：直径 120 mm 的球用两片、六片、足球式三种切法，模拟结果能区分靠垫形、近似球形、球形（自动化测试比较与理想球的偏差排序）；坐姿小恐龙在普通笔记本 3 秒内收敛

### Step 2.2 直接绘制工具（若内测显示参数化不成立）

- 目标：让打版师像在 CAD 里一样从零画裁片
- 要做的事：点、线、贝塞尔、镜像、等分、量距、按边缝份；构造历史可回溯；允许暂时不一致状态（引用已删除点的边标红而非拒绝）
- 验收：打版师用它复刻一张自有纸样，用时由你实测

### Step 2.3 OBJ 导入

- 网格清理（去重复顶点、补小洞、检查流形）、尺寸归一化（用户输入目标高度 mm）
- 带 UV 的 OBJ：提供按 UV 分块生成裁片选项，每个 UV 岛为一块裁片，按 3D 边长还原真实尺寸，缝合关系从共享 3D 边推出
- 验收：5 个不同来源的 OBJ 能导入显示；一个带 UV 缝线的 OBJ 能生成裁片，缝合边长度差 < 1 mm

### Step 2.4 缝线标记

- 用户点选表面点，系统沿测地线连接；闭合后形成分区；可撤销、可拖动控制点
- 缝线清理：切割后合并短于阈值（默认 1.5 mm）的边，缝线两侧一圈顶点松弛
- 分区完整性检查：不是圆盘拓扑、或两分区只连一条细带时标红并指出缺口所在缝线
- 验收：在熊 OBJ 上标 8 个分区用时 < 10 分钟（由你实测）；故意漏标颈部缝线，检查能报出位置

### Step 2.5 展平 WASM spike 与切分展平

- 先做 spike：Emscripten 编译 OpenABF，暴露 ABF++ / LSCM / HLSCM，TypeScript 类型，单线程；`packages/unwrap/REPORT.md` 记录产物体积、1 万面片耗时
- 再做：沿缝线切开，逐区展平（ABF++ 优先，失败回退 LSCM）；失真热力图；面积失真超阈值提示加缝线或收省；相邻区共享边长度校正；结果写回 3D 顶点裁片标签
- 验收：六瓣球 OBJ 展平后的裁片与理论瓣形误差 < 3%；相邻片共享边长度差 < 1 mm

### Step 2.6 自动配缝与回流

- 切缝两侧天然配对；其余按长度差、3D 距离、切向方向打分，给前 3 候选
- 展平结果转为 PlushPattern，generated_by = obj_unfold，进入与阶段 1 相同的编辑、体检、导出
- 验收：打版师从 OBJ 到打样完整跑通一次

### Step 2.7 账号与云同步

- Supabase（Auth + Postgres + Storage）+ PowerSync 客户端；事件流改为自动上传；导出文件落 R2
- 验收：两台设备同一账号，离线编辑后重连自动合并

---

## 阶段 3：材料包对接

### Step 3.1 裁床导出

- 根据合作工厂提供的设备型号和样例文件，在 D-006 的 ASTM 导出基础上做设备适配，必要时输出 PLT
- 验收：工厂用导出文件试切一次成功

### Step 3.2 面料库与补偿

- `data/fabrics/fabrics.csv` 导入面料参数；生成纸样时按补偿系数缩放
- 验收：同一纸样换两种面料，导出尺寸按补偿系数变化

### Step 3.3 材料包 BOM

- 面料用量（含排料损耗系数）、辅料清单
- 填充棉克数 = Step 2.1 模拟体积 × 填充密度（偏软 / 适中 / 饱满三档），密度用标准球实称数据校准
- 验收：与工厂实际用量对比误差 < 15%

---

## 阶段 4：数据与 AI（Python 从这里开始）

### Step 4.1 合成数据生成器

- 用 Node 跑 `packages/engine` 批量生成 PlushPattern（每个参数约 200 样本，另加验证、测试和失败冗余；失败样本标记不删除）；Python 端读取 PlushPattern 与 Step 2.1 的模拟网格，产出充棉网格（OBJ）、逐顶点裁片标签、渲染图
- 按拓扑划分测试集：某些部件组合只出现在测试集
- 验收：生成报告列出每类样本数、有效样本数、失败率

### Step 4.2 分区模型基线

- 输入网格 / 点云，输出每点裁片类别与缝线概率；先用成熟的点云分割架构做基线
- 训练数据：合成数据 + 阶段 2 以来的打版师修正记录（高权重）
- 验收：在拓扑测试集上报告指标；与打版师标注对比

### Step 4.3 灰度上线缝线建议

- 进阶层可选开启；记录采纳、修改、拒绝
- 验收：采纳率与平均修改量达到预设阈值后扩大范围
