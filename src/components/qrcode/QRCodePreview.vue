<template>
  <div class="preview-card">
    <div class="preview-header">
      <el-icon><View /></el-icon>
      <span>预览</span>
    </div>
    <div class="preview-content">
      <transition name="fade" mode="out-in">
        <div v-if="qrCodeDataUrl" key="result" class="qrcode-result">
          <div class="qrcode-container">
            <div class="qrcode-image">
              <img :src="qrCodeDataUrl" alt="QR Code" />
            </div>
            <el-alert :closable="false" type="info" style="margin-top: 16px">
              <template #title>
                <div class="url-display">
                  <el-text type="primary" style="font-size: 12px; line-height: 1.6">
                    {{ qrCodeUrl }}
                  </el-text>
                </div>
              </template>
            </el-alert>
            <el-button
              type="primary"
              :icon="Download"
              download="qrcode.png"
              :href="qrCodeDataUrl"
              tag="a"
              style="width: 100%; margin-top: 16px"
            >
              下载二维码
            </el-button>
          </div>
        </div>
        <div v-else key="empty" class="empty-state">
          <el-empty description="暂无内容">
            <template #image>
              <el-icon :size="80" color="#c0c4cc"><Picture /></el-icon>
            </template>
            <div style="color: #909399; font-size: 14px">填写信息后点击"生成"按钮</div>
          </el-empty>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { View, Download, Picture } from '@element-plus/icons-vue';

defineProps<{
  qrCodeDataUrl: string;
  qrCodeUrl: string;
}>();
</script>

<style scoped lang="less">
.preview-card {
  position: sticky;
  top: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: fit-content;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.qrcode-result {
  min-height: 300px;
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-image {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 4px solid #f0f0f0;

  img {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
  }
}

.url-display {
  width: 100%;
  word-break: break-all;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #409eff;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 2px;
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #909399;
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 1200px) {
  .preview-card {
    position: static;
  }
}
</style>
