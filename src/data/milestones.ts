export type Motif =
  | 'terminals' // 4 台主机
  | 'bus' // 总线式以太网
  | 'handshake' // TCP 三次握手
  | 'dns' // DNS 层级树
  | 'web' // 超文本链接网
  | 'browser' // 浏览器窗口
  | 'wifi' // 无线电波
  | 'mobile' // 手机信号塔
  | 'ipv6' // 地址海
  | 'cell5g'; // 5G 蜂窝

export type Milestone = {
  year: number;
  title: string;
  desc: string;
  era: string;
  motif: Motif;
  kicker: string;
  mechanism: string;
  steps: [string, string, string];
  accent: string;
  metric: string;
  metricLabel: string;
};

export const MILESTONES: Milestone[] = [
  {
    year: 1969,
    title: 'ARPANET 诞生',
    desc: 'UCLA 与 SRI 首次通信，同年 ARPANET 连接四个节点',
    era: '网络起源',
    motif: 'terminals',
    kicker: '01 / THE FIRST CONNECTION',
    mechanism: '消息被拆成数据包，\n沿链路从一台主机抵达另一台。',
    steps: ['拆分消息', '分组传输', '接收重组'],
    accent: '#087f70',
    metric: '4',
    metricLabel: 'ARPANET 初始节点',
  },
  {
    year: 1973,
    title: '以太网问世',
    desc: 'Bob Metcalfe 提出以太网，总线式局域网时代开启',
    era: '网络起源',
    motif: 'bus',
    kicker: '02 / ONE CABLE, MANY MACHINES',
    mechanism: '多台计算机共享一条同轴电缆，\n数据沿总线传播，目标主机接收。',
    steps: ['侦听信道', '共享总线', '目标接收'],
    accent: '#ad5a12',
    metric: 'LAN',
    metricLabel: '局域网 · 把房间里的机器连起来',
  },
  {
    year: 1983,
    title: 'TCP/IP 登场',
    desc: 'ARPANET 切换 TCP/IP，互联网获得统一语言',
    era: '协议统一',
    motif: 'handshake',
    kicker: '03 / A COMMON LANGUAGE',
    mechanism: 'IP 负责寻址，TCP 负责可靠传输。\n先用三次握手，确认彼此准备就绪。',
    steps: ['SYN →', '← SYN + ACK', 'ACK →'],
    accent: '#1765cc',
    metric: '3',
    metricLabel: 'TCP 建立连接的三次握手',
  },
  {
    year: 1984,
    title: 'DNS 域名系统',
    desc: '分布式域名系统逐步应用，让域名映射到 IP 地址',
    era: '协议统一',
    motif: 'dns',
    kicker: '04 / GIVE THE INTERNET A NAME',
    mechanism: '输入域名，沿层级逐级查询，\n找到服务器对应的 IP 地址。',
    steps: ['根域', '顶级域', '权威域'],
    accent: '#087f93',
    metric: 'A → IP',
    metricLabel: '把可读的名字映射到网络地址',
  },
  {
    year: 1989,
    title: '万维网提案',
    desc: 'Tim Berners-Lee 在 CERN 提出 Web，超链接改变世界',
    era: '万维网',
    motif: 'web',
    kicker: '05 / EVERYTHING IS A LINK',
    mechanism: '一条超链接，连接另一份文档。\n分散的信息开始织成一张万维网。',
    steps: ['文档', '超链接', '全球信息网'],
    accent: '#7554ce',
    metric: 'WWW',
    metricLabel: '信息有了可以穿行的路径',
  },
  {
    year: 1993,
    title: 'Mosaic 浏览器',
    desc: '图形化浏览器引爆大众上网潮，网站数量爆炸',
    era: '万维网',
    motif: 'browser',
    kicker: '06 / THE WEB BECOMES VISIBLE',
    mechanism: '文字和图片走进同一个窗口，\n点击鼠标，就能沿链接探索世界。',
    steps: ['请求页面', '加载图文', '点击跳转'],
    accent: '#ba4079',
    metric: 'GUI',
    metricLabel: '图形化浏览 · 网络走向大众',
  },
  {
    year: 1997,
    title: 'Wi-Fi 标准发布',
    desc: 'IEEE 802.11 落地，连接摆脱网线束缚',
    era: '移动时代',
    motif: 'wifi',
    kicker: '07 / CUT THE CORD',
    mechanism: '比特调制为无线电信号，\n穿过空气，连接身边的设备。',
    steps: ['调制', '无线传播', '接入网络'],
    accent: '#027b9f',
    metric: '802.11',
    metricLabel: '无线局域网标准 · 1997',
  },
  {
    year: 2007,
    title: '移动互联网',
    desc: 'iPhone 发布，网络从桌面走进每个人的口袋',
    era: '移动时代',
    motif: 'mobile',
    kicker: '08 / THE INTERNET IN YOUR POCKET',
    mechanism: '智能手机让触摸成为入口，\n蜂窝网络把连接带出房间。',
    steps: ['触摸交互', '蜂窝连接', '随时在线'],
    accent: '#5068ca',
    metric: '24 / 7',
    metricLabel: '连接从桌面走向每个人',
  },
  {
    year: 2012,
    title: 'IPv6 全球启用',
    desc: '全球 IPv6 Launch Day，地址空间近乎无限',
    era: '万物互联',
    motif: 'ipv6',
    kicker: '09 / ROOM FOR EVERYTHING',
    mechanism: '从 32 位走向 128 位地址。\n给不断涌现的设备，留下连接空间。',
    steps: ['IPv4 · 32 位', '地址扩容', 'IPv6 · 128 位'],
    accent: '#008474',
    metric: '2¹²⁸',
    metricLabel: 'IPv6 地址空间 · 场景为规模示意',
  },
  {
    year: 2019,
    title: '5G 商用元年',
    desc: '高速低时延网络开启万物互联与智能时代',
    era: '万物互联',
    motif: 'cell5g',
    kicker: '10 / A CONNECTED WORLD',
    mechanism: '密集蜂窝与定向波束协同，\n让车辆、工厂与城市持续交换数据。',
    steps: ['蜂窝覆盖', '定向波束', '万物协同'],
    accent: '#8051c4',
    metric: '5G',
    metricLabel: '更快连接 · 更低时延 · 更多设备',
  },
];

// 视频结构（30fps）
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_SECONDS = 60;
export const TOTAL_FRAMES = FPS * TOTAL_SECONDS; // 1800

export const INTRO_DURATION = 5 * FPS;
export const OUTRO_DURATION = 5 * FPS;
export const CHRONICLE_DURATION = TOTAL_FRAMES - INTRO_DURATION - OUTRO_DURATION; // 50s
export const MILESTONE_DURATION = CHRONICLE_DURATION / MILESTONES.length; // 150帧 = 5s

export const ERAS = ['网络起源', '协议统一', '万维网', '移动时代', '万物互联'];
export const ERA_COLORS: Record<string, string> = {
  网络起源: '#4dd8ff',
  协议统一: '#5fb2ff',
  万维网: '#8a8dff',
  移动时代: '#b47dff',
  万物互联: '#e06bff',
};

export const eraColor = (era: string): string => ERA_COLORS[era] ?? '#4dd8ff';
