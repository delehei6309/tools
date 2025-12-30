<template>
  <div class="logo-config">
    <el-divider content-position="left">
      <el-icon><Picture /></el-icon>
      Logo 配置
    </el-divider>

    <el-card shadow="never" class="logo-config-card">
      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        accept="image/png,image/jpeg,image/jpg"
        :on-change="handleLogoUpload"
        class="logo-upload"
      >
        <el-button :icon="Upload" type="primary" plain size="small">
          {{ logoImage ? '更换图片' : '上传 Logo' }}
        </el-button>
        <template #tip>
          <div class="upload-tip">支持 PNG/JPG，不超过 2MB</div>
        </template>
      </el-upload>

      <div v-if="logoImage" class="logo-preview-section">
        <div class="logo-preview">
          <img :src="logoImage" alt="Logo" />
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            circle
            class="delete-btn"
            @click="emit('remove-logo')"
          ></el-button>
        </div>

        <div class="logo-size-control">
          <span class="label">大小</span>
          <el-slider
            :model-value="logoSize"
            :min="15"
            :max="30"
            :step="1"
            show-stops
            @update:model-value="emit('update:logoSize', $event)"
          />
          <span class="value">{{ logoSize }}%</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { Picture, Upload, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { UploadProps } from 'element-plus';

defineProps<{
  logoImage: string;
  logoSize: number;
}>();

const emit = defineEmits<{
  'update:logoImage': [value: string];
  'update:logoSize': [value: number];
  'remove-logo': [];
}>();

// Logo 上传处理
const handleLogoUpload: UploadProps['onChange'] = (file) => {
  const rawFile = file.raw;
  if (!rawFile) return;

  // 验证文件类型
  const isImage = rawFile.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件！');
    return;
  }

  // 验证文件大小 (2MB)
  const isLt2M = rawFile.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！');
    return;
  }

  // 转换为 base64
  const reader = new FileReader();
  reader.onload = (e) => {
    emit('update:logoImage', e.target?.result as string);
  };
  reader.readAsDataURL(rawFile);
};
</script>

<style scoped lang="less">
.logo-config {
  .logo-config-card {
    background: #fafafa;
    border: 1px dashed #dcdfe6;

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .logo-upload {
    :deep(.el-upload) {
      width: 100%;
    }

    .upload-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
      line-height: 1.5;
    }
  }

  .logo-preview-section {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .logo-preview {
    position: relative;
    display: inline-block;
    padding: 8px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    align-self: flex-start;

    img {
      display: block;
      width: 80px;
      height: 80px;
      object-fit: contain;
      border-radius: 4px;
    }

    .delete-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      z-index: 10;
    }
  }

  .logo-size-control {
    display: flex;
    align-items: center;
    gap: 12px;

    .label {
      font-size: 14px;
      color: #606266;
      white-space: nowrap;
    }

    .el-slider {
      flex: 1;
    }

    .value {
      font-size: 14px;
      color: #409eff;
      font-weight: 600;
      min-width: 40px;
      text-align: right;
    }
  }

  @media (max-width: 768px) {
    .logo-size-control {
      flex-direction: column;
      align-items: stretch;

      .value {
        text-align: center;
      }
    }
  }
}
</style>
