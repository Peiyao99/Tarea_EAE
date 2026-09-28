# 纸样工作台 · 小红书演示视频

- `paper-pattern-studio-xhs.mp4`：1080×1440（3:4）H.264，约 93 秒，无声，适合小红书竖版视频直接上传，在编辑器里配乐。
- `paper-pattern-studio-xhs-cover.png`：1080×1440 封面。
- `stage.html`：视频舞台（字幕、手机外壳、手指点击示意），内嵌 `../prototype/index.html?embed`。
- `record.js` / `cover.js`：Playwright 自动操作原型并录制。

重新录制：

```bash
python3 -m http.server 8123 &            # 在仓库根目录
NODE_PATH=$(npm root -g) node promo/record.js promo/out
ffmpeg -f concat -safe 0 -i promo/out/frames.txt \
  -vf "setpts=PTS/1.15,scale=1080:1440:flags=lanczos,fps=30,format=yuv420p" \
  -c:v libx264 -preset slow -crf 18 -movflags +faststart promo/paper-pattern-studio-xhs.mp4
```
