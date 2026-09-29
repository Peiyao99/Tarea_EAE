# 卖点证据（原型演示，均为 prototype-v3 @ a8d0db4）

| feature | benefit（白话） | status | source | component | demoState | limits |
| --- | --- | --- | --- | --- | --- | --- |
| 教程模板 + 跟着缝 | 点一步，3D 和纸样一起标出这一步要缝哪几片 | 原型 | `prototype-v3/src/screens/Library.tsx`（TemplateDetail） | TemplateDetail、Workspace | 坐姿恐龙，选第 2 步 | 模板为示例数据 |
| 3D ↔ 纸样联动 | 点 3D 部位或纸样，另一边同时高亮；可调透明度、看坐标轴 | 原型 | `src/components/Workspace.tsx`、`src/three/Viewer.tsx`、`src/components/PatternView.tsx` | 同左 | 腿 L1/L2 高亮 | 3D 为示意几何体 |
| 多种起点 | 一句话、草图、参考图、三视图、3D 模型都能开始 | 原型 | `src/screens/Home.tsx`、`src/data.ts`（MODES） | Home | 文字模式默认文案 | AI 生成为模拟 |
| 平面纸样 + 对缝 QA | 展开后标好缝份、刻口，对缝有问题会提示 | 原型 | `src/screens/Flow.tsx`（flat / qa） | Flow | 坐姿恐龙 flat 阶段 | 结果为固定演示数据 |
| 用功能时才注册 | 浏览不用登录，开始生成、保存、登记时才弹注册 | 原型 | `src/store.tsx`（gate）、`src/App.tsx`（AuthDialog） | AuthDialog | 未登录点开版 | AuthDialog 未导出，本片不上镜或改用其它镜头 |
| 缝好登记 + 分享 | 缝好后登记照片、用时、心得，分享到社区或投稿案例库 | 原型 | `src/screens/Flow.tsx`（proofStage） | Flow | 兴趣用户 proof 阶段 | 照片为 3D 截图占位 |
| 申请成为创作者 | 从我的申请，审核后开通创作者中心 | 原型 | `src/screens/Me.tsx`（Apply、CreatorCard） | Me、Apply | fan → pending → creator | 审核为演示按钮 |
| 平台打样 → 发起材料包 | 创作者选平台打样，通过后定份数、售价、看分成 | 原型 | `src/screens/Flow.tsx`（proof plat、launch） | Flow | creator，平台打样回传 | 价格、分成为示例值 |
| 材料包预订 | 买家看 3D 成品、换布色、预订，开裁进度实时变化 | 原型 | `src/screens/Kit.tsx` | KitDetail | 哥特小龙 32 → 33 / 50 | 价格与份数为示例 |
