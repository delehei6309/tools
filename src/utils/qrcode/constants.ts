/**
 * 二维码生成器常量配置
 */
import type { OriginOption, ParamOption } from '@/types/qrcode';

// 来源选项配置
export const ORIGIN_OPTIONS: OriginOption[] = [
  { value: 'https://c.sinbaad.com', label: '薪八达个人签约' },
  { value: 'https://test-c.sinbaad.com', label: '薪八达个人签约-测试环境' },
  { value: 'custom', label: '自定义' },
];

// 默认参数选项
export const DEFAULT_PARAM_OPTIONS: ParamOption[] = [
  { label: '企业UUID', value: 'customer_user_uuid' },
  { label: '供应商UUID', value: 'provider_user_uuid' },
  { label: '岗位UUID', value: 'position_uuid' },
  { label: '项目UUID', value: 'project_uuid' },
  { label: 'proxy_uuid', value: 'proxy_uuid' },
  { label: 'proxy_user_uuid', value: 'proxy_user_uuid' },
];

// 默认样式配置
export const DEFAULT_STYLE_CONFIG = {
  size: 180,
  codeColor: '#000000',
  backgroundColor: '#FFFFFF',
};

// 默认 Logo 配置
export const DEFAULT_LOGO_CONFIG = {
  image: '',
  size: 20, // 百分比
};

// Logo 上传限制
export const LOGO_UPLOAD_LIMIT = {
  maxSize: 2, // MB
  acceptTypes: ['image/png', 'image/jpeg', 'image/jpg'],
  minSizePercent: 15,
  maxSizePercent: 30,
};
