<template>
  <div class="car-anatomy-page">
    <!-- 顶部标题栏 -->
    <header class="page-header">
      <div class="header-left">
        <h1>
          <el-icon><Van /></el-icon>
          汽车解剖图
        </h1>
      </div>
      <div class="header-right">
        <el-tag v-if="isModelLoading" type="warning" size="small">
          <el-icon class="is-loading"><Loading /></el-icon>
          模型加载中...
        </el-tag>
        <span class="subtitle">探索汽车内部结构</span>
      </div>
    </header>

    <!-- 主内容区：左侧边栏 + 右侧画布 -->
    <div class="main-content">
      <!-- 左侧控制面板 -->
      <aside class="sidebar">
        <!-- 模型选择 -->
        <div class="panel-section">
          <div class="section-header">
            <el-icon><Van /></el-icon>
            <span>模型选择</span>
          </div>
          <div class="model-list">
            <div
              v-for="model in LOCAL_CAR_MODELS"
              :key="model.id"
              class="model-item"
              :class="{ active: selectedModelId === model.id }"
              @click="selectModel(model.id)"
            >
              <span class="model-icon">{{ model.thumbnail }}</span>
              <span class="model-name">{{ model.name }}</span>
              <el-icon v-if="selectedModelId === model.id" class="check"><Check /></el-icon>
            </div>
          </div>
          <!-- 自定义路径 -->
          <el-input
            v-model="modelUrlInput"
            placeholder="自定义模型路径"
            size="small"
            clearable
            @keyup.enter="loadCustomModel"
          >
            <template #append>
              <el-button size="small" @click="loadCustomModel">
                <el-icon><Upload /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 视图控制 -->
        <div class="panel-section">
          <div class="section-header">
            <el-icon><Setting /></el-icon>
            <span>视图控制</span>
          </div>
          <div class="view-controls">
            <el-radio-group v-model="viewMode" size="small" @change="handleViewModeChange">
              <el-radio-button value="assembled">
                <el-icon><Box /></el-icon>
                组装
              </el-radio-button>
              <el-radio-button value="exploded">
                <el-icon><Expand /></el-icon>
                分解
              </el-radio-button>
            </el-radio-group>
            <el-button size="small" :icon="RefreshLeft" @click="handleResetCamera">
              重置视角
            </el-button>
          </div>
        </div>

        <!-- 部件筛选 -->
        <div class="panel-section">
          <div class="section-header">
            <el-icon><Filter /></el-icon>
            <span>部件筛选</span>
          </div>
          <div class="category-list">
            <div
              v-for="(label, key) in CATEGORY_LABELS"
              :key="key"
              class="category-item"
              :class="{ active: highlightCategory === key }"
              @click="handleCategoryChange(key as CarPartCategory)"
            >
              <span class="category-dot" :style="{ background: getCategoryColor(key) }"></span>
              <span class="category-label">{{ label }}</span>
            </div>
            <div
              class="category-item clear-item"
              :class="{ active: highlightCategory === null }"
              @click="handleCategoryChange(null)"
            >
              <span class="category-label">全部</span>
            </div>
          </div>
        </div>

        <!-- 部件信息 -->
        <div class="panel-section part-info-section">
          <div class="section-header">
            <el-icon><InfoFilled /></el-icon>
            <span>部件信息</span>
          </div>
          <div v-if="selectedPart" class="part-info">
            <div class="part-name">{{ selectedPart.name }}</div>
            <el-tag
              size="small"
              :style="{
                background: getCategoryColor(selectedPart.category),
                color: '#fff',
                border: 'none',
              }"
            >
              {{ CATEGORY_LABELS[selectedPart.category] }}
            </el-tag>
            <p class="part-desc">{{ selectedPart.description }}</p>
          </div>
          <div v-else class="no-selection">
            <el-icon><Pointer /></el-icon>
            <span>点击部件查看详情</span>
          </div>
        </div>

        <!-- 操作提示（折叠） -->
        <el-collapse class="tips-collapse">
          <el-collapse-item title="操作提示" name="tips">
            <ul class="tips-list">
              <li>🖱️ 左键拖拽旋转</li>
              <li>🔍 滚轮缩放</li>
              <li>👆 点击查看详情</li>
              <li>💥 分解模式展开部件</li>
            </ul>
          </el-collapse-item>
        </el-collapse>
      </aside>

      <!-- 右侧 3D 画布 -->
      <main class="canvas-area">
        <ThreeCanvas
          ref="threeCanvasRef"
          :view-mode="viewMode"
          :highlight-category="highlightCategory"
          :model-url="currentModelUrl"
          @part-select="handlePartSelect"
          @model-loaded="handleModelLoaded"
        />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import {
  Van,
  Check,
  Upload,
  Setting,
  Box,
  Expand,
  RefreshLeft,
  Filter,
  InfoFilled,
  Pointer,
  Loading,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ThreeCanvas from '@/components/car-anatomy/ThreeCanvas.vue';
import type { CarPart, ViewMode, CarPartCategory } from '@/types/car-anatomy';
import { CATEGORY_LABELS } from '@/types/car-anatomy';
import { CATEGORY_COLORS, LOCAL_CAR_MODELS } from '@/utils/car-anatomy/constants';
import '@/style/global.css';

// 状态
const viewMode = ref<ViewMode>('assembled');
const highlightCategory = ref<CarPartCategory | null>(null);
const selectedPart = ref<CarPart | null>(null);
const threeCanvasRef = ref<InstanceType<typeof ThreeCanvas> | null>(null);
const modelUrlInput = ref('');
const currentModelUrl = ref('');
const selectedModelId = ref('sketchfab-car');
const isModelLoading = ref(false);

// 页面加载时自动选择已有模型
onMounted(() => {
  const defaultModel = LOCAL_CAR_MODELS.find((m) => m.id === 'sketchfab-car');
  if (defaultModel) {
    currentModelUrl.value = defaultModel.path;
    modelUrlInput.value = defaultModel.path;
  }
});

// 事件处理
const handleViewModeChange = (val: string | number | boolean | undefined) => {
  if (val === 'assembled' || val === 'exploded') {
    viewMode.value = val as ViewMode;
  }
};

const handleCategoryChange = (category: CarPartCategory | null) => {
  highlightCategory.value = category === highlightCategory.value ? null : category;
};

const handlePartSelect = (part: CarPart | null) => {
  selectedPart.value = part;
};

const handleResetCamera = () => {
  threeCanvasRef.value?.resetCamera();
};

const handleModelLoaded = () => {
  isModelLoading.value = false;
  ElMessage.success('模型加载成功！');
};

// 加载自定义模型
const loadCustomModel = () => {
  if (!modelUrlInput.value.trim()) {
    ElMessage.warning('请输入模型路径');
    return;
  }
  isModelLoading.value = true;
  currentModelUrl.value = modelUrlInput.value.trim();
  selectedModelId.value = '';
};

// 选择预设模型
const selectModel = (modelId: string) => {
  const model = LOCAL_CAR_MODELS.find((m) => m.id === modelId);
  if (!model) return;

  selectedModelId.value = modelId;
  isModelLoading.value = true;
  currentModelUrl.value = model.path;
  modelUrlInput.value = model.path;
};

// 获取分类颜色
const getCategoryColor = (category: string) => {
  const color = CATEGORY_COLORS[category] || 0x4a90d9;
  return `#${color.toString(16).padStart(6, '0')}`;
};
</script>

<style lang="less" scoped>
.car-anatomy-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;
}

