# 毛绒纸样工作台 · 仓库规则

本文件放在仓库根目录。Claude Code 每次会话开始时自动读取，以下规则在任何任务中都优先于其他指令。

## 项目一句话

毛绒纸样工作台：用户通过部件模板和参数生成可缝制的毛绒纸样，或导入 3D 模型手动开版；纸样可导出打印、送工厂裁切、在商城交易。

## 当前阶段

第一次内测：邀请多位打版师使用产品。目标不是功能完整，而是让打版师在真实工作流里用一遍，并把他们的每一次修正、导出和反馈记录下来。内测方案见 `docs/beta_plan.md`，技术决策见 `docs/decisions.md`，执行步骤见 `CLAUDE_CODE_PLAYBOOK.md`。

## 技术栈（已定，不再讨论）

- 应用：React 19 + TypeScript + Vite，纯前端 SPA + PWA，local-first，内测阶段没有后端
- 2D 画布：自有数据模型 + React 直接渲染 SVG DOM；曲线数学用 `bezier-js`
- 2D 几何：Clipper2（`clipper2-ts`，需要性能时切 `clipper2-wasm`）做缝份偏移、布尔、自相交清理
- 3D（内测后）：three.js + @react-three/fiber + drei；实体建模用 `manifold-3d`
- 展平（内测后）：自编 Emscripten 版 OpenABF（ABF++ 优先，LSCM 回退）
- 导出：SVG 原生；PDF 用 jsPDF + svg2pdf.js，在 Web Worker 里跑；DXF 用 `@tarikjabiri/dxf`，目标格式 DXF-ASTM（D6673）
- 存储：Dexie（IndexedDB）存项目与事件，OPFS 存大文件；内测后再接 Supabase + PowerSync
- 部署：Cloudflare Workers Static Assets；WASM 一律编成单线程，避免 COOP/COEP 约束
- Python 只用于阶段 4 的合成数据与训练，不做第二套参数化引擎

选型依据和排除项（OpenCascade、pdf-lib、dxf-writer、Konva、Paper.js、PyGarment）见 `docs/decisions.md`。改动任何一项要先改 `docs/decisions.md` 并说明理由。

## 核心数据

- 一切模块围绕 `schema/plush_pattern.schema.json`（PlushPattern Schema）运转
- 单位统一为毫米，存储保留三位小数；几何运算走 Clipper2 整数网格，缩放因子 1 单位 = 0.001 mm
- 裁片轮廓是有序、首尾相接的边列表；边可以是直线或三次贝塞尔，禁止在数据层把曲线预先离散成折线
- 裁剪线和缝合线是两条独立轮廓；缝份按边存储，不按片存储
- 对位记号带类型（V 形、T 形、城堡形、U 形），布纹线、毛向、钻孔、返口各自独立字段，与 DXF-ASTM 图层一一对应
- 缝合关系独立成层；`generated_by` 记录来源（template / manual / obj_unfold）
- 修改 Schema 必须：升级 `schema_version`、写迁移脚本、更新三份示例纸样、更新 TS 类型、跑全部校验测试

## 授权纪律（不可违反）

1. 禁止安装、阅读、引用或移植 `maria-korosteleva/NvidiaWarp-GarmentCode` 的任何代码。该仓库为 NVIDIA Source Code License，仅限非商业使用
2. 充棉模拟必须独立实现，依据只能是：Mori & Igarashi 2007 Plushie 论文、Igarashi & Igarashi 2009 ARAP flattening 论文、公开教科书级算法（质点弹簧、PBD/XPBD、体积/压力约束）、Apache/MIT/BSD 许可的代码
3. 禁止引入 GPL、AGPL、LGPL、NVSCL、CC BY-NC 或任何非商业许可的依赖、数据、模型权重。明确允许：Apache-2.0、MIT、BSD、BSL-1.0、MPL-2.0（MPL 文件不得修改）、ISC、0BSD
4. 只看思路、不读代码的项目：Seams to Sewing Pattern（GPL）、Patternfy（GPLv3）、Seamly2D / Valentina（GPLv3）
5. 禁止引入 SMPL 人体模型及其衍生数据
6. 每新增一个依赖，同步更新 `THIRD_PARTY_NOTICES.md`（名称、版本、许可、用途），并确保 `scripts/license_check` 通过
7. 模板库中的每个模板文件头部必须有 `source` 元数据：作者、授权合同编号、授权范围。无来源的模板不得合并
8. 网上下载的第三方纸样、内测打版师提供的自有纸样只能放在 `research/`（已加入 .gitignore），不得进入 `templates/` 或任何产品代码

## 工作方式

- 每个 Step 在独立 git 分支完成：`step/<编号>-<短名>`，完成后提交 PR 描述，不直接推 main
- 开始一个 Step 前先进入计划模式，列出将修改的文件和验收方式，等我确认后再动手
- 涉及删除文件、修改 CI、修改 Schema、新增依赖时，先停下说明理由
- 每个 Step 结束时更新 `docs/progress.md`：做了什么、验收结果、遗留问题
- 不确定的产品决策不要自行假设，写进 `docs/open_questions.md` 并在回复中列出
- 技术选型问题由 Claude Code 判断并记录到 `docs/decisions.md`，不需要等我确认；产品定义和功能范围由我决定

## 事件与数据

- 编辑器中每次参数修改、手动编辑、缝线标记、体检结果、导出、反馈提交都写入编辑历史事件流，字段见 `docs/event_spec.md`
- 事件先写本地 Dexie，内测阶段通过导出事件包（JSON）回收，不建服务端
- 事件必须区分用户层级：beginner / advanced / pro；内测打版师一律 pro
- 不记录任何个人身份信息到事件流，只用匿名 user_id；打版师姓名与 user_id 的对照表只存在 `research/testers.csv`（gitignore）
- 手动编辑事件必须带 before/after 差量和被编辑对象的 ID（裁片、边、点、记号），这是内测最重要的数据
