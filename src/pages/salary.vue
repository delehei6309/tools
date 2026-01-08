<template>
  <el-config-provider :locale="locale">
    <div class="salary-container" :class="{ 'is-mobile': isMobile }">
      <!-- 登录页面 -->
      <div v-if="!isLoggedIn" class="login-page">
        <div class="login-card">
          <div class="login-icon">💰</div>
          <h1>工资欠款计算器</h1>
          <el-form @submit.prevent="handleLogin">
            <el-form-item>
              <el-input
                v-model="tokenInput"
                type="password"
                placeholder="请输入 GitHub Token"
                show-password
                size="large"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loginLoading"
                style="width: 100%"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
          <div class="login-tips">
            <p>Token 获取方式：</p>
            <p>GitHub → Settings → Developer settings</p>
            <p>→ Personal access tokens → Tokens (classic)</p>
            <p>勾选 <code>gist</code> 权限</p>
            <p v-if="isDev" class="dev-tip">开发环境可输入 <code>test123456</code> 跳过验证</p>
          </div>
        </div>
      </div>

      <!-- 主页面 -->
      <div v-else class="main-page">
        <!-- ==================== PC 端布局 ==================== -->
        <template v-if="!isMobile">
          <!-- PC 端顶部 -->
          <div class="header">
            <h1>
              💰 工资欠款计算器
              <span v-if="isDevMode" class="dev-badge">开发模式</span>
            </h1>
            <div class="header-actions">
              <el-button :icon="isMasked ? Hide : View" @click="toggleMask">
                {{ isMasked ? '显示金额' : '隐藏金额' }}
              </el-button>
              <el-button
                :icon="Download"
                :loading="syncLoading"
                :disabled="isDevMode"
                @click="syncFromCloud"
              >
                从云端同步
              </el-button>
              <el-button
                type="primary"
                :icon="Upload"
                :loading="syncLoading"
                :disabled="isDevMode"
                @click="syncToCloud"
              >
                同步到云端
              </el-button>
              <el-button type="danger" text @click="handleLogout">退出登录</el-button>
            </div>
          </div>

          <!-- PC 端同步状态 -->
          <div v-if="lastSyncTime" class="sync-status-pc">上次同步：{{ lastSyncTime }}</div>

          <!-- PC 端汇总卡片 -->
          <div class="summary-cards">
            <el-card class="summary-card">
              <div class="summary-label">总应发</div>
              <div class="summary-value">¥{{ formatAmount(totalDue) }}</div>
            </el-card>
            <el-card class="summary-card">
              <div class="summary-label">总实发</div>
              <div class="summary-value success">¥{{ formatAmount(totalPaid) }}</div>
            </el-card>
            <el-card class="summary-card">
              <div class="summary-label">总欠款</div>
              <div class="summary-value danger">¥{{ formatAmount(totalOwed) }}</div>
            </el-card>
            <el-card class="summary-card">
              <div class="summary-label">欠款月份</div>
              <div class="summary-value">{{ owedMonthsCount }} 个月</div>
            </el-card>
          </div>

          <!-- PC 端月度明细表格 -->
          <el-card class="data-card">
            <template #header>
              <div class="card-header">
                <span>📋 月度明细</span>
                <div class="header-btns">
                  <el-button type="primary" :icon="Share" @click="showPosterDialog">
                    生成海报
                  </el-button>
                </div>
              </div>
            </template>
            <el-table :data="monthlyDetails" stripe style="width: 100%">
              <el-table-column prop="month" label="月份" width="120" align="center" />
              <el-table-column prop="due" label="应发" align="right">
                <template #default="{ row }">¥{{ formatAmount(row.due) }}</template>
              </el-table-column>
              <el-table-column prop="paid" label="实发" align="right">
                <template #default="{ row }">
                  <span class="success">¥{{ formatAmount(row.paid) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="owed" label="欠款" align="right">
                <template #default="{ row }">
                  <span :class="row.owed > 0 ? 'danger' : 'success'">
                    {{ row.owed > 0 ? `¥${formatAmount(row.owed)}` : '0' }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- PC 端应发表格 -->
          <el-card class="data-card">
            <template #header>
              <div class="card-header">
                <span>📝 月度应发</span>
                <el-button type="primary" :icon="Plus" @click="showAddDueDialog">
                  添加应发
                </el-button>
              </div>
            </template>
            <el-table :data="monthlyDueList" stripe style="width: 100%">
              <el-table-column prop="month" label="月份" width="120" align="center" />
              <el-table-column prop="amount" label="应发金额" align="right">
                <template #default="{ row }">¥{{ formatAmount(row.amount) }}</template>
              </el-table-column>
              <el-table-column prop="note" label="备注" align="center" />
              <el-table-column label="创建时间" width="180" align="center">
                <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ row }">
                  <el-button
                    type="danger"
                    text
                    :icon="Delete"
                    @click="deleteDue(row.month)"
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- PC 端实发表格 -->
          <el-card class="data-card">
            <template #header>
              <div class="card-header">
                <span>💵 实发明细</span>
                <el-button type="primary" :icon="Plus" @click="showAddPaymentDialog">
                  添加实发
                </el-button>
              </div>
            </template>
            <el-table :data="paymentsList" stripe style="width: 100%">
              <el-table-column prop="date" label="到账日期" width="120" align="center" />
              <el-table-column prop="amount" label="金额" align="right">
                <template #default="{ row }">
                  <span class="success">¥{{ formatAmount(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="targetMonth" label="归属月份 " align="center">
                <template #default="{ row }">{{ row.targetMonth || '自动分配' }}</template>
              </el-table-column>
              <el-table-column prop="note" label="备注" align="center" />
              <el-table-column label="创建时间" width="180" align="center">
                <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="140" align="center">
                <template #default="{ row, $index }">
                  <el-button
                    type="primary"
                    text
                    :icon="Edit"
                    @click="showEditPaymentDialog(row, $index)"
                  ></el-button>
                  <el-button
                    type="danger"
                    text
                    :icon="Delete"
                    @click="deletePayment($index)"
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>

        <!-- ==================== 移动端布局 ==================== -->
        <template v-else>
          <!-- 移动端顶部栏 -->
          <div class="mobile-header">
            <div class="header-left">
              <span class="app-title">工资欠款</span>
              <span v-if="isDevMode" class="dev-badge">开发</span>
            </div>
            <div class="header-right">
              <div class="header-icon" @click="toggleMask">
                <el-icon><component :is="isMasked ? Hide : View" /></el-icon>
              </div>
              <div
                class="header-icon"
                :class="{ disabled: isDevMode }"
                @click="!isDevMode && syncFromCloud()"
              >
                <el-icon v-if="!syncLoading"><Download /></el-icon>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
              </div>
              <div
                class="header-icon"
                :class="{ disabled: isDevMode }"
                @click="!isDevMode && syncToCloud()"
              >
                <el-icon v-if="!syncLoading"><Upload /></el-icon>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
              </div>
              <div class="header-icon logout" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
              </div>
            </div>
          </div>

          <!-- 同步状态 -->
          <div v-if="lastSyncTime" class="sync-status">
            <el-icon><Clock /></el-icon>
            {{ formatShortDate(lastSyncTime) }}
          </div>

          <!-- 汇总区域 - 移动端优化 -->
          <div class="summary-section">
            <div class="summary-main">
              <div class="summary-main-label">总欠款</div>
              <div class="summary-main-value">¥{{ formatAmount(totalOwed) }}</div>
              <div class="summary-main-months">{{ owedMonthsCount }} 个月未结清</div>
            </div>
            <div class="summary-row">
              <div class="summary-item">
                <span class="label">应发</span>
                <span class="value">¥{{ formatAmount(totalDue) }}</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-item">
                <span class="label">实发</span>
                <span class="value success">¥{{ formatAmount(totalPaid) }}</span>
              </div>
            </div>
          </div>

          <!-- Tab 切换 -->
          <div class="tab-bar">
            <div
              class="tab-item"
              :class="{ active: activeTab === 'detail' }"
              @click="activeTab = 'detail'"
            >
              月度明细
            </div>
            <div
              class="tab-item"
              :class="{ active: activeTab === 'due' }"
              @click="activeTab = 'due'"
            >
              应发记录
            </div>
            <div
              class="tab-item"
              :class="{ active: activeTab === 'payment' }"
              @click="activeTab = 'payment'"
            >
              实发记录
            </div>
          </div>

          <!-- 月度明细列表 -->
          <div v-show="activeTab === 'detail'" class="list-section">
            <div class="list-header">
              <span>月度明细</span>
              <div class="poster-btn" @click="showPosterDialog">
                <el-icon><Share /></el-icon>
                <span>生成海报</span>
              </div>
            </div>
            <div v-if="monthlyDetails.length === 0" class="empty-state">
              <div class="empty-icon">📊</div>
              <div class="empty-text">暂无数据</div>
              <div class="empty-tip">请先添加月度应发记录</div>
            </div>
            <div v-else class="card-list">
              <div
                v-for="item in monthlyDetails"
                :key="item.month"
                class="detail-card"
                :class="{ 'is-owed': item.owed > 0, 'is-paid': item.owed <= 0 }"
              >
                <div class="card-left">
                  <div class="card-month">{{ item.month }}</div>
                  <div class="card-sub">应发 ¥{{ formatAmount(item.due) }}</div>
                </div>
                <div class="card-right">
                  <div class="card-status" :class="item.owed > 0 ? 'danger' : 'success'">
                    {{ item.owed > 0 ? `欠 ¥${formatAmount(item.owed)}` : '已付清' }}
                  </div>
                  <div class="card-paid">已付 ¥{{ formatAmount(item.paid) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 应发记录列表 -->
          <div v-show="activeTab === 'due'" class="list-section">
            <div class="list-header">
              <span>应发记录 ({{ monthlyDueList.length }})</span>
            </div>
            <div v-if="monthlyDueList.length === 0" class="empty-state">
              <div class="empty-icon">📝</div>
              <div class="empty-text">暂无应发记录</div>
              <div class="empty-tip">点击下方按钮添加</div>
            </div>
            <div v-else class="card-list">
              <div v-for="item in monthlyDueList" :key="item.month" class="record-card">
                <div class="card-content">
                  <div class="card-main">
                    <div class="card-title">{{ item.month }}</div>
                    <div class="card-amount">¥{{ formatAmount(item.amount) }}</div>
                  </div>
                  <div class="card-meta">
                    <span v-if="item.note" class="card-note">{{ item.note }}</span>
                    <span class="card-time">{{ formatShortDate(item.createdAt) }}</span>
                  </div>
                </div>
                <div class="card-action delete" @click="deleteDue(item.month)">
                  <el-icon><Delete /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- 实发记录列表 -->
          <div v-show="activeTab === 'payment'" class="list-section">
            <div class="list-header">
              <span>实发记录 ({{ paymentsList.length }})</span>
            </div>
            <div v-if="paymentsList.length === 0" class="empty-state">
              <div class="empty-icon">💵</div>
              <div class="empty-text">暂无实发记录</div>
              <div class="empty-tip">点击下方按钮添加</div>
            </div>
            <div v-else class="card-list">
              <div v-for="(item, index) in paymentsList" :key="index" class="record-card">
                <div class="card-content" @click="showEditPaymentDialog(item, index)">
                  <div class="card-main">
                    <div class="card-title">{{ item.date }}</div>
                    <div class="card-amount success">¥{{ formatAmount(item.amount) }}</div>
                  </div>
                  <div class="card-meta">
                    <span class="card-target">{{ item.targetMonth || '自动分配' }}</span>
                    <span v-if="item.note" class="card-note">{{ item.note }}</span>
                  </div>
                </div>
                <div class="card-action delete" @click="deletePayment(index)">
                  <el-icon><Delete /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部悬浮按钮 -->
          <div class="fab-container">
            <div v-if="activeTab === 'due'" class="fab" @click="showAddDueDialog">
              <el-icon><Plus /></el-icon>
              <span>添加应发</span>
            </div>
            <div v-if="activeTab === 'payment'" class="fab" @click="showAddPaymentDialog">
              <el-icon><Plus /></el-icon>
              <span>添加实发</span>
            </div>
          </div>
        </template>
      </div>

      <!-- 海报弹窗 -->
      <el-dialog
        v-model="posterVisible"
        title="分享海报"
        :width="isMobile ? '100%' : '420px'"
        :fullscreen="isMobile"
        :close-on-click-modal="false"
        class="poster-dialog"
      >
        <div class="poster-wrapper">
          <div ref="posterRef" class="poster">
            <!-- 海报头部 -->
            <div class="poster-header">
              <div class="poster-title">💰 工资欠款统计</div>
              <div class="poster-date">截至 {{ currentDate }}</div>
            </div>

            <!-- 图表区域 -->
            <div ref="posterChartRef" class="poster-chart"></div>

            <!-- 统计数据 -->
            <div class="poster-stats">
              <div class="stat-item">
                <div class="stat-label">总应发</div>
                <div class="stat-value">¥{{ formatAmount(totalDue) }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">总实发</div>
                <div class="stat-value success">¥{{ formatAmount(totalPaid) }}</div>
              </div>
              <div class="stat-item highlight">
                <div class="stat-label">总欠款</div>
                <div class="stat-value danger">¥{{ formatAmount(totalOwed) }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">欠款月份</div>
                <div class="stat-value">{{ owedMonthsCount }} 个月</div>
              </div>
            </div>

            <!-- 月度明细 -->
            <div class="poster-details">
              <div class="details-title">📋 月度明细</div>
              <div class="details-list">
                <div
                  v-for="item in monthlyDetails"
                  :key="item.month"
                  class="detail-row"
                  :class="{ 'is-owed': item.owed > 0 }"
                >
                  <span class="detail-month">{{ item.month }}</span>
                  <span class="detail-info"> 应发 ¥{{ formatAmount(item.due) }} </span>
                  <span class="detail-status" :class="item.owed > 0 ? 'danger' : 'success'">
                    {{ item.owed > 0 ? `欠 ¥${formatAmount(item.owed)}` : '✓ 已付清' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 海报底部 -->
            <div class="poster-footer">
              <div class="footer-tip">数据仅供参考，请以实际为准</div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="posterVisible = false">关闭</el-button>
          <el-button type="primary" :icon="Download" @click="downloadPoster">保存海报</el-button>
        </template>
      </el-dialog>

      <!-- 添加月度应发弹窗 -->
      <el-dialog
        v-model="addDueVisible"
        title="添加月度应发"
        :width="isMobile ? '90%' : '400px'"
        :show-close="true"
        class="mobile-dialog"
      >
        <el-form :model="dueForm" label-position="top">
          <el-form-item label="月份" required>
            <el-date-picker
              v-model="dueForm.month"
              type="month"
              placeholder="选择月份"
              format="YYYY-MM"
              value-format="YYYY-MM"
              style="width: 100%"
              size="large"
            />
          </el-form-item>
          <el-form-item label="应发金额" required>
            <el-input
              v-model="dueForm.amount"
              placeholder="请输入金额"
              size="large"
              inputmode="decimal"
              @input="handleAmountInput($event, 'due')"
            >
              <template #prefix>¥</template>
            </el-input>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="dueForm.note" placeholder="可选" size="large" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button size="large" @click="addDueVisible = false">取消</el-button>
            <el-button type="primary" size="large" @click="addDue">确定</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 添加/编辑实发明细弹窗 -->
      <el-dialog
        v-model="paymentDialogVisible"
        :title="isEditingPayment ? '编辑实发明细' : '添加实发明细'"
        :width="isMobile ? '90%' : '400px'"
        class="mobile-dialog"
      >
        <el-form :model="paymentForm" label-position="top">
          <el-form-item label="到账日期" required>
            <el-date-picker
              v-model="paymentForm.date"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              size="large"
            />
          </el-form-item>
          <el-form-item label="金额" required>
            <el-input
              v-model="paymentForm.amount"
              placeholder="请输入金额"
              size="large"
              inputmode="decimal"
              @input="handleAmountInput($event, 'payment')"
            >
              <template #prefix>¥</template>
            </el-input>
          </el-form-item>
          <el-form-item label="归属月份">
            <el-select
              v-model="paymentForm.targetMonth"
              placeholder="自动（按顺序补齐）"
              clearable
              style="width: 100%"
              size="large"
            >
              <el-option
                v-for="item in monthlyDueList"
                :key="item.month"
                :label="item.month"
                :value="item.month"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="paymentForm.note" placeholder="可选" size="large" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button size="large" @click="paymentDialogVisible = false">取消</el-button>
            <el-button type="primary" size="large" @click="savePayment">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox, ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import {
  View,
  Hide,
  Upload,
  Download,
  Plus,
  Delete,
  Edit,
  Share,
  SwitchButton,
  Clock,
  Loading,
} from '@element-plus/icons-vue';
import Big from 'big.js';
import * as echarts from 'echarts';
import html2canvas from 'html2canvas';

// ==================== 类型定义 ====================
interface MonthlyDue {
  month: string;
  amount: number;
  note: string;
  createdAt: string;
}

interface Payment {
  date: string;
  amount: number;
  targetMonth: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

interface MonthlyDetail {
  month: string;
  due: number;
  paid: number;
  owed: number;
}

interface SyncData {
  version: number;
  updatedAt: string;
  monthlyDue: MonthlyDue[];
  payments: Payment[];
}

// ==================== 状态 ====================
const STORAGE_KEY = 'salary-tracker-data';
const TOKEN_KEY = 'salary-tracker-token';
const GIST_ID_KEY = 'salary-tracker-gist-id';
const MASK_KEY = 'salary-tracker-mask';
const DEV_MODE_KEY = 'salary-tracker-dev-mode'; // 开发模式状态
const DEV_PASSWORD = 'test123456'; // 开发环境测试密码

// 中文语言包
const locale = zhCn;

// 判断是否为开发环境
const isDev = process.env.NODE_ENV !== 'production';
const isDevMode = ref(false); // 是否使用开发模式登录（无云同步功能）

const isLoggedIn = ref(false);
const loginLoading = ref(false);
const syncLoading = ref(false);
const tokenInput = ref('');
const githubToken = ref('');
const gistId = ref('');
const lastSyncTime = ref('');
const isMasked = ref(false);

const monthlyDueList = ref<MonthlyDue[]>([]);
const paymentsList = ref<Payment[]>([]);

// 海报相关
const posterVisible = ref(false);
const posterRef = ref<HTMLElement | null>(null);
const posterChartRef = ref<HTMLElement | null>(null);
let posterChartInstance: echarts.ECharts | null = null;

// 判断是否为移动端
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);

// 当前激活的 Tab
const activeTab = ref<'detail' | 'due' | 'payment'>('detail');

// 当前日期
const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
});

// 弹窗状态
const addDueVisible = ref(false);
const paymentDialogVisible = ref(false);
const isEditingPayment = ref(false);
const editingPaymentIndex = ref(-1);

const dueForm = ref({
  month: '',
  amount: '' as string | number,
  note: '',
});

const paymentForm = ref({
  date: '',
  amount: '' as string | number,
  targetMonth: null as string | null,
  note: '',
});

// ==================== 计算属性 ====================
const totalDue = computed(() => {
  return monthlyDueList.value.reduce((sum, item) => sum.plus(item.amount), new Big(0)).toNumber();
});

const totalPaid = computed(() => {
  return paymentsList.value.reduce((sum, item) => sum.plus(item.amount), new Big(0)).toNumber();
});

// 计算月度明细
const monthlyDetails = computed<MonthlyDetail[]>(() => {
  // 按月份排序
  const sortedDue = [...monthlyDueList.value].sort((a, b) => a.month.localeCompare(b.month));

  // 分离指定归属和未指定归属的支付
  const assignedPayments = paymentsList.value.filter((p) => p.targetMonth);
  const unassignedPayments = paymentsList.value.filter((p) => !p.targetMonth);

  // 计算每月已指定的支付总额
  const assignedByMonth: Record<string, Big> = {};
  assignedPayments.forEach((p) => {
    if (p.targetMonth) {
      assignedByMonth[p.targetMonth] = (assignedByMonth[p.targetMonth] || new Big(0)).plus(
        p.amount
      );
    }
  });

  // 资金池（未指定归属的支付总额）
  let pool = unassignedPayments.reduce((sum, p) => sum.plus(p.amount), new Big(0));

  // 计算每月明细
  const details: MonthlyDetail[] = [];

  for (const due of sortedDue) {
    const assigned = assignedByMonth[due.month] || new Big(0);
    let remaining = new Big(due.amount).minus(assigned);
    let fromPool = new Big(0);

    if (remaining.gt(0) && pool.gt(0)) {
      fromPool = remaining.lte(pool) ? remaining : pool;
      pool = pool.minus(fromPool);
      remaining = remaining.minus(fromPool);
    }

    details.push({
      month: due.month,
      due: due.amount,
      paid: assigned.plus(fromPool).toNumber(),
      owed: remaining.toNumber(),
    });
  }

  return details;
});

const totalOwed = computed(() => {
  return monthlyDetails.value
    .reduce((sum, item) => sum.plus(Math.max(item.owed, 0)), new Big(0))
    .toNumber();
});

const owedMonthsCount = computed(() => {
  return monthlyDetails.value.filter((item) => item.owed > 0).length;
});

// ==================== 方法 ====================

// 格式化金额
function formatAmount(amount: number): string {
  if (isMasked.value) {
    return '****';
  }
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 格式化日期时间（PC端用）
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date
    .toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(/\//g, '-');
}

// 格式化短日期（移动端用）
function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isThisYear) {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  }
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 显示海报弹窗
function showPosterDialog() {
  if (monthlyDetails.value.length === 0) {
    ElMessage.warning('暂无数据可生成海报');
    return;
  }
  posterVisible.value = true;
  nextTick(() => {
    initPosterChart();
  });
}

// 初始化海报中的图表
function initPosterChart() {
  if (!posterChartRef.value) return;

  if (posterChartInstance) {
    posterChartInstance.dispose();
  }
  posterChartInstance = echarts.init(posterChartRef.value);

  const option: echarts.EChartsOption = {
    tooltip: { show: false },
    legend: {
      orient: 'horizontal',
      bottom: 5,
      left: 'center',
      textStyle: { fontSize: 12 },
    },
    series: [
      {
        name: '工资状态',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: (params: unknown) => {
            const p = params as { name: string; value: number; percent: number };
            return `${p.name}\n${p.percent.toFixed(1)}%`;
          },
          fontSize: 11,
        },
        labelLine: {
          show: true,
          length: 8,
          length2: 8,
        },
        data: [
          {
            value: totalPaid.value,
            name: '已支付',
            itemStyle: { color: '#52c41a' },
          },
          {
            value: totalOwed.value,
            name: '欠款',
            itemStyle: { color: '#ff4d4f' },
          },
        ],
      },
    ],
  };

  posterChartInstance.setOption(option);
}

// 下载海报
async function downloadPoster() {
  if (!posterRef.value) return;

  try {
    ElMessage.info('正在生成海报...');

    const scale = 3; // 提高到3倍以获得更清晰的图像

    const canvas = await html2canvas(posterRef.value, {
      scale: scale,
      backgroundColor: null, // 透明背景，避免圆角外有白色
      useCORS: true,
      logging: false,
      allowTaint: true,
      imageTimeout: 0,
    });

    // 创建带圆角的新canvas
    const roundedCanvas = document.createElement('canvas');
    roundedCanvas.width = canvas.width;
    roundedCanvas.height = canvas.height;
    const ctx = roundedCanvas.getContext('2d');

    if (ctx) {
      const radius = 16 * scale; // 圆角半径也要乘以scale

      // 绘制圆角矩形路径
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(canvas.width - radius, 0);
      ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
      ctx.lineTo(canvas.width, canvas.height - radius);
      ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
      ctx.lineTo(radius, canvas.height);
      ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();

      // 将原canvas绘制到圆角canvas上
      ctx.drawImage(canvas, 0, 0);
    }

    const link = document.createElement('a');
    link.download = `工资欠款统计_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = roundedCanvas.toDataURL('image/png', 1.0);
    link.click();

    ElMessage.success('海报已保存');
  } catch (error) {
    console.error(error);
    ElMessage.error('生成海报失败');
  }
}

// 切换脱敏状态
function toggleMask() {
  isMasked.value = !isMasked.value;
  localStorage.setItem(MASK_KEY, String(isMasked.value));
}

// 金额输入校验：只允许数字和小数点，最多两位小数
function handleAmountInput(value: string, type: 'due' | 'payment') {
  // 移除非数字和小数点的字符
  let cleaned = value.replace(/[^\d.]/g, '');

  // 只保留第一个小数点
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // 限制小数点后最多两位
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + '.' + parts[1].slice(0, 2);
  }

  if (type === 'due') {
    dueForm.value.amount = cleaned;
  } else {
    paymentForm.value.amount = cleaned;
  }
}

// 保存数据到本地
function saveToLocal() {
  const data: SyncData = {
    version: 1,
    updatedAt: new Date().toISOString(),
    monthlyDue: monthlyDueList.value,
    payments: paymentsList.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 从本地加载数据
function loadFromLocal() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data: SyncData = JSON.parse(stored);
      monthlyDueList.value = data.monthlyDue || [];
      paymentsList.value = data.payments || [];
    } catch {
      console.error('Failed to parse local data');
    }
  }
}

// 验证 GitHub Token
async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// 查找云端已有的 Gist
async function findExistingGist(token: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (response.ok) {
      const gists = await response.json();
      // 查找包含 salary-tracker.json 的 Gist
      const found = gists.find(
        (g: { files: Record<string, unknown> }) => g.files && g.files['salary-tracker.json']
      );
      return found ? found.id : null;
    }
  } catch (error) {
    console.error('Failed to find existing gist:', error);
  }
  return null;
}

// 登录
async function handleLogin() {
  if (!tokenInput.value.trim()) {
    ElMessage.warning('请输入 GitHub Token');
    return;
  }

  // 开发环境：支持测试密码跳过 Token 验证
  if (isDev && tokenInput.value.trim() === DEV_PASSWORD) {
    isDevMode.value = true;
    isLoggedIn.value = true;
    localStorage.setItem(DEV_MODE_KEY, 'true'); // 保存开发模式状态
    tokenInput.value = '';
    loadFromLocal();
    ElMessage.success('开发模式登录成功（云同步不可用）');
    return;
  }

  loginLoading.value = true;
  const valid = await verifyToken(tokenInput.value.trim());
  loginLoading.value = false;

  if (valid) {
    githubToken.value = tokenInput.value.trim();
    localStorage.setItem(TOKEN_KEY, githubToken.value);
    isLoggedIn.value = true;
    isDevMode.value = false;
    tokenInput.value = '';
    loadFromLocal();

    // 尝试从云端同步：优先使用本地存储的 gistId，否则自动查找
    let storedGistId = localStorage.getItem(GIST_ID_KEY);
    if (!storedGistId) {
      // 自动查找云端已有的 Gist
      storedGistId = await findExistingGist(githubToken.value);
      if (storedGistId) {
        gistId.value = storedGistId;
        localStorage.setItem(GIST_ID_KEY, storedGistId);
      }
    } else {
      gistId.value = storedGistId;
    }

    if (gistId.value) {
      await syncFromCloud();
    }

    ElMessage.success('登录成功');
  } else {
    ElMessage.error('Token 无效，请检查后重试');
  }
}

// 退出登录
function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(DEV_MODE_KEY); // 清除开发模式状态
      isLoggedIn.value = false;
      isDevMode.value = false;
      githubToken.value = '';
      ElMessage.success('已退出登录');
    })
    .catch(() => {});
}

// 同步到云端
async function syncToCloud() {
  if (!githubToken.value) {
    ElMessage.warning('请先登录');
    return;
  }

  syncLoading.value = true;

  const data: SyncData = {
    version: 1,
    updatedAt: new Date().toISOString(),
    monthlyDue: monthlyDueList.value,
    payments: paymentsList.value,
  };

  try {
    let response;
    const content = JSON.stringify(data, null, 2);

    if (gistId.value) {
      // 更新现有 Gist
      response = await fetch(`https://api.github.com/gists/${gistId.value}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${githubToken.value}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'salary-tracker.json': { content },
          },
        }),
      });
    } else {
      // 创建新 Gist
      response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken.value}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: '工资欠款计算器数据',
          public: false,
          files: {
            'salary-tracker.json': { content },
          },
        }),
      });
    }

    if (response.ok) {
      const result = await response.json();
      gistId.value = result.id;
      localStorage.setItem(GIST_ID_KEY, gistId.value);
      lastSyncTime.value = new Date().toISOString();
      ElMessage.success('同步成功');
    } else {
      throw new Error('Sync failed');
    }
  } catch (error) {
    ElMessage.error('同步失败，请稍后重试');
    console.error(error);
  } finally {
    syncLoading.value = false;
  }
}

