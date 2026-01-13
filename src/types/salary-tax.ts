/**
 * 薪资扣税计算系统类型定义
 */

/** 社保公积金扣除项 */
export interface SocialInsurance {
  /** 养老保险 */
  pension: number;
  /** 失业保险 */
  unemployment: number;
  /** 医疗保险 */
  medical: number;
  /** 住房公积金 */
  housingFund: number;
}

/** 专项附加扣除项 */
export interface SpecialDeduction {
  /** 住房贷款利息 */
  housingLoan: number;
  /** 3岁以下婴幼儿照护 */
  childCare: number;
  /** 子女教育 */
  childEducation: number;
  /** 继续教育 */
  continuingEducation: number;
  /** 大病医疗 */
  seriousIllness: number;
  /** 住房租金 */
  housingRent: number;
  /** 赡养老人 */
  elderlySupport: number;
}

/** 单月数据 */
export interface MonthlyInput {
  /** 月份 (1-12) */
  month: number;
  /** 税前工资（可选，不填则使用默认值） */
  grossSalary?: number;
  /** 社保公积金扣除（可选，不填则使用默认值） */
  socialInsurance?: Partial<SocialInsurance>;
  /** 专项附加扣除（可选，不填则使用默认值） */
  specialDeduction?: Partial<SpecialDeduction>;
  /** 是否使用自定义值 */
  useCustom: boolean;
}

/** 薪资输入表单数据 */
export interface SalaryFormData {
  /** 年度 */
  year: number;
  /** 默认税前月工资 */
  grossSalary: number;
  /** 默认社保公积金扣除 */
  socialInsurance: SocialInsurance;
  /** 默认专项附加扣除 */
  specialDeduction: SpecialDeduction;
  /** 月度自定义数据（覆盖默认值） */
  monthlyOverrides: MonthlyInput[];
}

/** 月度计算结果 */
export interface MonthlyResult {
  /** 月份 (1-12) */
  month: number;
  /** 税前工资 */
  grossSalary: number;
  /** 社保公积金扣除 */
  socialInsuranceTotal: number;
  /** 社保公积金明细 */
  socialInsuranceDetail: SocialInsurance;
  /** 专项附加扣除 */
  specialDeductionTotal: number;
  /** 专项附加扣除明细 */
  specialDeductionDetail: SpecialDeduction;
  /** 起征点 */
  threshold: number;
  /** 累计收入 */
  cumulativeIncome: number;
  /** 累计扣除 */
  cumulativeDeduction: number;
  /** 累计应纳税所得额 */
  cumulativeTaxableIncome: number;
  /** 累计应纳税额 */
  cumulativeTax: number;
  /** 当月应纳税额 */
  monthlyTax: number;
  /** 实发工资 */
  netSalary: number;
  /** 适用税率 */
  taxRate: number;
  /** 速算扣除数 */
  quickDeduction: number;
  /** 是否使用自定义值 */
  isCustom: boolean;
}

/** 年度汇总结果 */
export interface YearlySummary {
  /** 年度 */
  year: number;
  /** 全年税前收入总额 */
  totalGrossSalary: number;
  /** 全年社保公积金扣除总额 */
  totalSocialInsurance: number;
  /** 全年专项附加扣除总额 */
  totalSpecialDeduction: number;
  /** 全年起征点扣除总额 */
  totalThreshold: number;
  /** 全年应纳税所得额 */
  totalTaxableIncome: number;
  /** 全年应缴个人所得税总额 */
  totalTax: number;
  /** 全年实发工资总额 */
  totalNetSalary: number;
  /** 月度明细 */
  monthlyDetails: MonthlyResult[];
}

/** 税率表项 */
export interface TaxBracket {
  /** 级数 */
  level: number;
  /** 应纳税所得额下限 */
  min: number;
  /** 应纳税所得额上限 */
  max: number;
  /** 税率 */
  rate: number;
  /** 速算扣除数 */
  quickDeduction: number;
}

/** 存储数据结构 */
export interface SalaryTaxStorage {
  /** 版本号 */
  version: number;
  /** 更新时间 */
  updatedAt: string;
  /** 表单数据 */
  formData: SalaryFormData;
}

/** 保存的记录 */
export interface SavedRecord {
  /** 记录ID */
  id: string;
  /** 记录名称 */
  name: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 表单数据 */
  formData: SalaryFormData;
}

/** 记录列表存储结构 */
export interface RecordsStorage {
  /** 版本号 */
  version: number;
  /** 记录列表 */
  records: SavedRecord[];
}
