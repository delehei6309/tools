/**
 * 薪资扣税计算工具函数
 */

import Big from 'big.js';
import type {
  SocialInsurance,
  SpecialDeduction,
  MonthlyResult,
  YearlySummary,
  TaxBracket,
  SalaryFormData,
  MonthlyInput,
} from '@/types/salary-tax';
import { TAX_BRACKETS, TAX_THRESHOLD } from './constants';

/**
 * 计算社保公积金扣除总额
 */
export function calculateSocialInsuranceTotal(socialInsurance: SocialInsurance): number {
  return new Big(socialInsurance.pension)
    .plus(socialInsurance.unemployment)
    .plus(socialInsurance.medical)
    .plus(socialInsurance.housingFund)
    .toNumber();
}

/**
 * 计算专项附加扣除总额
 */
export function calculateSpecialDeductionTotal(specialDeduction: SpecialDeduction): number {
  return new Big(specialDeduction.housingLoan)
    .plus(specialDeduction.childCare)
    .plus(specialDeduction.childEducation)
    .plus(specialDeduction.continuingEducation)
    .plus(specialDeduction.seriousIllness)
    .plus(specialDeduction.housingRent)
    .plus(specialDeduction.elderlySupport)
    .toNumber();
}

/**
 * 根据累计应纳税所得额查找适用税率档位
 */
export function findTaxBracket(taxableIncome: number): TaxBracket {
  const income = Math.max(0, taxableIncome);
  for (const bracket of TAX_BRACKETS) {
    if (income <= bracket.max) {
      return bracket;
    }
  }
  return TAX_BRACKETS[TAX_BRACKETS.length - 1];
}

/**
 * 计算累计应纳税额
 * 累计应纳税额 = 累计应纳税所得额 × 适用税率 - 速算扣除数
 */
export function calculateCumulativeTax(cumulativeTaxableIncome: number): {
  tax: number;
  bracket: TaxBracket;
} {
  if (cumulativeTaxableIncome <= 0) {
    return { tax: 0, bracket: TAX_BRACKETS[0] };
  }

  const bracket = findTaxBracket(cumulativeTaxableIncome);
  const tax = new Big(cumulativeTaxableIncome)
    .times(bracket.rate)
    .minus(bracket.quickDeduction)
    .toNumber();

  return {
    tax: Math.max(0, Number(tax.toFixed(2))),
    bracket,
  };
}

/**
 * 计算单月薪资详情
 * 注意：专项附加扣除采用累计计算方式，即当月累计扣除 = 当月数 × 月扣除额
 * 这样年中新增的扣除项目可以补扣之前月份的额度
 */
export function calculateMonthlyDetail(
  month: number,
  grossSalary: number,
  socialInsurance: SocialInsurance,
  specialDeduction: SpecialDeduction,
  previousCumulativeActualTaxPaid: number, // 累计实际已扣税额
  previousCumulativeIncome: number,
  previousCumulativeSocialInsurance: number,
  isCustom: boolean = false
): MonthlyResult {
  const socialInsuranceTotal = calculateSocialInsuranceTotal(socialInsurance);
  const specialDeductionTotal = calculateSpecialDeductionTotal(specialDeduction);

  // 累计收入
  const cumulativeIncome = new Big(previousCumulativeIncome).plus(grossSalary).toNumber();

  // 累计社保公积金
  const cumulativeSocialInsurance = new Big(previousCumulativeSocialInsurance)
    .plus(socialInsuranceTotal)
    .toNumber();

  // 累计专项附加扣除 = 当月数 × 当月专项扣除额（支持年中新增后补扣）
  const cumulativeSpecialDeduction = new Big(specialDeductionTotal).times(month).toNumber();

  // 累计起征点
  const cumulativeThreshold = new Big(TAX_THRESHOLD).times(month).toNumber();

  // 累计扣除总额
  const cumulativeDeduction = new Big(cumulativeSocialInsurance)
    .plus(cumulativeSpecialDeduction)
    .plus(cumulativeThreshold)
    .toNumber();

  // 累计应纳税所得额
  const cumulativeTaxableIncome = Math.max(
    0,
    new Big(cumulativeIncome).minus(cumulativeDeduction).toNumber()
  );

  // 计算累计应纳税额（理论上应缴的税）
  const { tax: cumulativeTax, bracket } = calculateCumulativeTax(cumulativeTaxableIncome);

  // 当月应纳税额 = 累计应纳税额 - 累计已实际扣缴税额
  // 关键修正：使用累计实际已扣税额，而不是累计理论应纳税额
  // 这样当之前多扣的税可以在后续月份逐渐抵扣
  const monthlyTaxRaw = new Big(cumulativeTax).minus(previousCumulativeActualTaxPaid).toNumber();
  const monthlyTax = Math.max(0, Number(monthlyTaxRaw.toFixed(2)));

  // 实发工资 = 税前工资 - 社保公积金 - 当月个税
  const netSalary = Number(
    new Big(grossSalary).minus(socialInsuranceTotal).minus(monthlyTax).toFixed(2)
  );

  return {
    month,
    grossSalary,
    socialInsuranceTotal,
    socialInsuranceDetail: { ...socialInsurance },
    specialDeductionTotal,
    specialDeductionDetail: { ...specialDeduction },
    threshold: TAX_THRESHOLD,
    cumulativeIncome,
    cumulativeDeduction,
    cumulativeTaxableIncome,
    cumulativeTax,
    monthlyTax,
    netSalary,
    taxRate: bracket.rate,
    quickDeduction: bracket.quickDeduction,
    isCustom,
  };
}