// 从云端同步
async function syncFromCloud() {
  if (!githubToken.value || !gistId.value) {
    ElMessage.info('没有云端数据可同步');
    return;
  }

  syncLoading.value = true;

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId.value}`, {
      headers: {
        Authorization: `Bearer ${githubToken.value}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      const fileContent = result.files['salary-tracker.json']?.content;

      if (fileContent) {
        const data: SyncData = JSON.parse(fileContent);
        monthlyDueList.value = data.monthlyDue || [];
        paymentsList.value = data.payments || [];
        saveToLocal();
        lastSyncTime.value = new Date().toISOString();
        ElMessage.success('同步成功');
      }
    } else {
      throw new Error('Sync failed');
    }
  } catch (error) {
    ElMessage.error('同步失败，请稍后重试');
    console.error(error);
  } finally {
    syncLoading.value = false;
  }
}

// 添加月度应发
function showAddDueDialog() {
  dueForm.value = { month: '', amount: '', note: '' };
  addDueVisible.value = true;
}

function addDue() {
  if (!dueForm.value.month) {
    ElMessage.warning('请选择月份');
    return;
  }
  const amount = parseFloat(String(dueForm.value.amount));
  if (isNaN(amount) || amount <= 0) {
    ElMessage.warning('请输入有效金额');
    return;
  }
  if (monthlyDueList.value.some((item) => item.month === dueForm.value.month)) {
    ElMessage.warning('该月份已存在');
    return;
  }

  monthlyDueList.value.push({
    month: dueForm.value.month,
    amount: amount,
    note: dueForm.value.note,
    createdAt: new Date().toISOString(),
  });

  // 按月份倒序排序
  monthlyDueList.value.sort((a, b) => b.month.localeCompare(a.month));

  addDueVisible.value = false;
  saveToLocal();
  ElMessage.success('添加成功');
}

