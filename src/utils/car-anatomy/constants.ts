import type { CarPart, SceneConfig } from '@/types/car-anatomy';

// 默认场景配置
export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  backgroundColor: '#1a1a2e',
  ambientLightIntensity: 0.6,
  directionalLightIntensity: 0.8,
  cameraPosition: { x: 5, y: 3, z: 5 },
};

// 本地已安装的模型（可直接使用）
export const LOCAL_CAR_MODELS = [
  {
    id: 'default',
    name: '简化模型',
    path: '', // 空路径表示使用默认简化模型
    description: '系统内置的简化汽车模型',
    thumbnail: '🚗',
  },
  {
    id: 'sketchfab-car',
    name: 'Sketchfab 汽车',
    path: '/models/car/scene.gltf',
    description: '从 Sketchfab 下载的高质量模型',
    thumbnail: '🏎️',
  },
];

// 可用的免费汽车模型列表（需下载）
export const FREE_CAR_MODELS = [
  {
    name: '1975 Porsche 911 Turbo',
    url: 'https://sketchfab.com/3d-models/free-1975-porsche-911-930-turbo-8568d9d14a994b9cae59499f0dbed21e',
    downloadUrl: '/models/porsche-911.glb',
    author: 'Lionsharp Studios',
    license: 'CC BY 4.0',
    description: '高质量保时捷 911，244k 下载量，非常推荐！',
  },
  {
    name: 'Chevrolet Corvette C7',
    url: 'https://sketchfab.com/3d-models/chevrolet-corvette-c7-ae3e49ba3f3f48458c1c56ab66226d3d',
    downloadUrl: '/models/corvette-c7.glb',
    author: 'Sketchfab',
    license: 'CC BY 4.0',
  },
  {
    name: 'Low Poly Car',
    url: 'https://sketchfab.com/3d-models/low-poly-car-fde6e00ad5f9492b8760a7bcc0dc90bc',
    downloadUrl: '/models/low-poly-car.glb',
    author: 'Community',
    license: 'CC0',
  },
];

// Tesla Model Y 的部件映射（示例）
// 你需要根据实际下载的模型调整这些 mesh 名称
export const TESLA_PART_MAPPINGS = [
  { meshNames: ['body', 'Body', 'car_body'], partId: 'body_main' },
  { meshNames: ['hood', 'Hood', 'bonnet', 'frunk'], partId: 'hood' },
  { meshNames: ['roof', 'Roof'], partId: 'roof' },
  { meshNames: ['trunk', 'Trunk', 'boot', 'tailgate'], partId: 'trunk' },
  { meshNames: ['door_fl', 'DoorFL', 'front_left_door'], partId: 'left_door' },
  { meshNames: ['door_fr', 'DoorFR', 'front_right_door'], partId: 'right_door' },
  { meshNames: ['bumper_f', 'FrontBumper', 'front_bumper'], partId: 'front_bumper' },
  { meshNames: ['bumper_r', 'RearBumper', 'rear_bumper'], partId: 'rear_bumper' },
  { meshNames: ['wheel_fl', 'WheelFL', 'front_left_wheel'], partId: 'wheel_fl' },
  { meshNames: ['wheel_fr', 'WheelFR', 'front_right_wheel'], partId: 'wheel_fr' },
  { meshNames: ['wheel_rl', 'WheelRL', 'rear_left_wheel'], partId: 'wheel_rl' },
  { meshNames: ['wheel_rr', 'WheelRR', 'rear_right_wheel'], partId: 'wheel_rr' },
  { meshNames: ['glass', 'Glass', 'windshield', 'window'], partId: 'glass' },
  { meshNames: ['light', 'Light', 'headlight'], partId: 'lights' },
  { meshNames: ['mirror', 'Mirror'], partId: 'mirror' },
  { meshNames: ['interior', 'Interior', 'cabin'], partId: 'interior' },
  { meshNames: ['seat', 'Seat'], partId: 'seats' },
  { meshNames: ['steering', 'Steering', 'steer'], partId: 'steering_wheel' },
  { meshNames: ['dashboard', 'Dashboard', 'dash'], partId: 'dashboard' },
];

