# Network Chronicle · 计算机网络发展编年史

用 **Three.js + Remotion + GSAP** 制作的 60 秒立体科普动画。影片沿着 1969—2019 年的 10 个里程碑，把网络技术变成可以看见的场景：四台终端交换数据包、TCP 三次握手、DNS 分层查询、无线电波、地址空间扩张，以及 5G 智慧城市。

视觉采用明亮的冰蓝色展台、实体设备、彩色链路和缓慢环绕镜头，配合数据包拖尾、环形扫描与扩散波纹。左侧深色文字说明原理，底部时间轴标记历史位置，字幕独立显示在时间轴上方。影片已接入 **Edge TTS 中文男声云希（`zh-CN-YunxiNeural`）**，包含 12 段配音和 24 句同步字幕。

## 视频规格

| 项目 | 默认值 |
| --- | --- |
| Composition ID | `NetworkChronicle` |
| 分辨率 | 1920 × 1080（16:9） |
| 帧率 | 30 fps |
| 时长 | 60 秒，共 1800 帧 |
| 视频输出 | `out/network-chronicle.mp4` |
| 单帧输出 | `out/frame.png` |
| 分镜检查输出 | `out/review/` 下的 12 张 PNG |
| 配音素材 | `public/narration/` 下的 12 个 WAV |
| 独立字幕 | `public/narration/network-chronicle.srt` |

## 安装与预览

准备好 Node.js 和 npm，在项目根目录执行：

```bash
npm ci
npm run dev
```

在浏览器中打开终端显示的 Remotion Studio 地址，选择 `NetworkChronicle`。支持播放、暂停和拖动时间线；三维场景与文字都根据当前帧更新。

项目提供 `package-lock.json`，建议使用 `npm ci` 安装锁定的依赖版本。预览和渲染需要可用的 WebGL 环境。首次渲染可能需要下载浏览器组件。

## 导出与检查

```bash
# TypeScript 类型检查
npm run typecheck

# 验证反向寻帧、重复帧与场景资源释放
npm run validate

# 导出完整 1080p 视频
npm run render

# 导出默认静帧
npm run still

# 导出第 540 帧（18 秒处）
npm run still -- --frame=540

# 为开场、10 个里程碑和片尾各导出一张检查图
npm run review
```

命令会将产物写入上述位置，配置允许覆盖同名输出。

默认使用 Chromium `angle` 渲染器，并将视频渲染并发设为 `1`，以控制三维场景的显存与资源占用。硬件环境无法正常渲染时，可尝试软件渲染：

```bash
npm run render -- --gl=swangle
npm run still -- --frame=540 --gl=swangle
```

`review` 脚本复用一次打包与一个浏览器实例，依次生成 12 张 PNG。其默认渲染器同样为 `angle`，可通过 `REMOTION_GL` 环境变量覆盖。例如在 PowerShell 中：

```powershell
$env:REMOTION_GL = 'swangle'
npm run review
Remove-Item Env:\REMOTION_GL
```

检查脚本使用当前 CLI 依赖树中的 `@remotion/bundler` 和 `@remotion/renderer`。软件渲染包含完整的三维与泛光处理，耗时可能明显增加。

## 配音与字幕

