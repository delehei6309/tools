// 汽车部件信息类型
export interface CarPart {
  id: string;
  name: string;
  description: string;
  category: CarPartCategory;
  // 爆炸视图中的偏移位置
  explodeOffset: {
    x: number;
    y: number;
    z: number;
  };
}

// 部件分类
export type CarPartCategory = 'body' | 'engine' | 'chassis' | 'interior' | 'wheel';

// 部件分类中文映射
export const CATEGORY_LABELS: Record<CarPartCategory, string> = {
  body: '车身',
  engine: '发动机',
  chassis: '底盘',
  interior: '内饰',
  wheel: '轮毂',
};

// 视图模式
export type ViewMode = 'assembled' | 'exploded';

// 场景配置
export interface SceneConfig {
  backgroundColor: string;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  cameraPosition: { x: number; y: number; z: number };
}
