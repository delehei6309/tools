<template>
  <div class="control-panel">
    <!-- 视图模式切换 -->
    <div class="control-section">
      <span class="section-label">视图模式</span>
      <el-radio-group v-model="viewMode" @change="handleViewModeChange">
        <el-radio-button value="assembled">
          <el-icon><Box /></el-icon>
          组装
        </el-radio-button>
        <el-radio-button value="exploded">
          <el-icon><Expand /></el-icon>
          分解
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 部件分类筛选 -->
    <div class="control-section">
      <span class="section-label">部件筛选</span>
      <el-select
        v-model="selectedCategory"
        placeholder="全部部件"
        clearable
        @change="handleCategoryChange"
      >
        <el-option v-for="(label, key) in CATEGORY_LABELS" :key="key" :label="label" :value="key">
          <span class="category-option">
            <span class="color-dot" :style="{ background: getCategoryColor(key) }"></span>
            {{ label }}
          </span>
        </el-option>
      </el-select>
    </div>

    <!-- 操作按钮 -->
    <div class="control-section">
      <el-button :icon="RefreshLeft" @click="$emit('reset-camera')">重置视角</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Box, Expand, RefreshLeft } from '@element-plus/icons-vue';
import type { ViewMode, CarPartCategory } from '@/types/car-anatomy';
import { CATEGORY_LABELS } from '@/types/car-anatomy';
import { CATEGORY_COLORS } from '@/utils/car-anatomy/constants';

const emit = defineEmits<{
  (e: 'view-mode-change', mode: ViewMode): void;
  (e: 'category-change', category: CarPartCategory | null): void;
  (e: 'reset-camera'): void;
}>();

const viewMode = ref<ViewMode>('assembled');
const selectedCategory = ref<CarPartCategory | null>(null);

const handleViewModeChange = (val: string | number | boolean | undefined) => {
  if (val === 'assembled' || val === 'exploded') {
    emit('view-mode-change', val as ViewMode);
  }
};

const handleCategoryChange = (category: CarPartCategory | null) => {
  emit('category-change', category);
};

const getCategoryColor = (category: string) => {
  const color = CATEGORY_COLORS[category] || 0x4a90d9;
  return `#${color.toString(16).padStart(6, '0')}`;
};
</script>

<style lang="less" scoped>
.control-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.control-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.category-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

:deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