仓库中的配音是实际通过 [edge-tts](https://github.com/rany2/edge-tts) 合成的本地音频；预览与视频渲染不需要连接 TTS 服务。字幕已烧录在画面中，也提供可单独使用的 UTF-8 SRT 文件。

修改 [`src/data/narration-script.json`](src/data/narration-script.json) 后重新生成：

```bash
# Python 3.10+；第一次生成前安装
python -m pip install -r requirements-narration.txt

# 需要联网访问微软 Edge TTS 服务
npm run narration

# 强制重新合成所有章节
npm run narration -- --force
```

默认使用云希男声和稍低的音调。每章配音从章节开始后 0.3 秒进入，结尾至少留出 0.2 秒；脚本会检查真实音频长度，必要时重新合成并小幅加快语速，超过上限则要求精简旁白，避免截断或跨章。生成音频按统一响度处理，字幕时间来自 Edge 返回的句子边界，停顿时自动隐藏。每句可分别设置 `speech`（发音文本）与 `caption`（屏幕字幕，例如把“一百二十八”显示为“128”）。

生成脚本复用 Remotion 自带的 FFmpeg，支持按旁白内容缓存，最后统一发布 [`src/data/narration-timing.json`](src/data/narration-timing.json)。更改章节时长、帧率或章节数量时，请同步修改配音脚本配置并重新生成；画面会检查总帧数及帧率是否匹配。

`validate` 直接运行实际场景代码，比较首次跳转与反向拖动后的对象状态、材质、几何数据和实例矩阵，并检查资源释放；无需启动浏览器或 GPU。视觉质量仍需通过 `review` 和成片检查。

## 内容与分镜

| 时间段 | 内容 |
| --- | --- |
| 0–5 秒 | 一次连接展开为网络星球；“一次连接，改变整个世界。” |
| 5–55 秒 | 10 个里程碑，每章 5 秒 |
| 55–60 秒 | 回到网络星球；“从四个节点到万物互联。” |

| 时间 | 年份 / 主题 | 三维表现 | 原理重点 |
| --- | --- | --- | --- |
| 5–10 秒 | 1969 · ARPANET | 四台终端、连接线与运动数据包 | 消息拆分、分组传输与重组 |
| 10–15 秒 | 1973 · 以太网 | 共享同轴总线和多台计算机 | 多设备共享传输介质 |
| 15–20 秒 | 1983 · TCP/IP | 客户端与服务器间的三条握手路径 | SYN → SYN + ACK → ACK |
| 20–25 秒 | 1984 · DNS | 分层服务器树、查询与返回光点 | 域名沿层级查询到 IP |
| 25–30 秒 | 1989 · 万维网 | 立体文档通过超链接织成网络 | 文档之间的超文本连接 |
| 30–35 秒 | 1993 · Mosaic | 复古浏览器窗口、图文与鼠标交互 | 图形界面让 Web 更易使用 |
| 35–40 秒 | 1997 · Wi-Fi | 路由器、设备与扩散无线电波 | 比特通过无线信号传输 |
| 40–45 秒 | 2007 · 移动互联网 | 立体手机与蜂窝连接 | 网络进入口袋，连接走出房间 |
| 45–50 秒 | 2012 · IPv6 | 有限方格展开为立体地址矩阵 | 32 位与 128 位地址空间的差异 |
| 50–55 秒 | 2019 · 5G | 城市、密集蜂窝与定向波束 | 多设备持续协同通信 |

这些场景是帮助理解的视觉示意，并非设备结构、网络拓扑或覆盖范围的工程仿真。

## 渲染与动画架构

`NetworkChronicle` 组合三维画面、文字与配音字幕：

- **`ThreeStage`**：管理 Three.js 的 WebGL 渲染器、透视相机、灯光、材质与各章场景。通过 `EffectComposer` 依次执行 `RenderPass`、`UnrealBloomPass` 与 `OutputPass`，形成发光数据链路和空间层次。
- **`CinematicOverlay`**：使用 React 与 CSS 绘制中文标题、年份、原理说明、三个步骤、数据指标与底部时间轴，并用 GSAP 的缓动函数控制逐帧入场。
- **`Narration`**：按章节挂载本地配音，并按照同一份语音时间戳显示字幕。

动画的时间源是 Remotion 当前帧。`src/lib/motion.ts` 创建处于暂停状态的 GSAP 镜头时间线，并在每一帧主动 seek 到 `frame / fps` 对应的局部时间；场景中的数据包、波纹和实例矩阵也由时间直接计算。因此，不依赖播放经过的真实时间来推进动画，便于拖动预览和离线逐帧导出。

三维场景按主题分为三组：

| 文件 | 职责 |
| --- | --- |
| `physicalScenes.ts` | ARPANET、以太网、Wi-Fi、手机与 5G 城市 |
| `protocolScenes.ts` | TCP 握手、DNS、Web、Mosaic 与 IPv6 |
| `worldScene.ts` | 开场与片尾的网络星球 |

## 当前入口结构

以下只列出当前 Composition 使用的入口与主要模块：

```text
network-chronicle/
├── src/
│   ├── index.ts                  # Remotion 入口
│   ├── Root.tsx                  # 注册 Composition 和视频规格
│   ├── NetworkChronicle.tsx      # 组合三维场景与文字层
│   ├── data/
│   │   ├── milestones.ts        # 10 个里程碑、文案、强调色与时长
│   │   ├── narration-script.json # 配音文本、男声与章节节奏
│   │   └── narration-timing.json # 生成的实际语音时间戳
│   ├── lib/
│   │   └── motion.ts            # GSAP 镜头时间线与缓动工具
│   ├── components/
│   │   ├── ThreeStage.tsx       # WebGL、相机、后处理与场景调度
│   │   ├── CinematicOverlay.tsx # 标题、原理步骤、指标与时间轴
│   │   └── Narration.tsx        # 配音播放与同步字幕
│   └── three/
│       ├── types.ts             # 场景生命周期与标签类型
│       ├── primitives.ts        # 设备、链路、光点等基础模型
│       ├── physicalScenes.ts    # 实体设备与无线网络场景
│       ├── protocolScenes.ts    # 协议与信息组织场景
│       └── worldScene.ts        # 网络星球
├── scripts/
│   ├── render-review.mjs        # 12 张分镜检查图
│   ├── validate-motion.mjs      # 寻帧确定性与资源生命周期检查
│   └── generate-narration.py    # Edge TTS 配音、响度处理与字幕
├── public/narration/            # 本地 WAV、缓存元数据与 SRT
├── out/                        # 执行导出命令后生成的产物
├── remotion.config.ts          # ANGLE、并发 1、JPEG 中间帧、覆盖输出
├── tsconfig.json
├── package.json
└── package-lock.json
```

仓库中保留了旧版 SVG 场景组件及相关工具；当前 `NetworkChronicle.tsx` 没有引用它们。修改当前影片请以以上入口结构为准。

## 自定义

里程碑内容位于 [`src/data/milestones.ts`](src/data/milestones.ts)，每项包含：

| 字段 | 用途 |
| --- | --- |
| `year`、`title`、`era` | 年份、章节标题和时代标签 |
| `desc` | 里程碑背景描述 |
| `motif` | 三维场景类型 |
| `kicker` | 小号章节引导文字 |
| `mechanism` | 原理说明，支持 `\n` 换行 |
| `steps` | 三个原理步骤 |
| `accent` | 当前章节的三维与文字强调色 |
| `metric`、`metricLabel` | 关键数据或技术标识及解释 |

修改配色优先编辑各里程碑的 `accent`，全局明亮底色与文字色位于 `src/lib/theme.ts`。调整模型、数据包路径或无线效果时，编辑对应的 `physicalScenes.ts`、`protocolScenes.ts` 或 `worldScene.ts`；调整灯光、泛光和相机时，编辑 `ThreeStage.tsx` 与 `motion.ts`；修改字体、排版和开场片尾文案时，编辑 `CinematicOverlay.tsx`。当前泛光阈值高于浅色背景，主要保留数据包亮芯的发光，避免白色展台过曝。

默认节奏按 **5 秒开场 + 10 × 5 秒章节 + 5 秒片尾** 设计。更改时长或增减里程碑时，需要一并检查 `milestones.ts` 的时长常量、`motion.ts` 的 5 秒镜头轨迹、场景路由、时间轴文字以及检查脚本的取帧位置。新增场景还需扩展 `Motif` 类型与对应工厂函数。

## 字体与素材

模型、链路、粒子与界面均由代码绘制，无需额外图片或视频素材；配音与字幕作为本地素材保存在 `public/narration/`。中文优先使用 `Microsoft YaHei`、`PingFang SC` 或 `Noto Sans SC`，数字与英文使用 `Cascadia Code` 或 `Consolas`。工程未打包字体文件，跨平台渲染时应检查字体回退、换行和标签位置。

## 历史资料

里程碑背景可参阅 [Computer History Museum 的网络发展时间线](https://www.computerhistory.org/timeline/networking-the-web/)与 [Internet Society 的互联网简史](https://www.internetsociety.org/internet/history-internet/brief-history-internet/)。1989 年 Web 提案的背景见 [CERN 的 Web 诞生记录](https://home.cern/science/computing/the-birth-of-the-web/)，2012 年章节对应 [World IPv6 Launch 全球启用活动](https://www.internetsociety.org/news/press-releases/2012/world-ipv6-launch-unites-industry-leaders-to-redefine-the-global-internet/)。
