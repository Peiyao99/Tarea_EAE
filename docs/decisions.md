# 技术决策记录

每条记录：决定、理由、排除项、来源。改动任何一条要新增一条记录说明变更，不直接覆盖。

## D-001 纯前端 local-first，内测阶段无后端

决定：编辑器、模板引擎、体检、导出全部在浏览器内运行；项目和事件存本地。

理由：打版几何很轻，毫米一位小数即满足纸样精度，场景对象数远低于机械 CAD（[Patro 设计笔记](https://fabricesalvaire.github.io/Patro/design-notes/question-answer.html)）。FreeSewing 已在生产环境验证参数化 → SVG → 拼页 PDF 全在浏览器 Web Worker 内完成（[pdf-maker.mjs](https://github.com/freesewing/freesewing/blob/develop/packages/react/components/Editor/lib/export/pdf-maker.mjs)）。无后端意味着内测不需要账号系统、不需要运维、打版师离线也能用。

排除：FastAPI 引擎 + 每次拖参数发请求。原因是离线不成立、移动端不成立、Python 与 TS 双引擎维护成本。

后续：云同步走 Supabase + PowerSync（客户端 SDK Apache-2.0），导出文件分发走 Cloudflare R2（零 egress）。

## D-002 模板引擎用 TypeScript，不用 PyGarment

决定：参数化几何层自写 TS，数据模型借鉴 FreeSewing 的 Point / Path / Part 抽象。

理由：PyGarment 是 GarmentCode 的一部分，面向服装面板，Interface 机制对毛绒的封闭曲面裁片没有验证过；引入它意味着引擎在 Python，与 D-001 冲突。FreeSewing core 是无依赖纯 JS、MIT，贝塞尔路径、偏移、SVG 渲染的模型可直接参照（[Path.offset](https://freesewing.dev/reference/api/path/offset/)，[browser 用法](https://freesewing.dev/howtos/environments/browser/)）。

注意：FreeSewing 的偏移是分段实现，不处理自相交和真正的接头，缝份生成不用它，见 D-003。

## D-003 缝份与布尔用 Clipper2

决定：贝塞尔轮廓按 max sagitta 0.1 mm 离散 → Clipper2 偏移 → 得到裁剪线；缝合线与裁剪线分别保留。首选 `clipper2-ts`（纯 TS，免 WASM 加载），性能不足时切 `clipper2-wasm`。

理由：Clipper2 内部整数网格，作者明确说明浮点坐标总会偶发偏移错误（[Robustness](https://angusj.com/clipper2/Docs/Robustness.htm)）。缩放因子固定 0.001 mm。协议 BSL-1.0。

## D-004 2D 画布用 React 直接渲染 SVG

决定：不引入画布库。

理由：纸样是矢量，SVG 导出零转换；缩放平移用 viewBox；LLM 生成 SVG/JSX 代码最可靠。Konva 无 SVG 导出（[Konva 选型指南](https://konvajs.org/docs/guides/best-canvas-library.html)），Paper.js 月下载 0.8M 且维护停滞。性能基准（8000 个运动对象下 Konva 23 fps、Fabric 9 fps）与几十到几百个静态裁片的场景无关（[canvas-engines-comparison](https://github.com/slaylines/canvas-engines-comparison)）。

## D-005 PDF 用 jsPDF + svg2pdf.js，拼页逻辑复刻 FreeSewing tiler

决定：jsPDF 4.x + svg2pdf.js 2.x，矢量输出，mm 单位，跑在 Web Worker。拼页方式：同一张完整 SVG 按每页负偏移重画，空白页跳过，X 形对齐标记，A1/B2 页码矩阵，首页放拼贴总图与校验方块（[plugin-tiler](https://github.com/freesewing/freesewing/blob/develop/packages/react/components/Editor/lib/export/plugin-tiler.mjs)）。

排除：pdf-lib（2021-11 后无发版，278 个 open issue）；`window.print()`（浏览器打印默认 Fit to page，是行业公认的比例错误来源，[FreeSewing FAQ](https://github.com/freesewing/freesewing/blob/develop/markdown/org/docs/about/faq/printing-issues/en.md)）。

## D-006 DXF 用 @tarikjabiri/dxf，目标格式 DXF-ASTM

决定：一开始就按 ASTM D6673 的结构输出：每片一个 BLOCK，数字图层（1 裁剪边界、14 缝合线、2 转折点、3 曲线点、7 布纹、6 对称、4/80-83 剪口、13 钻孔、15 文字），$INSUNITS = 4。

理由：npm 的 `dxf-writer` 源码没有 INSERT 实体，做不了 BLOCK 结构；`@tarikjabiri/dxf` 2.9 支持 addBlock / addInsert / setUnits，MIT，2026-09 仍在发版（[dxfjs/writer](https://github.com/dxfjs/writer)）。CLO3D 依赖图层 2 / 3 的点来分组曲线，Seamly2D 因曲线按直线段存储、导出无曲线数据，在 CLO3D 里曲线点过多（[Seamly 论坛](https://forum.seamly.io/t/export-problems-seamly2d-clo3d/11740)），且其 AAMA → ASTM 迁移从 2015 年悬到现在（[issue #59](https://github.com/FashionFreedom/Seamly2D/issues/59)）。规范说明见 [Patro DXF-ASTM](https://github.com/FabriceSalvaire/Patro/blob/master/doc/sphinx/source/resources/file-format/dxf-astm.rst)。

切割机、激光机走普通 DXF 或 SVG，要点是 mm 单位和纯折线。

## D-007 3D 内核用 three.js + Manifold，排除 OpenCascade

决定：three.js + @react-three/fiber + drei 做场景；`manifold-3d`（Apache-2.0，官方 WASM 约 2.8 MB）做布尔、凸包、Minkowski。

理由：three.js 每 1 到 2 个月发版，R3F 与 drei 活跃。Manifold 已成为 OpenSCAD 默认后端（[openscad#5833](https://github.com/openscad/openscad/pull/5833)）。OpenCascade 输出物继承 LGPL-2.1，与授权纪律冲突；opencascade.js 2023-03 后无发版。three.js 自身无任何 UV 展开能力。

## D-008 展平用自编 WASM 的 OpenABF，ABF++ 优先

决定：Emscripten 编译 [OpenABF](https://github.com/educelab/OpenABF)（Apache-2.0，单头文件，仅依赖 Eigen），暴露 ABF++、LSCM、Hierarchical LSCM。单线程编译。

理由：npm 上没有任何 ARAP / ABF++ 包，必须自编。Blender 的默认 Unwrap 是 Angle Based（ABF++），失败回退 LSCM（[uvedit_unwrap_ops.cc](https://raw.githubusercontent.com/blender/blender/main/source/blender/editors/uvedit/uvedit_unwrap_ops.cc)），打版师的参照系是这个。所有展平库都要求输入是带边界的流形圆盘，切割与拓扑校验自研。

备选：libigl（MPL-2.0，lscm / arap），算法更全但需裁剪编译；Boundary First Flattening（MIT）质量最高但依赖 SuiteSparse，WASM 编译有先例但成本高。

## D-009 模拟不是内测的前置条件

决定：充棉还原模拟推迟到内测第一轮之后。

理由：Plushie 论文证明只展平不够，需要仿真回推，这个判断成立；但它是全项目唯一没有任何现成库的部分，工期最不可控。内测第一轮的验证由体检规则（缝合边长度差、闭合、记号、最小边）和打版师人工判断承担。

## D-010 本地存储用 Dexie，事件先本地后回收

决定：项目与事件流存 Dexie 4（IndexedDB，Apache-2.0），大文件存 OPFS。内测阶段事件通过打版师一键导出事件包回收，不建服务端。

理由：OPFS 三大浏览器已支持；Dexie 2026-09 仍在发版；无后端即可完成内测数据闭环。

## D-011 部署 Cloudflare Workers Static Assets

决定：静态托管，`_headers` 文件管缓存；WASM 单线程。

理由：静态请求免费不限量，单文件 25 MiB 上限对 WASM 够用。多线程 WASM 需要 COOP/COEP 头，COEP 会拦截未声明 CORP 的第三方资源和 OAuth 弹窗，内测阶段不值得承担。
