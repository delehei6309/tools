<template>
  <div class="part-info-panel" :class="{ 'has-part': selectedPart }">
    <div v-if="selectedPart" class="part-content">
      <div class="part-header">
        <el-tag :type="getCategoryTagType(selectedPart.category)" size="small">
          {{ CATEGORY_LABELS[selectedPart.category] }}
        </el-tag>
        <h3 class="part-name">{{ selectedPart.name }}</h3>
      </div>
      <el-divider />
      <div class="part-description">
        <el-icon><InfoFilled /></el-icon>
        <p>{{ selectedPart.description }}</p>
      </div>
    </div>
    <div v-else class="empty-state">
      <el-icon :size="48"><CaretRight /></el-icon>
      <p>点击汽车部件查看详细信息</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { InfoFilled, CaretRight } from '@element-plus/icons-vue';
import type { CarPart, CarPartCategory } from '@/types/car-anatomy';
import { CATEGORY_LABELS } from '@/types/car-anatomy';

defineProps<{
  selectedPart: CarPart | null;
}>();

const getCategoryTagType = (category: CarPartCategory) => {
  const typeMap: Record<CarPartCategory, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    body: 'primary',
    engine: 'danger',
    chassis: 'info',
    interior: 'warning',
    wheel: 'success',
  };
  return typeMap[category] || 'primary';
};
</script>

<style lang="less" scoped>
.part-info-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  min-height: 200px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  &.has-part {
    background: #fff;
  }
}

.part-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.part-header {
  .part-name {
    margin: 12px 0 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }
}

.part-description {
  display: flex;
  gap: 12px;
  color: #606266;

  .el-icon {
    flex-shrink: 0;
    margin-top: 2px;
    color: #409eff;
  }

  p {
    margin: 0;
    line-height: 1.6;
    text-align: justify;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: #909399;

  .el-icon {
    margin-bottom: 12px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
