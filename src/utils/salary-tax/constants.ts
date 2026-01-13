/**
 * 薪资扣税计算常量
 */

import type { TaxBracket, SocialInsurance, SpecialDeduction } from '@/types/salary-tax';

/** 个税起征点（月） */
export const TAX_THRESHOLD = 5000;

/** 个人所得税税率表（综合所得适用 - 按年度累计） */
export const TAX_BRACKETS: TaxBracket[] = [
  { level: 1, min: 0, max: 36000, rate: 0.03, quickDeduction: 0 },
  { level: 2, min: 36000, max: 144000, rate: 0.1, quickDeduction: 2520 },
  { level: 3, min: 144000, max: 300000, rate: 0.2, quickDeduction: 16920 },
  { level: 4, min: 300000, max: 420000, rate: 0.25, quickDeduction: 31920 },
  { level: 5, min: 420000, max: 660000, rate: 0.3, quickDeduction: 52920 },
  { level: 6, min: 660000, max: 960000, rate: 0.35, quickDeduction: 85920 },
  { level: 7, min: 960000, max: Infinity, rate: 0.45, quickDeduction: 181920 },
];

/** 社保公积金默认值 */
export const DEFAULT_SOCIAL_INSURANCE: SocialInsurance = {
  pension: 0,
  unemployment: 0,
  medical: 0,
  housingFund: 0,
};

/** 专项附加扣除默认值 */
export const DEFAULT_SPECIAL_DEDUCTION: SpecialDeduction = {
  housingLoan: 0,
  childCare: 0,
  childEducation: 0,
  continuingEducation: 0,
  seriousIllness: 0,
  housingRent: 0,
  elderlySupport: 0,
};

/** 专项附加扣除项标签 */
export const SPECIAL_DEDUCTION_LABELS: Record<keyof SpecialDeduction, string> = {
  housingLoan: '住房贷款利息',
  childCare: '3岁以下婴幼儿照护',
  childEducation: '子女教育',
  continuingEducation: '继续教育',
  seriousIllness: '大病医疗',
  housingRent: '住房租金',
  elderlySupport: '赡养老人',
};

/** 社保公积金项标签 */
export const SOCIAL_INSURANCE_LABELS: Record<keyof SocialInsurance, string> = {
  pension: '养老保险',
  unemployment: '失业保险',
  medical: '医疗保险',
  housingFund: '住房公积金',
};

/** 专项附加扣除每月限额说明 */
export const SPECIAL_DEDUCTION_LIMITS: Record<keyof SpecialDeduction, string> = {
  housingLoan: '每月1000元',
  childCare: '每孩每月2000元',
  childEducation: '每孩每月2000元',
  continuingEducation: '学历教育每月400元',
  seriousIllness: '年度据实扣除（限额8万）',
  housingRent: '根据城市800-1500元/月',
  elderlySupport: '独生子女每月3000元',
};

/** 本地存储键名 */
export const STORAGE_KEY = 'salary-tax-calculator-data';

/** 记录列表存储键名 */
export const RECORDS_STORAGE_KEY = 'salary-tax-calculator-records';
