/**
 * 二维码生成器类型定义
 */

// 参数输入项
export interface ParamsInput {
  value: string;
  label: string;
  key: string;
}

// 参数选项
export interface ParamOption {
  label: string;
  value: string;
}

// 表单数据
export interface QRCodeForm {
  origin: string;
  custom: string;
  params: (string | number)[];
  paramsInput: ParamsInput[];
}

// 样式配置
export interface StyleConfig {
  size: number;
  codeColor: string;
  backgroundColor: string;
}

// Logo配置
export interface LogoConfig {
  image: string;
  size: number; // 百分比
}

// 二维码生成选项
export interface QRCodeOptions {
  url: string;
  size: number;
  codeColor: string;
  backgroundColor: string;
  logoImage?: string;
  logoSize?: number;
}

// 来源选项
export interface OriginOption {
  value: string;
  label: string;
}
