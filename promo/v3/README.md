# 纸样工作台 v3 · 用户需求演示动画

两支 9:16（1080×1920）、30 fps、带配乐的小红书竖版视频，内容相同，风格不同：

| 文件 | 风格 | 配乐 |
| --- | --- | --- |
| `pattern-studio-orange.mp4` | 黑橙 · 圆角弹跳、关卡进度条、贴纸 | 124 BPM 马林巴流行，C–G–Am–F |
| `pattern-studio-purple.mp4` | 黑紫 · 日系漫画网点、速度线、拟声词、音符 | 140 BPM 轻音乐队，王道进行 IV–V–iii–vi |

配乐由 `music.js` 用代码合成，不含采样和第三方音乐，可以直接商用。

## 叙事

按用户需求分六段，每段先说痛点，再看功能：

1. 零基础新手：模板库 → 3D 与纸样联动 → 跟着缝 → 用功能时才注册
2. 只有一个想法：一句话 → AI 起形 → 3D 形体 → 拍板
3. 手上有 3D 模型：模型来源 → 自动体检 → 平面纸样
4. 缝好的那一刻：对缝 QA → 导出纸样 → 缝好登记、投稿案例库
5. 想卖材料包的创作者：从我的申请 → 平台打样 → 发起材料包拿分成
6. 想直接买的人：材料包详情 → 预订

## 重新生成

```bash
python3 -m http.server 8765 &                          # 仓库根目录
cd prototype-v3 && npx vite build && cd ..             # 原型
NODE_PATH=$(npm root -g) node promo/v3/capture.js a    # 截取橙色主题界面
NODE_PATH=$(npm root -g) node promo/v3/capture.js b    # 截取紫色主题界面
node promo/v3/music.js                                 # 合成配乐
NODE_PATH=$(npm root -g) node promo/v3/render.js a     # 逐帧渲染并合成 mp4
NODE_PATH=$(npm root -g) node promo/v3/render.js b
```

节奏、分段在 `timing.json`，画面时间轴（字幕、截图切换、放大卡片、点击、贴纸）在 `stage.html` 顶部的数组里，单位都是小节，改 BPM 后画面和音乐会一起对齐。