function deleteDue(month: string) {
  ElMessageBox.confirm(`确定要删除 ${month} 的应发记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      monthlyDueList.value = monthlyDueList.value.filter((item) => item.month !== month);
      saveToLocal();
      ElMessage.success('删除成功');
    })
    .catch(() => {});
}

// 实发明细
function showAddPaymentDialog() {
  paymentForm.value = { date: '', amount: '', targetMonth: null, note: '' };
  isEditingPayment.value = false;
  paymentDialogVisible.value = true;
}

function showEditPaymentDialog(payment: Payment, index: number) {
  paymentForm.value = {
    date: payment.date,
    amount: payment.amount,
    targetMonth: payment.targetMonth,
    note: payment.note,
  };
  isEditingPayment.value = true;
  editingPaymentIndex.value = index;
  paymentDialogVisible.value = true;
}

function savePayment() {
  if (!paymentForm.value.date) {
    ElMessage.warning('请选择到账日期');
    return;
  }
  const amount = parseFloat(String(paymentForm.value.amount));
  if (isNaN(amount) || amount <= 0) {
    ElMessage.warning('请输入有效金额');
    return;
  }

  const now = new Date().toISOString();

  if (isEditingPayment.value) {
    // 编辑
    const payment = paymentsList.value[editingPaymentIndex.value];
    payment.date = paymentForm.value.date;
    payment.amount = amount;
    payment.targetMonth = paymentForm.value.targetMonth;
    payment.note = paymentForm.value.note;
    payment.updatedAt = now;
  } else {
    // 新增
    paymentsList.value.push({
      date: paymentForm.value.date,
      amount: amount,
      targetMonth: paymentForm.value.targetMonth,
      note: paymentForm.value.note,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 按日期倒序排序
  paymentsList.value.sort((a, b) => b.date.localeCompare(a.date));

  paymentDialogVisible.value = false;
  saveToLocal();
  ElMessage.success(isEditingPayment.value ? '修改成功' : '添加成功');
}

function deletePayment(index: number) {
  ElMessageBox.confirm('确定要删除这条实发记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      paymentsList.value.splice(index, 1);
      saveToLocal();
      ElMessage.success('删除成功');
    })
    .catch(() => {});
}

// ==================== 生命周期 ====================
onMounted(async () => {
  // 恢复脱敏状态
  const maskedState = localStorage.getItem(MASK_KEY);
  if (maskedState === 'true') {
    isMasked.value = true;
  }

  // 检查开发模式登录状态
  const storedDevMode = localStorage.getItem(DEV_MODE_KEY);
  if (isDev && storedDevMode === 'true') {
    isDevMode.value = true;
    isLoggedIn.value = true;
    loadFromLocal();
    return;
  }

  // 检查 GitHub Token 登录状态
  const storedToken = localStorage.getItem(TOKEN_KEY);
  if (storedToken) {
    loginLoading.value = true;
    const valid = await verifyToken(storedToken);
    loginLoading.value = false;

    if (valid) {
      githubToken.value = storedToken;
      isLoggedIn.value = true;
      loadFromLocal();

      // 恢复 Gist ID
      const storedGistId = localStorage.getItem(GIST_ID_KEY);
      if (storedGistId) {
        gistId.value = storedGistId;
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
});

// 窗口大小变化监听
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  posterChartInstance?.dispose();
  posterChartInstance = null;
});

// 数据变化时自动保存
watch(
  [monthlyDueList, paymentsList],
  () => {
    if (isLoggedIn.value) {
      saveToLocal();
    }
  },
  { deep: true }
);
</script>
<style>
body {
  margin: 0;
}
</style>
<style scoped lang="less">
// ==================== 基础样式 ====================
.salary-container {
  min-height: 100vh;
  background: #f5f7fa;

  &.is-mobile {
    background: #f0f2f5;
  }
}

// ==================== 登录页面 ====================
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

// 移动端登录页渐变背景
.is-mobile .login-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: #fff;
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;

  .login-icon {
    text-align: center;
    font-size: 48px;
    margin-bottom: 10px;
  }

  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #303133;
    font-size: 22px;
  }
}

.is-mobile .login-card {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.login-tips {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;

  p {
    margin: 4px 0;
  }

  code {
    background: #e4e7ed;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
  }

  .dev-tip {
    margin-top: 10px;
    color: #e6a23c;
  }
}

// ==================== PC 端主页面 ====================
.main-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.is-mobile .main-page {
  padding: 0;
  padding-bottom: 100px;
}

// PC 端顶部
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h1 {
    margin: 0;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.sync-status-pc {
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-bottom: 15px;
}

// PC 端汇总卡片
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.summary-card {
  text-align: center;

  .summary-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }

  .summary-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;

    &.danger {
      color: #f56c6c;
    }

    &.success {
      color: #67c23a;
    }
  }
}

// PC 端数据卡片
.data-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-btns {
    display: flex;
    gap: 10px;
  }
}

.dev-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: #e6a23c;
  color: #fff;
  border-radius: 4px;
  font-weight: normal;
}

// ==================== 移动端主页面 ====================
// 移动端顶部栏
.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .app-title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .header-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    cursor: pointer;
    transition: background 0.2s;

    &:active {
      background: rgba(255, 255, 255, 0.3);
    }

    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    &.logout {
      background: rgba(255, 100, 100, 0.3);
    }

    .el-icon {
      font-size: 18px;
    }

    .is-loading {
      animation: rotate 1s linear infinite;
    }
  }
}

// 移动端开发标记
.is-mobile .dev-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-weight: normal;
}

// 移动端同步状态
.sync-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: #909399;
  padding: 6px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

// ==================== 汇总区域 ====================
.summary-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 16px;
  color: #fff;
}

.summary-main {
  text-align: center;
  margin-bottom: 20px;

  .summary-main-label {
    font-size: 14px;
    opacity: 0.85;
    margin-bottom: 4px;
  }

  .summary-main-value {
    font-size: 42px;
    font-weight: 700;
    letter-spacing: -1px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }

  .summary-main-months {
    font-size: 13px;
    opacity: 0.8;
    margin-top: 4px;
  }
}

.summary-row {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px 0;

  .summary-item {
    flex: 1;
    text-align: center;

    .label {
      display: block;
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 4px;
    }

    .value {
      font-size: 18px;
      font-weight: 600;

      &.success {
        color: #6ee7b7;
      }
    }
  }

  .summary-divider {
    width: 1px;
    height: 30px;
    background: rgba(255, 255, 255, 0.3);
  }
}

// ==================== Tab 栏 ====================
.tab-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 60px;
  z-index: 99;

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 14px 0;
    font-size: 14px;
    color: #606266;
    position: relative;
    cursor: pointer;
    transition: color 0.2s;

    &.active {
      color: #667eea;
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 3px;
        background: #667eea;
        border-radius: 2px;
      }
    }
  }
}

// ==================== 列表区域 ====================
.list-section {
  padding: 12px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px 12px;

  span {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
  }
}

// 生成海报按钮
.poster-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  span {
    color: #fff;
  }

  &:active {
    transform: scale(0.95);
  }

  .el-icon {
    font-size: 14px;
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px 20px;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 16px;
    color: #606266;
    margin-bottom: 8px;
  }

  .empty-tip {
    font-size: 13px;
    color: #909399;
  }
}

// 卡片列表
.card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// 月度明细卡片
.detail-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &.is-owed {
    border-left: 4px solid #f56c6c;
  }

  &.is-paid {
    border-left: 4px solid #67c23a;
  }

  .card-left {
    .card-month {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .card-sub {
      font-size: 12px;
      color: #909399;
    }
  }

  .card-right {
    text-align: right;

    .card-status {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;

      &.danger {
        color: #f56c6c;
      }

      &.success {
        color: #67c23a;
      }
    }

    .card-paid {
      font-size: 12px;
      color: #909399;
    }
  }
}

// 记录卡片（应发/实发）
.record-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .card-content {
    flex: 1;
    padding: 14px 16px;
    cursor: pointer;

    &:active {
      background: #f9f9f9;
    }
  }

  .card-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;

    .card-title {
      font-size: 15px;
      font-weight: 500;
      color: #303133;
    }

    .card-amount {
      font-size: 17px;
      font-weight: 600;
      color: #303133;

      &.success {
        color: #67c23a;
      }
    }
  }

  .card-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #909399;

    .card-target {
      color: #667eea;
    }
  }

  .card-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    color: #fff;
    cursor: pointer;

    &.delete {
      background: #f56c6c;
    }

    .el-icon {
      font-size: 18px;
    }
  }
}

// ==================== 悬浮按钮 ====================
.fab-container {
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 100;
}

.fab {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 14px 28px;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:active {
    transform: scale(0.95);
  }

  .el-icon {
    font-size: 18px;
  }
}

// ==================== 弹窗样式 ====================
.mobile-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 20px;
    border-top: 1px solid #f0f0f0;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;

    .el-button {
      flex: 1;
    }
  }
}

// ==================== 海报弹窗 ====================
.poster-dialog {
  :deep(.el-dialog) {
    margin: 0 auto;
    border-radius: 16px;
  }

  :deep(.el-dialog__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 15px;
    max-height: calc(100vh - 140px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 20px;
    border-top: 1px solid #eee;
  }
}

.poster-wrapper {
  display: flex;
  justify-content: center;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  min-height: 200px;
}

.poster {
  width: 100%;
  max-width: 375px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
}

.poster-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  .poster-title {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 8px 0;
    letter-spacing: 1px;
  }

  .poster-date {
    font-size: 12px;
    opacity: 0.8;
  }
}

.poster-chart {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
  height: 180px;
}

.poster-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 12px 10px;
  text-align: center;

  .stat-value {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 11px;
    opacity: 0.85;
  }
}

.poster-details {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;

  .details-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .details-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;

    .detail-month {
      flex: 0 0 60px;
      opacity: 0.9;
    }

    .detail-info {
      flex: 1;
      text-align: center;
    }

    .detail-status {
      flex: 0 0 80px;
      text-align: right;

      &.success {
        color: #6ee7b7;
      }

      &.danger {
        color: #fca5a5;
      }
    }
  }
}

.poster-footer {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);

  .footer-tip {
    font-size: 11px;
    opacity: 0.7;
  }
}

// ==================== 通用样式 ====================
.danger {
  color: #f56c6c;
}

.success {
  color: #67c23a;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
