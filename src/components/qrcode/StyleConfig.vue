<template>
  <div class="style-config">
    <el-divider content-position="left">
      <el-icon><Brush /></el-icon>
      样式配置
    </el-divider>

    <el-form-item label="二维码尺寸">
      <div style="display: flex; align-items: center; gap: 12px">
        <el-input-number
          :model-value="size"
          :min="80"
          :max="400"
          :step="10"
          :step-strictly="true"
          controls-position="right"
          style="width: 150px"
          @update:model-value="emit('update:size', $event)"
        />
        <span style="color: #909399; font-size: 14px">像素</span>
      </div>
    </el-form-item>

    <el-form-item label="颜色设置">
      <div class="color-picker-group">
        <div class="color-item">
          <span>码颜色</span>
          <el-color-picker
            :model-value="codeColor"
            @update:model-value="emit('update:codeColor', $event)"
          />
        </div>
        <div class="color-item">
          <span>背景色</span>
          <el-color-picker
            :model-value="backgroundColor"
            @update:model-value="emit('update:backgroundColor', $event)"
          />
        </div>
      </div>
    </el-form-item>
  </div>
</template>

<script lang="ts" setup>
import { Brush } from '@element-plus/icons-vue';

defineProps<{
  size: number;
  codeColor: string;
  backgroundColor: string;
}>();

const emit = defineEmits<{
  'update:size': [value: number | undefined];
  'update:codeColor': [value: string | null];
  'update:backgroundColor': [value: string | null];
}>();
</script>

<style scoped lang="less">
.style-config {
  .color-picker-group {
    display: flex;
    gap: 24px;
    align-items: center;

    .color-item {
      display: flex;
      align-items: center;
      gap: 8px;

      span {
        font-size: 14px;
        color: #606266;
      }
    }
  }

  @media (max-width: 768px) {
    .color-picker-group {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
  }
}
</style>