// 汽车部件数据（示例轿车部件）
export const CAR_PARTS: CarPart[] = [
  {
    id: 'hood',
    name: '发动机舱盖',
    description: '保护发动机舱，通常由钢板或铝合金制成，设有隔热层以阻隔发动机热量。',
    category: 'body',
    explodeOffset: { x: 0, y: 1.5, z: 0 },
  },
  {
    id: 'front_bumper',
    name: '前保险杠',
    description: '车辆前部的防护装置，吸收低速碰撞的冲击力，保护车身结构和行人安全。',
    category: 'body',
    explodeOffset: { x: 0, y: 0, z: 2 },
  },
  {
    id: 'rear_bumper',
    name: '后保险杠',
    description: '车辆后部的防护装置，与前保险杠类似，用于保护车尾和吸收碰撞能量。',
    category: 'body',
    explodeOffset: { x: 0, y: 0, z: -2 },
  },
  {
    id: 'left_door',
    name: '左侧车门',
    description: '乘客进出车辆的通道，内部集成车窗、锁具、音响等多种功能。',
    category: 'body',
    explodeOffset: { x: -2, y: 0, z: 0 },
  },
  {
    id: 'right_door',
    name: '右侧车门',
    description: '乘客进出车辆的通道，内部集成车窗、锁具、音响等多种功能。',
    category: 'body',
    explodeOffset: { x: 2, y: 0, z: 0 },
  },
  {
    id: 'trunk',
    name: '后备箱盖',
    description: '车辆后部储物空间的盖板，通常配有液压撑杆或电动开启装置。',
    category: 'body',
    explodeOffset: { x: 0, y: 1, z: -1.5 },
  },
  {
    id: 'roof',
    name: '车顶',
    description: '车身顶部结构，提供乘客舱的顶部防护，部分车型配有天窗。',
    category: 'body',
    explodeOffset: { x: 0, y: 2, z: 0 },
  },
  {
    id: 'engine',
    name: '发动机',
    description:
      '汽车的动力核心，将燃料的化学能转化为机械能。现代发动机多采用涡轮增压技术提升效率。',
    category: 'engine',
    explodeOffset: { x: 0, y: 1.5, z: 1.5 },
  },
  {
    id: 'transmission',
    name: '变速箱',
    description: '连接发动机和驱动轮的传动装置，通过改变齿轮比调节车速和扭矩输出。',
    category: 'engine',
    explodeOffset: { x: 0, y: -0.5, z: 1 },
  },
  {
    id: 'radiator',
    name: '散热器',
    description: '发动机冷却系统的核心部件，通过水循环带走发动机产生的热量。',
    category: 'engine',
    explodeOffset: { x: 0, y: 0.5, z: 2.5 },
  },
  {
    id: 'exhaust',
    name: '排气系统',
    description: '将发动机燃烧后的废气排出，包含催化转化器和消音器，降低排放和噪音。',
    category: 'chassis',
    explodeOffset: { x: 0.5, y: -1.5, z: 0 },
  },
  {
    id: 'suspension_front',
    name: '前悬挂系统',
    description: '连接车轮和车身的弹性支撑装置，吸收路面冲击，保证行驶平稳性和操控性。',
    category: 'chassis',
    explodeOffset: { x: 0, y: -1.2, z: 2 },
  },
  {
    id: 'suspension_rear',
    name: '后悬挂系统',
    description: '后轮与车身之间的连接系统，常见类型有独立悬挂和扭力梁悬挂。',
    category: 'chassis',
    explodeOffset: { x: 0, y: -1.2, z: -2 },
  },
  {
    id: 'fuel_tank',
    name: '油箱',
    description: '储存燃油的容器，通常位于后座下方或后轴前方，具有防泄漏设计。',
    category: 'chassis',
    explodeOffset: { x: 0, y: -1.5, z: -1 },
  },
  {
    id: 'wheel_fl',
    name: '左前轮',
    description: '包含轮胎、轮毂、刹车盘等部件，是车辆与地面接触的关键部件。',
    category: 'wheel',
    explodeOffset: { x: -2, y: 0, z: 2 },
  },
  {
    id: 'wheel_fr',
    name: '右前轮',
    description: '包含轮胎、轮毂、刹车盘等部件，是车辆与地面接触的关键部件。',
    category: 'wheel',
    explodeOffset: { x: 2, y: 0, z: 2 },
  },
  {
    id: 'wheel_rl',
    name: '左后轮',
    description: '包含轮胎、轮毂、刹车盘等部件，后轮驱动车型中负责传递动力。',
    category: 'wheel',
    explodeOffset: { x: -2, y: 0, z: -2 },
  },
  {
    id: 'wheel_rr',
    name: '右后轮',
    description: '包含轮胎、轮毂、刹车盘等部件，后轮驱动车型中负责传递动力。',
    category: 'wheel',
    explodeOffset: { x: 2, y: 0, z: -2 },
  },
  {
    id: 'steering_wheel',
    name: '方向盘',
    description: '驾驶员控制车辆行驶方向的操作装置，集成多功能按键和安全气囊。',
    category: 'interior',
    explodeOffset: { x: -1, y: 1, z: 0.5 },
  },
  {
    id: 'dashboard',
    name: '仪表台',
    description: '显示车辆状态信息的面板，包括速度、转速、油量、水温等指示器。',
    category: 'interior',
    explodeOffset: { x: 0, y: 1.2, z: 1 },
  },
  {
    id: 'seats',
    name: '座椅',
    description: '为乘客提供舒适支撑，高端车型配有加热、通风、按摩等功能。',
    category: 'interior',
    explodeOffset: { x: 0, y: 1.5, z: 0 },
  },
];

// 部件颜色映射
export const CATEGORY_COLORS: Record<string, number> = {
  body: 0x4a90d9, // 蓝色
  engine: 0xe74c3c, // 红色
  chassis: 0x95a5a6, // 灰色
  interior: 0x9b59b6, // 紫色
  wheel: 0x2c3e50, // 深灰色
};

// 动画配置
export const ANIMATION_CONFIG = {
  duration: 1000, // 动画持续时间（毫秒）
  easing: 'easeInOutCubic',
};
