<template>
  <el-config-provider :locale="locale">
    <div class="salary-tax-container" :class="{ 'is-mobile': isMobile }">
      <!-- 顶部标题栏 -->
      <div class="header" :class="{ 'header-mobile': isMobile }">
        <div class="header-content">
          <h1>💰 薪资扣税计算器</h1>
          <p class="subtitle">个人所得税累计预扣法计算</p>
        </div>
        <div class="header-actions">
          <el-button
            :icon="FolderOpened"
            :size="isMobile ? 'small' : 'default'"
            @click="showRecordsDialog"
          >
            记录
          </el-button>
          <el-button
            :icon="isMasked ? Hide : View"
            :size="isMobile ? 'small' : 'default'"
            @click="toggleMask"
          >
            {{ isMasked ? '显示' : '隐藏' }}
          </el-button>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 输入表单区域 -->
        <el-card class="form-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>📝 默认薪资信息（每月通用）</span>
              <div class="header-btns">
                <el-button type="success" link @click="showSaveDialog">
                  <el-icon><DocumentAdd /></el-icon>
                  保存记录
                </el-button>
                <el-button type="primary" link @click="resetForm">重置</el-button>
              </div>
            </div>
          </template>

          <el-form :model="formData" label-position="top" class="salary-form">
            <!-- 年度选择 -->
            <el-form-item label="计算年度">
              <el-select v-model="formData.year" placeholder="选择年度" style="width: 100%">
                <el-option
                  v-for="year in yearOptions"
                  :key="year"
                  :label="`${year}年`"
                  :value="year"
                />
              </el-select>
            </el-form-item>

            <!-- 税前工资 -->
            <el-form-item label="默认税前月工资">
              <MoneyInput
                v-model="formData.grossSalary"
                placeholder="请输入税前月工资"
                suffix="元/月"
              />
            </el-form-item>

            <!-- 社保公积金扣除 -->
            <el-divider content-position="left">
              <span class="divider-title">🏥 默认社保公积金扣除（个人部分）</span>
            </el-divider>

            <div class="form-grid">
              <el-form-item
                v-for="(label, key) in SOCIAL_INSURANCE_LABELS"
                :key="key"
                :label="label"
              >
                <MoneyInput v-model="formData.socialInsurance[key]" placeholder="0" />
              </el-form-item>
            </div>

            <div class="deduction-summary">
              社保公积金合计：<span class="amount"
                >¥{{ formatMoney(socialInsuranceTotal, isMasked) }}</span
              >
            </div>

            <!-- 专项附加扣除 -->
            <el-divider content-position="left">
              <span class="divider-title">📋 默认专项附加扣除</span>
            </el-divider>

            <div class="form-grid">
              <el-form-item
                v-for="(label, key) in SPECIAL_DEDUCTION_LABELS"
                :key="key"
                :label="label"
              >
                <MoneyInput v-model="formData.specialDeduction[key]" placeholder="0" />
                <div class="form-tip">{{ SPECIAL_DEDUCTION_LIMITS[key] }}</div>
              </el-form-item>
            </div>

            <div class="deduction-summary">
              专项附加扣除合计：<span class="amount"
                >¥{{ formatMoney(specialDeductionTotal, isMasked) }}</span
              >
            </div>

            <!-- 计算按钮 -->
            <el-form-item>
              <el-button type="primary" size="large" style="width: 100%" @click="calculate">
                开始计算
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 计算结果区域 -->
        <template v-if="hasResult">
          <!-- 年度汇总卡片 -->
          <el-card class="summary-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>📊 {{ summary.year }}年度汇总</span>
              </div>
            </template>

            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">全年税前收入</div>
                <div class="summary-value">
                  ¥{{ formatMoney(summary.totalGrossSalary, isMasked) }}
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-label">全年社保公积金</div>
                <div class="summary-value warning">
                  -¥{{ formatMoney(summary.totalSocialInsurance, isMasked) }}
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-label">全年专项附加扣除</div>
                <div class="summary-value warning">
                  -¥{{ formatMoney(summary.totalSpecialDeduction, isMasked) }}
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-label">全年起征点扣除</div>
                <div class="summary-value warning">
                  -¥{{ formatMoney(summary.totalThreshold, isMasked) }}
                </div>
              </div>
              <div class="summary-item highlight">
                <div class="summary-label">全年应纳税所得额</div>
                <div class="summary-value">
                  ¥{{ formatMoney(summary.totalTaxableIncome, isMasked) }}
                </div>
              </div>
              <div class="summary-item danger">
                <div class="summary-label">全年应缴个人所得税</div>
                <div class="summary-value">¥{{ formatMoney(summary.totalTax, isMasked) }}</div>
              </div>
              <div class="summary-item success large">
                <div class="summary-label">全年实发工资总额</div>
                <div class="summary-value">
                  ¥{{ formatMoney(summary.totalNetSalary, isMasked) }}
                </div>
              </div>
            </div>
          </el-card>

          <!-- 月度明细表格 -->
          <el-card class="detail-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <div class="card-header-left">
                  <span>📋 月度明细表</span>
                  <span class="header-tip">💡 点击月份可单独调整该月数据</span>
                </div>
                <el-button type="primary" link @click="exportToMarkdown">
                  <el-icon><Download /></el-icon>
                  导出 MD
                </el-button>
              </div>
            </template>

            <!-- PC端表格 -->
            <el-table
              v-if="!isMobile"
              :data="summary.monthlyDetails"
              stripe
              border
              style="width: 100%"
              :row-class-name="tableRowClassName"
            >
              <el-table-column prop="month" label="月份" width="90" align="center">
                <template #default="{ row }">
                  <el-button
                    link
                    :type="row.isCustom ? 'warning' : 'primary'"
                    @click="openMonthEditor(row.month)"
                  >
                    {{ row.month }}月
                    <el-icon v-if="row.isCustom" class="custom-icon"><EditPen /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column prop="grossSalary" label="税前工资" align="right" width="110">
                <template #default="{ row }">
                  ¥{{ formatMoney(row.grossSalary, isMasked) }}
                </template>
              </el-table-column>
              <el-table-column
                prop="socialInsuranceTotal"
                label="社保公积金"
                align="right"
                width="100"
              >
                <template #default="{ row }">
                  <span class="text-warning"
                    >-¥{{ formatMoney(row.socialInsuranceTotal, isMasked) }}</span
                  >
                </template>
              </el-table-column>
              <el-table-column
                prop="specialDeductionTotal"
                label="专项扣除"
                align="right"
                width="100"
              >
                <template #default="{ row }">
                  <span class="text-warning"
                    >-¥{{ formatMoney(row.specialDeductionTotal, isMasked) }}</span
                  >
                </template>
              </el-table-column>
              <el-table-column
                prop="cumulativeTaxableIncome"
                label="累计应纳税所得额"
                align="right"
                width="140"
              >
                <template #default="{ row }">
                  ¥{{ formatMoney(row.cumulativeTaxableIncome, isMasked) }}
                </template>
              </el-table-column>
              <el-table-column prop="taxRate" label="税率" align="center" width="70">
                <template #default="{ row }">
                  <el-tag :type="getTaxRateType(row.taxRate)" size="small">
                    {{ formatPercent(row.taxRate) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="monthlyTax" label="当月个税" align="right" width="100">
                <template #default="{ row }">
                  <span class="text-danger">-¥{{ formatMoney(row.monthlyTax, isMasked) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="netSalary" label="实发工资" align="right" width="120">
                <template #default="{ row }">
                  <span class="text-success">¥{{ formatMoney(row.netSalary, isMasked) }}</span>
                </template>
              </el-table-column>
            </el-table>

            <!-- 移动端卡片列表 -->
            <div v-else class="mobile-detail-list">
              <div
                v-for="item in summary.monthlyDetails"
                :key="item.month"
                class="mobile-detail-card"
                :class="{ 'is-custom': item.isCustom }"
                @click="openMonthEditor(item.month)"
              >
                <div class="mobile-card-header">
                  <span class="month-badge">
                    {{ item.month }}月
                    <el-icon v-if="item.isCustom" class="custom-icon"><EditPen /></el-icon>
                  </span>
                  <el-tag :type="getTaxRateType(item.taxRate)" size="small">
                    税率 {{ formatPercent(item.taxRate) }}
                  </el-tag>
                </div>
                <div class="mobile-card-body">
                  <div class="mobile-row">
                    <span class="label">税前工资</span>
                    <span class="value">¥{{ formatMoney(item.grossSalary, isMasked) }}</span>
                  </div>
                  <div class="mobile-row">
                    <span class="label">社保公积金</span>
                    <span class="value warning"
                      >-¥{{ formatMoney(item.socialInsuranceTotal, isMasked) }}</span
                    >
                  </div>
                  <div class="mobile-row">
                    <span class="label">专项扣除</span>
                    <span class="value warning"
                      >-¥{{ formatMoney(item.specialDeductionTotal, isMasked) }}</span
                    >
                  </div>
                  <div class="mobile-row">
                    <span class="label">当月个税</span>
                    <span class="value danger">-¥{{ formatMoney(item.monthlyTax, isMasked) }}</span>
                  </div>
                  <div class="mobile-row highlight">
                    <span class="label">实发工资</span>
                    <span class="value success">¥{{ formatMoney(item.netSalary, isMasked) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 税率表参考 -->
          <el-card class="tax-rate-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>📖 个人所得税税率表（综合所得适用）</span>
              </div>
            </template>

            <el-table :data="TAX_BRACKETS" stripe border size="small">
              <el-table-column prop="level" label="级数" width="60" align="center" />
              <el-table-column label="全年应纳税所得额" align="center">
                <template #default="{ row }">
                  {{ row.min === 0 ? '不超过' : `超过${formatLargeNumber(row.min)}元至` }}
                  {{ row.max === Infinity ? '' : formatLargeNumber(row.max) + '元' }}
                  {{ row.max === Infinity ? '的部分' : '的部分' }}
                </template>
              </el-table-column>
              <el-table-column prop="rate" label="税率" width="80" align="center">
                <template #default="{ row }">
                  {{ formatPercent(row.rate) }}
                </template>
              </el-table-column>
              <el-table-column prop="quickDeduction" label="速算扣除数" width="100" align="right">
                <template #default="{ row }"> ¥{{ row.quickDeduction.toLocaleString() }} </template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>
      </div>

      <!-- 底部说明 -->
      <div class="footer">
        <p>💡 计算说明：本计算器采用累计预扣法计算个人所得税，起征点为5000元/月</p>
        <p>⚠️ 数据仅供参考，请以实际纳税申报为准</p>
      </div>

      <!-- 月度编辑弹窗 -->
      <el-dialog
        v-model="monthEditorVisible"
        :title="`编辑 ${editingMonth} 月数据`"
        :width="isMobile ? '95%' : '600px'"
        :fullscreen="isMobile"
        destroy-on-close
      >
        <div class="month-editor">
          <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
            <template #title> 勾选后可单独设置该月的数值，未勾选项将使用默认值 </template>
          </el-alert>

          <!-- 税前工资 -->
          <div class="editor-section">
            <div class="editor-row">
              <el-checkbox v-model="monthEditForm.customGrossSalary">自定义税前工资</el-checkbox>
              <MoneyInput
                v-if="monthEditForm.customGrossSalary"
                v-model="monthEditForm.grossSalary"
                placeholder="税前月工资"
                style="width: 200px; margin-left: 12px"
              />
              <span v-else class="default-value"
                >默认：¥{{ formatMoney(formData.grossSalary, false) }}</span
              >
            </div>
          </div>

          <!-- 社保公积金 -->
          <el-divider content-position="left">社保公积金扣除</el-divider>
          <div class="editor-section">
            <div v-for="(label, key) in SOCIAL_INSURANCE_LABELS" :key="key" class="editor-row">
              <el-checkbox v-model="monthEditForm.customSocialInsurance[key]">{{
                label
              }}</el-checkbox>
              <MoneyInput
                v-if="monthEditForm.customSocialInsurance[key]"
                v-model="monthEditForm.socialInsurance[key]"
                placeholder="0"
                style="width: 150px; margin-left: 12px"
              />
              <span v-else class="default-value"
                >默认：¥{{ formatMoney(formData.socialInsurance[key], false) }}</span
              >
            </div>
          </div>

          <!-- 专项附加扣除 -->
          <el-divider content-position="left">专项附加扣除</el-divider>
          <div class="editor-section">
            <div v-for="(label, key) in SPECIAL_DEDUCTION_LABELS" :key="key" class="editor-row">
              <el-checkbox v-model="monthEditForm.customSpecialDeduction[key]">{{
                label
              }}</el-checkbox>
              <MoneyInput
                v-if="monthEditForm.customSpecialDeduction[key]"
                v-model="monthEditForm.specialDeduction[key]"
                placeholder="0"
                style="width: 150px; margin-left: 12px"
              />
              <span v-else class="default-value"
                >默认：¥{{ formatMoney(formData.specialDeduction[key], false) }}</span
              >
            </div>
          </div>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="resetMonthData">恢复默认</el-button>
            <el-button @click="monthEditorVisible = false">取消</el-button>
            <el-button type="primary" @click="saveMonthData">保存</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 保存记录对话框 -->
      <el-dialog
        v-model="saveDialogVisible"
        :title="editingRecordId ? '更新记录' : '保存记录'"
        width="400px"
        :close-on-click-modal="false"
      >
        <el-form @submit.prevent="saveAsRecord">
          <el-form-item label="记录名称">
            <el-input
              v-model="newRecordName"
              placeholder="请输入记录名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          <div class="save-preview">
            <div class="preview-item">
              <span class="label">年度：</span>
              <span class="value">{{ formData.year }}年</span>
            </div>
            <div class="preview-item">
              <span class="label">月薪：</span>
              <span class="value">¥{{ formatMoney(formData.grossSalary, false) }}</span>
            </div>
          </div>
        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="saveDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveAsRecord">
              {{ editingRecordId ? '更新' : '保存' }}
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 记录列表对话框 -->
      <el-dialog
        v-model="recordsDialogVisible"
        title="📂 保存的记录"
        :width="isMobile ? '95%' : '600px'"
        :close-on-click-modal="true"
      >
        <div v-if="savedRecords.length === 0" class="empty-records">
          <el-empty description="暂无保存的记录" />
        </div>
        <div v-else class="records-list">
          <div v-for="record in savedRecords" :key="record.id" class="record-item">
            <div class="record-info" @click="loadRecord(record)">
              <div class="record-name">{{ record.name }}</div>
              <div class="record-meta">
                <span>{{ record.formData.year }}年</span>
                <span class="separator">|</span>
                <span>¥{{ formatMoney(record.formData.grossSalary, false) }}/月</span>
                <span class="separator">|</span>
                <span class="record-date">{{ formatDate(record.updatedAt) }}</span>
              </div>
            </div>
            <div class="record-actions">
              <el-button
                type="primary"
                link
                :icon="Edit"
                title="用当前数据更新此记录"
                @click.stop="updateRecord(record)"
              >
                更新
              </el-button>
              <el-button type="danger" link :icon="Delete" @click.stop="deleteRecord(record)">
                删除
              </el-button>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="recordsDialogVisible = false">关闭</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, reactive } from 'vue';
import { ElMessage, ElMessageBox, ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import {
  View,
  Hide,
  EditPen,
  FolderOpened,
  DocumentAdd,
  Delete,
  Edit,
  Download,
} from '@element-plus/icons-vue';

import MoneyInput from '@/components/common/MoneyInput.vue';
import type {
  SalaryFormData,
  YearlySummary,
  SocialInsurance,
  SpecialDeduction,
  SavedRecord,
} from '@/types/salary-tax';
import {
  DEFAULT_SOCIAL_INSURANCE,
  DEFAULT_SPECIAL_DEDUCTION,
  SOCIAL_INSURANCE_LABELS,
  SPECIAL_DEDUCTION_LABELS,
  SPECIAL_DEDUCTION_LIMITS,
  STORAGE_KEY,
  RECORDS_STORAGE_KEY,
  TAX_BRACKETS,
} from '@/utils/salary-tax/constants';
import {
  calculateYearlySalary,
  calculateSocialInsuranceTotal,
  calculateSpecialDeductionTotal,
  formatMoney,
  formatPercent,
  getCurrentYear,
  getYearOptions,
  initMonthlyOverrides,
} from '@/utils/salary-tax/utils';

// 中文语言包
const locale = zhCn;

// ==================== 响应式状态 ====================

// 移动端检测
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);

// 金额脱敏
const isMasked = ref(false);

// 年份选项
const yearOptions = getYearOptions();

// 表单数据
const formData = ref<SalaryFormData>({
  year: getCurrentYear(),
  grossSalary: 0,
  socialInsurance: { ...DEFAULT_SOCIAL_INSURANCE },
  specialDeduction: { ...DEFAULT_SPECIAL_DEDUCTION },
  monthlyOverrides: initMonthlyOverrides(),
});

// 计算结果
const yearlySummary = ref<YearlySummary | null>(null);
const hasResult = computed(() => yearlySummary.value !== null);

// 非空的年度汇总（用于模板中避免 null 检查）
const summary = computed(() => yearlySummary.value!);

// 月度编辑弹窗
const monthEditorVisible = ref(false);
const editingMonth = ref(1);

// 记录管理
const recordsDialogVisible = ref(false);
const saveDialogVisible = ref(false);
const savedRecords = ref<SavedRecord[]>([]);
const newRecordName = ref('');
const editingRecordId = ref<string | null>(null);

// 月度编辑表单
const monthEditForm = reactive({
  customGrossSalary: false,
  grossSalary: 0,
  customSocialInsurance: {} as Record<keyof SocialInsurance, boolean>,
  socialInsurance: { ...DEFAULT_SOCIAL_INSURANCE } as SocialInsurance,
  customSpecialDeduction: {} as Record<keyof SpecialDeduction, boolean>,
  specialDeduction: { ...DEFAULT_SPECIAL_DEDUCTION } as SpecialDeduction,
});

// ==================== 计算属性 ====================

// 社保公积金合计
const socialInsuranceTotal = computed(() => {
  return calculateSocialInsuranceTotal(formData.value.socialInsurance);
});

// 专项附加扣除合计
const specialDeductionTotal = computed(() => {
  return calculateSpecialDeductionTotal(formData.value.specialDeduction);
});

// ==================== 方法 ====================

// 切换金额显示/隐藏
function toggleMask() {
  isMasked.value = !isMasked.value;
}

// 重置表单
function resetForm() {
  formData.value = {
    year: getCurrentYear(),
    grossSalary: 0,
    socialInsurance: { ...DEFAULT_SOCIAL_INSURANCE },
    specialDeduction: { ...DEFAULT_SPECIAL_DEDUCTION },
    monthlyOverrides: initMonthlyOverrides(),
  };
  yearlySummary.value = null;
  localStorage.removeItem(STORAGE_KEY);
  ElMessage.success('已重置');
}

// 计算薪资
function calculate() {
  if (!formData.value.grossSalary || formData.value.grossSalary <= 0) {
    ElMessage.warning('请输入有效的税前月工资');
    return;
  }

  yearlySummary.value = calculateYearlySalary(formData.value);
  saveToLocal();
  ElMessage.success('计算完成');
}

// 打开月度编辑器
function openMonthEditor(month: number) {
  editingMonth.value = month;

  // 查找该月是否有覆盖数据
  const override = formData.value.monthlyOverrides.find((o) => o.month === month);

  // 初始化社保公积金的自定义状态
  const socialKeys = Object.keys(SOCIAL_INSURANCE_LABELS) as (keyof SocialInsurance)[];
  socialKeys.forEach((key) => {
    monthEditForm.customSocialInsurance[key] = !!(
      override?.useCustom && override?.socialInsurance?.[key] !== undefined
    );
    monthEditForm.socialInsurance[key] =
      override?.socialInsurance?.[key] ?? formData.value.socialInsurance[key];
  });

  // 初始化专项附加扣除的自定义状态
  const specialKeys = Object.keys(SPECIAL_DEDUCTION_LABELS) as (keyof SpecialDeduction)[];
  specialKeys.forEach((key) => {
    monthEditForm.customSpecialDeduction[key] = !!(
      override?.useCustom && override?.specialDeduction?.[key] !== undefined
    );
    monthEditForm.specialDeduction[key] =
      override?.specialDeduction?.[key] ?? formData.value.specialDeduction[key];
  });

  // 税前工资
  monthEditForm.customGrossSalary = !!(override?.useCustom && override?.grossSalary !== undefined);
  monthEditForm.grossSalary = override?.grossSalary ?? formData.value.grossSalary;

  monthEditorVisible.value = true;
}

// 保存月度数据
function saveMonthData() {
  const month = editingMonth.value;
  const overrideIndex = formData.value.monthlyOverrides.findIndex((o) => o.month === month);

  // 构建覆盖数据
  const socialInsurance: Partial<SocialInsurance> = {};
  const specialDeduction: Partial<SpecialDeduction> = {};

  const socialKeys = Object.keys(SOCIAL_INSURANCE_LABELS) as (keyof SocialInsurance)[];
  socialKeys.forEach((key) => {
    if (monthEditForm.customSocialInsurance[key]) {
      socialInsurance[key] = monthEditForm.socialInsurance[key];
    }
  });

  const specialKeys = Object.keys(SPECIAL_DEDUCTION_LABELS) as (keyof SpecialDeduction)[];
  specialKeys.forEach((key) => {
    if (monthEditForm.customSpecialDeduction[key]) {
      specialDeduction[key] = monthEditForm.specialDeduction[key];
    }
  });

  const hasCustom =
    monthEditForm.customGrossSalary ||
    Object.values(monthEditForm.customSocialInsurance).some((v) => v) ||
    Object.values(monthEditForm.customSpecialDeduction).some((v) => v);

  const override = {
    month,
    grossSalary: monthEditForm.customGrossSalary ? monthEditForm.grossSalary : undefined,
    socialInsurance: Object.keys(socialInsurance).length > 0 ? socialInsurance : undefined,
    specialDeduction: Object.keys(specialDeduction).length > 0 ? specialDeduction : undefined,
    useCustom: hasCustom,
  };

  if (overrideIndex >= 0) {
    formData.value.monthlyOverrides[overrideIndex] = override;
  } else {
    formData.value.monthlyOverrides.push(override);
  }

  // 重新计算
  if (formData.value.grossSalary > 0) {
    yearlySummary.value = calculateYearlySalary(formData.value);
  }

  saveToLocal();
  monthEditorVisible.value = false;
  ElMessage.success(`${month}月数据已保存`);
}

// 恢复月份默认数据
function resetMonthData() {
  const month = editingMonth.value;
  const overrideIndex = formData.value.monthlyOverrides.findIndex((o) => o.month === month);

  if (overrideIndex >= 0) {
    formData.value.monthlyOverrides[overrideIndex] = {
      month,
      useCustom: false,
    };
  }

  // 重置编辑表单
  monthEditForm.customGrossSalary = false;
  monthEditForm.grossSalary = formData.value.grossSalary;

  const socialKeys = Object.keys(SOCIAL_INSURANCE_LABELS) as (keyof SocialInsurance)[];
  socialKeys.forEach((key) => {
    monthEditForm.customSocialInsurance[key] = false;
    monthEditForm.socialInsurance[key] = formData.value.socialInsurance[key];
  });

  const specialKeys = Object.keys(SPECIAL_DEDUCTION_LABELS) as (keyof SpecialDeduction)[];
  specialKeys.forEach((key) => {
    monthEditForm.customSpecialDeduction[key] = false;
    monthEditForm.specialDeduction[key] = formData.value.specialDeduction[key];
  });

  // 重新计算
  if (formData.value.grossSalary > 0) {
    yearlySummary.value = calculateYearlySalary(formData.value);
  }

  saveToLocal();
  ElMessage.success(`${month}月数据已恢复默认`);
}

// 保存到本地存储
function saveToLocal() {
  const data = {
    version: 2,
    updatedAt: new Date().toISOString(),
    formData: formData.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 从本地存储加载
function loadFromLocal() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (data.formData) {
        formData.value = {
          ...formData.value,
          ...data.formData,
          socialInsurance: {
            ...DEFAULT_SOCIAL_INSURANCE,
            ...data.formData.socialInsurance,
          },
          specialDeduction: {
            ...DEFAULT_SPECIAL_DEDUCTION,
            ...data.formData.specialDeduction,
          },
          monthlyOverrides: data.formData.monthlyOverrides || initMonthlyOverrides(),
        };
        // 如果有保存的数据，自动计算一次
        if (formData.value.grossSalary > 0) {
          yearlySummary.value = calculateYearlySalary(formData.value);
        }
      }
    } catch {
      console.error('Failed to parse local data');
    }
  }
}

// ==================== 记录管理 ====================

// 生成唯一 ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 加载所有保存的记录
function loadSavedRecords() {
  const stored = localStorage.getItem(RECORDS_STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      savedRecords.value = data.records || [];
    } catch {
      console.error('Failed to parse saved records');
      savedRecords.value = [];
    }
  } else {
    savedRecords.value = [];
  }
}

// 保存记录列表到本地存储
function saveRecordsToLocal() {
  const data = {
    version: 1,
    updatedAt: new Date().toISOString(),
    records: savedRecords.value,
  };
  localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(data));
}

// 显示保存对话框
function showSaveDialog() {
  if (!formData.value.grossSalary || formData.value.grossSalary <= 0) {
    ElMessage.warning('请先填写薪资信息');
    return;
  }
  newRecordName.value = `${formData.value.year}年 - ${formatMoney(formData.value.grossSalary, false)}`;
  editingRecordId.value = null;
  saveDialogVisible.value = true;
}

// 保存当前表单为记录
function saveAsRecord() {
  if (!newRecordName.value.trim()) {
    ElMessage.warning('请输入记录名称');
    return;
  }

  const record: SavedRecord = {
    id: editingRecordId.value || generateId(),
    name: newRecordName.value.trim(),
    createdAt: editingRecordId.value
      ? savedRecords.value.find((r) => r.id === editingRecordId.value)?.createdAt ||
        new Date().toISOString()
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    formData: JSON.parse(JSON.stringify(formData.value)),
  };

  if (editingRecordId.value) {
    // 更新现有记录
    const index = savedRecords.value.findIndex((r) => r.id === editingRecordId.value);
    if (index >= 0) {
      savedRecords.value[index] = record;
    }
  } else {
    // 添加新记录
    savedRecords.value.unshift(record);
  }

  saveRecordsToLocal();
  saveDialogVisible.value = false;
  ElMessage.success(editingRecordId.value ? '记录已更新' : '记录已保存');
}

// 显示记录列表对话框
function showRecordsDialog() {
  loadSavedRecords();
  recordsDialogVisible.value = true;
}

// 加载记录
function loadRecord(record: SavedRecord) {
  formData.value = {
    ...formData.value,
    ...record.formData,
    socialInsurance: {
      ...DEFAULT_SOCIAL_INSURANCE,
      ...record.formData.socialInsurance,
    },
    specialDeduction: {
      ...DEFAULT_SPECIAL_DEDUCTION,
      ...record.formData.specialDeduction,
    },
    monthlyOverrides: record.formData.monthlyOverrides || initMonthlyOverrides(),
  };

  // 重新计算
  if (formData.value.grossSalary > 0) {
    yearlySummary.value = calculateYearlySalary(formData.value);
  }

  saveToLocal();
  recordsDialogVisible.value = false;
  ElMessage.success(`已加载「${record.name}」`);
}

// 更新记录（保存当前数据到已有记录）
function updateRecord(record: SavedRecord) {
  if (!formData.value.grossSalary || formData.value.grossSalary <= 0) {
    ElMessage.warning('请先填写薪资信息');
    return;
  }

  newRecordName.value = record.name;
  editingRecordId.value = record.id;
  saveDialogVisible.value = true;
}

// 删除记录
async function deleteRecord(record: SavedRecord) {
  try {
    await ElMessageBox.confirm(`确定要删除记录「${record.name}」吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const index = savedRecords.value.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      savedRecords.value.splice(index, 1);
      saveRecordsToLocal();
      ElMessage.success('记录已删除');
    }
  } catch {
    // 用户取消删除
  }
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 导出月度明细为 Markdown
function exportToMarkdown() {
  if (!yearlySummary.value) {
    ElMessage.warning('暂无数据可导出');
    return;
  }

  const s = yearlySummary.value;
  const lines: string[] = [];

  // 标题
  lines.push(`# ${s.year}年薪资扣税明细`);
  lines.push('');
  lines.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push('');

  // 年度汇总
  lines.push('## 年度汇总');
  lines.push('');
  lines.push('| 项目 | 金额 |');
  lines.push('| :--- | ---: |');
  lines.push(`| 全年税前收入 | ¥${formatMoney(s.totalGrossSalary, false)} |`);
  lines.push(`| 全年社保公积金 | -¥${formatMoney(s.totalSocialInsurance, false)} |`);
  lines.push(`| 全年专项附加扣除 | -¥${formatMoney(s.totalSpecialDeduction, false)} |`);
  lines.push(`| 全年起征点扣除 | -¥${formatMoney(s.totalThreshold, false)} |`);
  lines.push(`| **全年应纳税所得额** | **¥${formatMoney(s.totalTaxableIncome, false)}** |`);
  lines.push(`| **全年应缴个人所得税** | **¥${formatMoney(s.totalTax, false)}** |`);
  lines.push(`| **全年实发工资总额** | **¥${formatMoney(s.totalNetSalary, false)}** |`);
  lines.push('');

  // 月度明细表
  lines.push('## 月度明细');
  lines.push('');
  lines.push(
    '| 月份 | 税前工资 | 社保公积金 | 专项扣除 | 累计应纳税所得额 | 税率 | 当月个税 | 实发工资 | 备注 |'
  );
  lines.push('| :---: | ---: | ---: | ---: | ---: | :---: | ---: | ---: | :--- |');

  for (const row of s.monthlyDetails) {
    const remark = row.isCustom ? '已自定义' : '';
    lines.push(
      `| ${row.month}月 ` +
        `| ¥${formatMoney(row.grossSalary, false)} ` +
        `| -¥${formatMoney(row.socialInsuranceTotal, false)} ` +
        `| -¥${formatMoney(row.specialDeductionTotal, false)} ` +
        `| ¥${formatMoney(row.cumulativeTaxableIncome, false)} ` +
        `| ${formatPercent(row.taxRate)} ` +
        `| -¥${formatMoney(row.monthlyTax, false)} ` +
        `| ¥${formatMoney(row.netSalary, false)} ` +
        `| ${remark} |`
    );
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*由薪资扣税计算器生成*');

  // 生成文件并下载
  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `薪资明细_${s.year}年_${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  ElMessage.success('导出成功');
}

// 格式化大数字显示
function formatLargeNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(num % 10000 === 0 ? 0 : 1) + '万';
  }
  return num.toLocaleString();
}

// 获取税率标签类型
function getTaxRateType(rate: number): 'success' | 'warning' | 'danger' | 'info' {
  if (rate <= 0.03) return 'success';
  if (rate <= 0.1) return 'info';
  if (rate <= 0.2) return 'warning';
  return 'danger';
}

// 表格行样式
function tableRowClassName({ row }: { row: { taxRate: number; isCustom: boolean } }) {
  if (row.isCustom) return 'custom-row';
  if (row.taxRate > 0.2) return 'high-tax-row';
  return '';
}

// 窗口大小监听
function handleResize() {
  windowWidth.value = window.innerWidth;
}

// ==================== 生命周期 ====================

onMounted(() => {
  window.addEventListener('resize', handleResize);
  loadFromLocal();
  loadSavedRecords();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 监听表单变化，自动保存
watch(
  formData,
  () => {
    if (formData.value.grossSalary > 0) {
      saveToLocal();
    }
  },
  { deep: true }
);
</script>
<style>
body {
  margin: 0;
  padding: 0;
}
</style>
<style scoped lang="less">
// ==================== 变量定义 ====================
@primary-color: #409eff;
@success-color: #67c23a;
@warning-color: #e6a23c;
@danger-color: #f56c6c;
@text-primary: #303133;
@text-secondary: #909399;
@bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// ==================== 容器样式 ====================
.salary-tax-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 40px;
}

// ==================== 顶部标题栏 ====================
.header {
  background: @bg-gradient;
  color: #fff;
  padding: 30px 20px;
  text-align: center;

  &.header-mobile {
    padding: 20px 16px;
  }

  .header-content {
    h1 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 600;
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
  }

  .header-actions {
    margin-top: 16px;

    :deep(.el-button) {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

.is-mobile .header {
  .header-content h1 {
    font-size: 22px;
  }
}

// ==================== 主内容区域 ====================
.main-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.is-mobile .main-content {
  padding: 12px;
}

// ==================== 卡片通用样式 ====================
.form-card,
.summary-card,
.detail-card,
.tax-rate-card {
  margin-bottom: 20px;
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: @text-primary;

  .card-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .header-tip {
    font-size: 12px;
    font-weight: normal;
    color: @text-secondary;
  }
}

// ==================== 表单样式 ====================
.salary-form {
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;

    :deep(.el-form-item) {
      margin-bottom: 8px;
    }
  }

  .form-tip {
    font-size: 12px;
    color: @text-secondary;
    margin-top: 4px;
  }

  .deduction-summary {
    text-align: right;
    padding: 12px 0;
    color: @text-secondary;
    font-size: 14px;

    .amount {
      color: @primary-color;
      font-weight: 600;
      font-size: 16px;
    }
  }

  :deep(.el-divider__text) {
    background: #fff;
    padding: 0 12px;
  }

  .divider-title {
    font-size: 14px;
    color: @text-primary;
  }
}

.is-mobile .salary-form {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

// ==================== 年度汇总样式 ====================
.summary-card {
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
  }

  .summary-item {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    text-align: center;

    .summary-label {
      font-size: 13px;
      color: @text-secondary;
      margin-bottom: 8px;
    }

    .summary-value {
      font-size: 20px;
      font-weight: 600;
      color: @text-primary;
    }

    &.warning .summary-value {
      color: @warning-color;
    }

    &.danger .summary-value {
      color: @danger-color;
    }

    &.success .summary-value {
      color: @success-color;
    }

    &.highlight {
      background: #ecf5ff;
      border: 1px solid #d9ecff;
    }

    &.large {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #52c41a15, #52c41a05);
      border: 1px solid #b7eb8f;

      .summary-value {
        font-size: 28px;
      }
    }
  }
}

.is-mobile .summary-card {
  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }

  .summary-item {
    padding: 12px;

    .summary-label {
      font-size: 12px;
    }

    .summary-value {
      font-size: 16px;
    }

    &.large .summary-value {
      font-size: 22px;
    }
  }
}

// ==================== 表格样式 ====================
.detail-card {
  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.high-tax-row) {
    background-color: #fef0f0;
  }

  :deep(.custom-row) {
    background-color: #fdf6ec;
  }

  .text-warning {
    color: @warning-color;
  }

  .text-danger {
    color: @danger-color;
  }

  .text-success {
    color: @success-color;
    font-weight: 600;
  }

  .custom-icon {
    margin-left: 4px;
    font-size: 12px;
  }
}

// ==================== 移动端明细列表 ====================
.mobile-detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-detail-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;

  &:active {
    border-color: @primary-color;
  }

  &.is-custom {
    border-color: @warning-color;
    background: #fffbf0;
  }

  .mobile-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f5f7fa;
    border-bottom: 1px solid #ebeef5;

    .month-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 16px;
      font-weight: 600;
      color: @text-primary;
    }

    .custom-icon {
      color: @warning-color;
      font-size: 14px;
    }
  }

  &.is-custom .mobile-card-header {
    background: #fdf6ec;
  }

  .mobile-card-body {
    padding: 12px 16px;
  }

  .mobile-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px dashed #ebeef5;

    &:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 13px;
      color: @text-secondary;
    }

    .value {
      font-size: 14px;
      font-weight: 500;
      color: @text-primary;

      &.warning {
        color: @warning-color;
      }

      &.danger {
        color: @danger-color;
      }

      &.success {
        color: @success-color;
        font-size: 16px;
        font-weight: 600;
      }
    }

    &.highlight {
      background: #f0f9eb;
      margin: 8px -16px -12px;
      padding: 12px 16px;
      border-radius: 0 0 10px 10px;
      border-bottom: none;
    }
  }
}

// ==================== 税率表样式 ====================
.tax-rate-card {
  :deep(.el-table) {
    font-size: 13px;
  }
}

// ==================== 底部说明 ====================
.footer {
  text-align: center;
  padding: 20px;
  color: @text-secondary;
  font-size: 13px;

  p {
    margin: 6px 0;
  }
}

.is-mobile .footer {
  font-size: 12px;
  padding: 16px 12px;
}

// ==================== 月度编辑器 ====================
.month-editor {
  .editor-section {
    margin-bottom: 16px;
  }

  .editor-row {
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px dashed #ebeef5;

    &:last-child {
      border-bottom: none;
    }

    :deep(.el-checkbox) {
      min-width: 140px;
    }

    .default-value {
      margin-left: 12px;
      color: @text-secondary;
      font-size: 13px;
    }
  }
}

.is-mobile .month-editor {
  .editor-row {
    flex-wrap: wrap;
    gap: 8px;

    :deep(.el-checkbox) {
      min-width: auto;
      width: 100%;
    }

    :deep(.el-input) {
      width: 100% !important;
      margin-left: 0 !important;
    }

    .default-value {
      margin-left: 0;
      width: 100%;
    }
  }
}

// ==================== 记录管理样式 ====================
.save-preview {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 16px;

  .preview-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;

    .label {
      color: @text-secondary;
    }

    .value {
      color: @text-primary;
      font-weight: 500;
    }
  }
}

.empty-records {
  padding: 20px 0;
}

.records-list {
  max-height: 400px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: #f9fafc;
  margin-bottom: 12px;
  transition: all 0.2s;

  &:hover {
    background: #e8f4ff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &:last-child {
    margin-bottom: 0;
  }

  .record-info {
    flex: 1;
    cursor: pointer;
    min-width: 0;

    .record-name {
      font-size: 15px;
      font-weight: 500;
      color: @text-primary;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .record-meta {
      font-size: 12px;
      color: @text-secondary;

      .separator {
        margin: 0 8px;
        color: #dcdfe6;
      }

      .record-date {
        color: #c0c4cc;
      }
    }
  }

  .record-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    margin-left: 16px;
  }
}

.is-mobile .record-item {
  flex-direction: column;
  align-items: stretch;

  .record-info {
    margin-bottom: 12px;

    .record-meta {
      .separator {
        margin: 0 4px;
      }
    }
  }

  .record-actions {
    justify-content: flex-end;
    margin-left: 0;
  }
}

.header-btns {
  display: flex;
  gap: 8px;
}
</style>