// 顶部标题栏
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  .header-left h1 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: #fff;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .subtitle {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

// 主内容区
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// 左侧边栏
.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}

.panel-section {
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;

  .el-icon {
    color: #409eff;
  }
}

// 模型列表
.model-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.model-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: #f5f7fa;
  }

  &.active {
    background: #e1f3d8;
    border-color: #67c23a;
  }

  .model-icon {
    font-size: 20px;
  }

  .model-name {
    flex: 1;
    font-size: 13px;
    color: #303133;
  }

  .check {
    color: #67c23a;
  }
}

// 视图控制
.view-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;

  :deep(.el-radio-group) {
    width: 100%;
  }

  :deep(.el-radio-button) {
    flex: 1;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .el-button {
    width: 100%;
  }
}

// 部件分类
.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  border: 1px solid #e4e7ed;

  &:hover {
    border-color: #409eff;
    background: #ecf5ff;
  }

  &.active {
    background: #409eff;
    border-color: #409eff;
    color: #fff;

    .category-dot {
      box-shadow: 0 0 0 2px #fff;
    }
  }

  &.clear-item {
    background: #f5f7fa;

    &.active {
      background: #909399;
      border-color: #909399;
    }
  }
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.category-label {
  white-space: nowrap;
}

// 部件信息
.part-info-section {
  flex: 1;
  min-height: 120px;
}

.part-info {
  .part-name {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .part-desc {
    margin: 10px 0 0;
    font-size: 12px;
    color: #606266;
    line-height: 1.6;
  }
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #909399;
  font-size: 13px;

  .el-icon {
    font-size: 28px;
  }
}

// 操作提示折叠
.tips-collapse {
  border: none;

  :deep(.el-collapse-item__header) {
    padding: 0 16px;
    height: 40px;
    font-size: 13px;
    background: #f5f7fa;
    border: none;
  }

  :deep(.el-collapse-item__wrap) {
    border: none;
  }

  :deep(.el-collapse-item__content) {
    padding: 0;
  }
}

.tips-list {
  margin: 0;
  padding: 12px 16px;
  list-style: none;
  background: #fafafa;

  li {
    font-size: 12px;
    color: #606266;
    padding: 4px 0;
  }
}

// 右侧画布区域
.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

// 响应式
@media (max-width: 900px) {
  .sidebar {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 40vh;
    flex-direction: row;
    flex-wrap: wrap;
    overflow-x: auto;

    .panel-section {
      flex: 1;
      min-width: 200px;
      border-bottom: none;
      border-right: 1px solid #ebeef5;
    }
  }

  .canvas-area {
    min-height: 50vh;
  }
}
</style>