/**
 * 获取某月的实际数据（合并默认值和覆盖值）
 */
export function getMonthlyData(
  month: number,
  formData: SalaryFormData
): {
  grossSalary: number;
  socialInsurance: SocialInsurance;
  specialDeduction: SpecialDeduction;
  isCustom: boolean;
} {
  const override = formData.monthlyOverrides.find((o) => o.month === month && o.useCustom);

  if (!override) {
    return {
      grossSalary: formData.grossSalary,
      socialInsurance: { ...formData.socialInsurance },
      specialDeduction: { ...formData.specialDeduction },
      isCustom: false,
    };
  }

  // 合并覆盖值
  return {
    grossSalary: override.grossSalary ?? formData.grossSalary,
    socialInsurance: {
      ...formData.socialInsurance,
      ...override.socialInsurance,
    },
    specialDeduction: {
      ...formData.specialDeduction,
      ...override.specialDeduction,
    },
    isCustom: true,
  };
}

/**
 * 计算全年薪资详情
 */
export function calculateYearlySalary(formData: SalaryFormData): YearlySummary {
  const { year } = formData;

  const monthlyDetails: MonthlyResult[] = [];
  let cumulativeActualTaxPaid = 0; // 累计实际已扣税
  let previousCumulativeIncome = 0;
  let previousCumulativeSocialInsurance = 0;

  // 计算12个月的数据
  for (let month = 1; month <= 12; month++) {
    // 获取该月的实际数据（可能是默认值或覆盖值）
    const monthData = getMonthlyData(month, formData);

    const result = calculateMonthlyDetail(
      month,
      monthData.grossSalary,
      monthData.socialInsurance,
      monthData.specialDeduction,
      cumulativeActualTaxPaid, // 传入累计实际已扣税
      previousCumulativeIncome,
      previousCumulativeSocialInsurance,
      monthData.isCustom
    );

    monthlyDetails.push(result);

    // 更新累计值
    cumulativeActualTaxPaid += result.monthlyTax; // 累计实际已扣税
    previousCumulativeIncome = result.cumulativeIncome;
    previousCumulativeSocialInsurance += result.socialInsuranceTotal;
  }

  // 计算年度汇总
  const lastMonth = monthlyDetails[11];

  return {
    year,
    totalGrossSalary: monthlyDetails.reduce(
      (sum, item) => new Big(sum).plus(item.grossSalary).toNumber(),
      0
    ),
    totalSocialInsurance: monthlyDetails.reduce(
      (sum, item) => new Big(sum).plus(item.socialInsuranceTotal).toNumber(),
      0
    ),
    totalSpecialDeduction: monthlyDetails.reduce(
      (sum, item) => new Big(sum).plus(item.specialDeductionTotal).toNumber(),
      0
    ),
    totalThreshold: TAX_THRESHOLD * 12,
    totalTaxableIncome: lastMonth.cumulativeTaxableIncome,
    totalTax: lastMonth.cumulativeTax,
    totalNetSalary: monthlyDetails.reduce(
      (sum, item) => new Big(sum).plus(item.netSalary).toNumber(),
      0
    ),
    monthlyDetails,
  };
}

/**
 * 创建空的月度覆盖数据
 */
export function createEmptyMonthlyOverride(month: number): MonthlyInput {
  return {
    month,
    grossSalary: undefined,
    socialInsurance: undefined,
    specialDeduction: undefined,
    useCustom: false,
  };
}

/**
 * 初始化所有月份的覆盖数据
 */
export function initMonthlyOverrides(): MonthlyInput[] {
  return Array.from({ length: 12 }, (_, i) => createEmptyMonthlyOverride(i + 1));
}

/**
 * 格式化金额显示
 */
export function formatMoney(amount: number, masked = false): string {
  if (masked) {
    return '****';
  }
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * 格式化百分比
 */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/**
 * 获取当前年份
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * 生成可选年份列表（最近5年）
 */
export function getYearOptions(): number[] {
  const currentYear = getCurrentYear();
  const years: number[] = [];
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }
  return years;
}
