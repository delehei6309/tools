<template>
  <div ref="containerRef" class="three-canvas">
    <div v-if="loading" class="loading-overlay">
      <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
      <p>{{ loadingText }}</p>
      <el-progress
        v-if="loadProgress > 0"
        :percentage="loadProgress"
        :stroke-width="6"
        style="width: 200px; margin-top: 16px"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { CarAnatomyScene } from '@/utils/car-anatomy/three-scene';
import type { CarPart, ViewMode, CarPartCategory } from '@/types/car-anatomy';

const props = defineProps<{
  viewMode: ViewMode;
  highlightCategory: CarPartCategory | null;
  modelUrl?: string; // 可选的外部模型 URL
}>();

const emit = defineEmits<{
  (e: 'part-select', part: CarPart | null): void;
  (e: 'model-loaded'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const loading = ref(true);
const loadingText = ref('加载3D场景中...');
const loadProgress = ref(0);
let scene: CarAnatomyScene | null = null;

onMounted(async () => {
  if (containerRef.value) {
    scene = new CarAnatomyScene(containerRef.value);
    scene.setPartSelectCallback((part) => {
      emit('part-select', part);
    });

    scene.setLoadProgressCallback((progress) => {
      loadProgress.value = Math.round(progress);
    });

    scene.setLoadCompleteCallback(() => {
      loading.value = false;
      emit('model-loaded');
    });

    // 如果提供了模型 URL，加载外部模型
    if (props.modelUrl) {
      loadingText.value = '加载汽车模型中...';
      try {
        await scene.loadModel(props.modelUrl);
      } catch (error) {
        console.error('模型加载失败，使用默认模型:', error);
        loadingText.value = '模型加载失败，使用默认模型';
      }
    }

    // 模拟加载延迟（对于默认模型）
    window.setTimeout(() => {
      loading.value = false;
    }, 500);
  }
});

onUnmounted(() => {
  if (scene) {
    scene.dispose();
  }
});

// 监听模型 URL 变化
watch(
  () => props.modelUrl,
  async (newUrl) => {
    if (scene && newUrl) {
      loading.value = true;
      loadingText.value = '加载汽车模型中...';
      loadProgress.value = 0;
      try {
        await scene.loadModel(newUrl);
      } catch (error) {
        console.error('模型加载失败:', error);
        loading.value = false;
      }
    }
  }
);

// 监听视图模式变化
watch(
  () => props.viewMode,
  (mode) => {
    if (scene) {
      scene.setViewMode(mode);
    }
  }
);

// 监听分类筛选变化
watch(
  () => props.highlightCategory,
  (category) => {
    if (scene) {
      scene.highlightCategory(category);
    }
  }
);

// 加载外部模型
const loadModel = async (url: string) => {
  if (scene) {
    loading.value = true;
    loadingText.value = '加载汽车模型中...';
    loadProgress.value = 0;
    try {
      await scene.loadModel(url);
      loading.value = false;
    } catch (error) {
      console.error('模型加载失败:', error);
      loading.value = false;
      throw error;
    }
  }
};

// 暴露方法给父组件
const resetCamera = () => {
  if (scene) {
    scene.resetCamera();
  }
};

defineExpose({
  resetCamera,
  loadModel,
});
</script>

<style lang="less" scoped>
.three-canvas {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: #1a1a2e;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.9);
  color: #fff;
  z-index: 10;

  .loading-icon {
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  p {
    margin: 0;
    font-size: 14px;
    opacity: 0.8;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
