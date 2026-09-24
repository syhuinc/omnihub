export type IconName =
  | 'home'
  | 'grid'
  | 'crown'
  | 'user'
  | 'search'
  | 'bell'
  | 'edit'
  | 'chevron-right'
  | 'pin'
  | 'plus'
  | 'trash'
  | 'check'
  | 'x'
  | 'sun'
  | 'moon'
  | 'download'
  | 'upload'
  | 'shield'
  | 'info'
  | 'settings'
  | 'back'
  | 'backspace'
  | 'history'
  | 'calculator'
  | 'converter'
  | 'timer'
  | 'note'
  | 'checklist'
  | 'wallet'
  | 'budget'
  | 'receipt'
  | 'cake'
  | 'calendar'
  | 'dice'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'more-dots'
  | 'lock'
  | 'unlock'
  | 'image'
  | 'file'
  | 'sunrise'
  | 'sunset'
  | 'star'
  | 'play'
  | 'stop'
  | 'music'
  | 'lightbulb'
  | 'sort'
  | 'percent'
  | 'function'
  | 'globe'
  | 'clock'
  | 'repeat'
  | 'card'
  | 'scan'
  | 'flashlight'
  | 'compass'
  | 'barcode'
  | 'mountain'
  | 'target'
  | 'magnet'
  | 'gyroscope'
  | 'activity'
  | 'level'
  | 'minus'
  | 'mug'
  | 'run'
  | 'pot'
  | 'flag'
  | 'coins'
  | 'list-bullet'
  | 'tag'
  | 'palette'
  | 'hash'
  | 'pie-chart'
  | 'trending-up'
  | 'heart'
  | 'camera'
  | 'paw'
  | 'chevron-down'
  | 'power'
  | 'battery'
  | 'zap'
  | 'package'
  | 'pause'
  | 'volume'
  | 'smartphone'
  | 'wifi'
  | 'cpu'
  | 'database';

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

const paths: Record<IconName, React.ReactNode> = {
  home: (
    <path d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
  ),
  grid: (
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
  ),
  crown: (
    <path d="m3 17 1.5-9L9 12l3-7 3 7 4.5-4L21 17z M4.5 20h15" />
  ),
  user: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c1-4 4.5-6 8-6s7 2 8 6" />
  ),
  search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3" />,
  bell: (
    <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10ZM9.5 18.5a2.5 2.5 0 0 0 5 0" />
  ),
  edit: (
    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14 6l4 4" />
  ),
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  pin: (
    <path d="M12 2a5 5 0 0 0-5 5c0 4 5 11 5 11s5-7 5-11a5 5 0 0 0-5-5Z M12 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
  ),
  check: <path d="m5 13 4 4L19 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  sun: (
    <path d="M12 4V2m0 20v-2M4 12H2m20 0h-2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4M5.6 18.4 4.2 19.8M19.8 4.2l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />,
  download: <path d="M12 3v12m0 0-4-4m4 4 4-4M5 19h14" />,
  upload: <path d="M12 21V9m0 0-4 4m4-4 4 4M5 5h14" />,
  shield: (
    <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z M9 12l2 2 4-4" />
  ),
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v6M12 8v.01" />,
  settings: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.6V4a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.6 1H20a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1Z" />
  ),
  back: <path d="m15 6-6 6 6 6" />,
  backspace: (
    <path d="M9 5h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7Z M11.5 10l5 5m0-5-5 5" />
  ),
  history: (
    <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4.5h4.5 M12 8v4l3 2" />
  ),
  calculator: (
    <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M7.5 6.5h9v4h-9zM7.5 13h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zM7.5 17h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2z" />
  ),
  converter: (
    <path d="M4 8h13m0 0-3.5-3.5M17 8l-3.5 3.5M20 16H7m0 0 3.5-3.5M7 16l3.5 3.5" />
  ),
  timer: (
    <path d="M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 10v4l3 2M10 2h4M12 6V2" />
  ),
  note: (
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M14 3v5h5 M8 12h8M8 16h5" />
  ),
  checklist: (
    <path d="M9 6h11M9 12h11M9 18h11 M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
  ),
  wallet: (
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm0 4h18M17 14h.01" />
  ),
  budget: (
    <path d="M4 14a7 7 0 0 1 12.5-4.3L19 8l-1 3 2 1.5V15a2 2 0 0 1-2 2h-1v3H9v-3a7 7 0 0 1-5-3Z M8 9V7" />
  ),
  receipt: (
    <path d="M6 2h12v20l-2-1.3L14 22l-2-1.3L10 22l-2-1.3L6 22Z M8.5 7h7M8.5 10.5h7M8.5 14h4" />
  ),
  cake: (
    <path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7Z M4 17h16 M8 12V9m4 3V9m4 3V9 M8 6l0-2M12 6l0-3M16 6l0-2" />
  ),
  calendar: (
    <path d="M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M4 10h16M8 2v6M16 2v6" />
  ),
  dice: (
    <path d="M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M8 8h.01M16 8h.01M8 16h.01M16 16h.01M12 12h.01" />
  ),
  food: (
    <path d="M6 2v8a2 2 0 0 0 4 0V2M8 10v12M18 2c-2 2-2 5-2 7a2 2 0 0 0 2 2v10" />
  ),
  transport: (
    <path d="M5 16V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8 M3 16h18 M6 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM18 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
  ),
  shopping: (
    <path d="M6 8h12l1 13H5Z M9 8V6a3 3 0 0 1 6 0v2" />
  ),
  entertainment: (
    <path d="M4 4h16v13H6l-2 3Z M8 8h8M8 11h5" />
  ),
  health: (
    <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
  ),
  'more-dots': <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  lock: (
    <path d="M6 11V8a6 6 0 0 1 12 0v3 M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z M12 15v3" />
  ),
  unlock: (
    <path d="M6 11V8a6 6 0 0 1 11.3-2.7 M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z M12 15v3" />
  ),
  image: (
    <path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M4 17l5-5 3.5 3.5L16 12l4 4" />
  ),
  file: (
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M14 3v5h5" />
  ),
  sunrise: (
    <path d="M12 3v5 M4.2 12H2m20 0h-2.2 M5.6 8.6 4.1 7.1m14.3 1.5 1.5-1.5 M6 18a6 6 0 0 1 12 0 M2 18h20 M9 18a3 3 0 0 1 6 0" />
  ),
  sunset: (
    <path d="M12 21v-5 M4.2 11H2m20 0h-2.2 M5.6 7.6 4.1 6.1m14.3 1.5 1.5-1.5 M6 16a6 6 0 0 1 12 0 M2 16h20 M9 16a3 3 0 0 1 6 0" />
  ),
  star: (
    <path d="m12 3 2.7 5.9 6.3.7-4.7 4.4 1.3 6.3L12 17.3 6.4 20.3l1.3-6.3-4.7-4.4 6.3-.7Z" />
  ),
  play: <path d="M7 4.5v15l13-7.5Z" />,
  stop: <path d="M6 6h12v12H6Z" />,
  pause: <path d="M7 5h4v14H7Z M13 5h4v14h-4Z" />,
  volume: <path d="M4 9v6h4l5 4V5L8 9Z M16.5 9a4 4 0 0 1 0 6" />,
  music: (
    <path d="M9 18V5l11-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  ),
  lightbulb: (
    <path d="M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
  ),
  sort: (
    <path d="M7 4v16 M7 4 4 7m3-3 3 3 M17 20V4m0 16-3-3m3 3 3-3" />
  ),
  percent: (
    <path d="M19 5 5 19 M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
  ),
  function: <path d="M8 21c2-6 2-13 2-16a3 3 0 0 1 3-3 M5 10h6 M13 21l7-8m-7 0 7 8" />,
  globe: (
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3 12h18 M12 3a13.5 13.5 0 0 1 0 18 13.5 13.5 0 0 1 0-18Z" />
  ),
  clock: <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 6v6l4 2" />,
  repeat: (
    <path d="M17 2l4 4-4 4 M21 6H8a5 5 0 0 0-5 5v1 M7 22l-4-4 4-4 M3 18h13a5 5 0 0 0 5-5v-1" />
  ),
  card: (
    <path d="M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z M2 10h20 M6 15h4" />
  ),
  scan: (
    <path d="M4 8V5a1 1 0 0 1 1-1h3 M16 4h3a1 1 0 0 1 1 1v3 M20 16v3a1 1 0 0 1-1 1h-3 M8 20H5a1 1 0 0 1-1-1v-3 M4 12h16" />
  ),
  flashlight: (
    <path d="M9 2h6l-1 5h1l-3 6-3-6h1Z M8 13h8v7a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2Z" />
  ),
  compass: (
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M15.5 8.5l-2 5-5 2 2-5Z" />
  ),
  barcode: <path d="M4 4v16M7.5 4v16M10 4v16M13 4v16M16.5 4v16M20 4v16" />,
  mountain: (
    <path d="m3 20 5.5-9.5L12 16l2.5-4L21 20Z M15.5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  magnet: (
    <path d="M6 4h4v8.5a2 2 0 1 1-4 0Z M14 4h4v8.5a2 2 0 1 1-4 0Z M6 4a6 6 0 0 1 12 0 M6 9h4 M14 9h4" />
  ),
  gyroscope: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="9" ry="4" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </>
  ),
  activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  level: (
    <>
      <rect x="3" y="9" width="18" height="6" rx="3" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  mug: (
    <path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z M16 10h2a2 2 0 0 1 0 4h-2 M8 2.5c0 .7-.6.9-.6 1.6s.6 1 .6 1.6M12 2.5c0 .7-.6.9-.6 1.6s.6 1 .6 1.6" />
  ),
  run: (
    <>
      <circle cx="14.5" cy="4.3" r="1.7" />
      <path d="M8.5 20.5l1.5-5 3-1.5 2 2.5 3 1M11 14l-2-3 2.7-2.6 3 1.6 2.3-1.3" />
    </>
  ),
  pot: (
    <path d="M3 11h18M5 11v5a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-5M2 8.5h2m16 0h2M12 8.5V4" />
  ),
  flag: <path d="M6 3v18 M6 4h11l-2.5 3.5L17 11H6" />,
  coins: (
    <>
      <circle cx="9" cy="9" r="6" />
      <path d="M10.5 15.5A6 6 0 1 0 8.5 3.6" />
    </>
  ),
  'list-bullet': (
    <path d="M9 6h11M9 12h11M9 18h11 M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  ),
  tag: (
    <path d="M11.5 3H5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 .6 1.4l8.5 8.5a2 2 0 0 0 2.8 0l6.5-6.5a2 2 0 0 0 0-2.8l-8.5-8.5a2 2 0 0 0-1.4-.6ZM7.5 8a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1Z" />
  ),
  palette: (
    <path d="M12 3a9 9 0 1 0 0 18c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8Z M7 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM9 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM14 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
  ),
  hash: <path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18" />,
  'pie-chart': (
    <path d="M12 2a10 10 0 1 0 10 10H12Z M14 2.5A10 10 0 0 1 21.5 10H14Z" />
  ),
  'trending-up': <path d="M3 17 10 10l4 4 7-7 M15 7h6v6" />,
  heart: <path d="M12 20.5s-7.5-4.6-9.8-9.4C.6 7.4 2.6 4 6 4c2 0 3.4 1 6 3.5C14.6 5 16 4 18 4c3.4 0 5.4 3.4 3.8 7.1-2.3 4.8-9.8 9.4-9.8 9.4Z" />,
  camera: <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM12 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  paw: <path d="M8 7a1.6 2 0 1 0 0-4 1.6 2 0 0 0 0 4ZM16 7a1.6 2 0 1 0 0-4 1.6 2 0 0 0 0 4ZM4.5 11a1.5 2 0 1 0 0-4 1.5 2 0 0 0 0 4ZM19.5 11a1.5 2 0 1 0 0-4 1.5 2 0 0 0 0 4ZM12 20c-3 0-5.5-1.4-5.5-3.8 0-2 1.8-3.2 2.8-4.6.9-1.3 1.3-2.2 2.7-2.2s1.8.9 2.7 2.2c1 1.4 2.8 2.6 2.8 4.6 0 2.4-2.5 3.8-5.5 3.8Z" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  power: <path d="M12 3v8 M6.3 6.3a8 8 0 1 0 11.4 0" />,
  battery: <path d="M3 8a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1ZM19 10.5h2v3h-2Z" />,
  zap: <path d="M13 2 4 14h6l-1 8 9-12h-6Z" />,
  package: <path d="m3.5 8 8.5-4.5L20.5 8 12 12.5 3.5 8ZM3.5 8v8l8.5 4.5m0-8V20.5m0-8L20.5 8v8L12 20.5" />,
  smartphone: <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z M11 18h2" />,
  wifi: <path d="M1.4 9a16 16 0 0 1 21.2 0 M5 12.55a11 11 0 0 1 14.08 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01" />,
  cpu: <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M9 9h6v6H9Z M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />,
  database: <path d="M3 5a9 3 0 1 0 18 0a9 3 0 1 0-18 0 M3 5v14a9 3 0 0 0 18 0V5 M3 12a9 3 0 0 0 18 0" />,
};

export function Icon({ name, size = 20, strokeWidth = 2, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
