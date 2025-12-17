<template>
  <div class="qrcode-page">
    <div class="page-header">
      <h1>二维码生成器</h1>
      <el-link type="primary" underline="always" href="https://cli.im/url" target="_blank">
        更多工具 &raquo;
      </el-link>
    </div>

    <div class="content-wrapper">
      <!-- 左侧表单区 -->
      <el-card class="form-card" shadow="hover">
        <el-form :model="form" label-position="top" ref="formRef" :rules="rules">
          <!-- 基础信息区域 -->
          <el-divider content-position="left">
            <el-icon><Link /></el-icon>
            基础信息
          </el-divider>

          <el-form-item label="网址" prop="origin">
            <el-select v-model="form.origin" placeholder="请选择网址" style="width: 100%">
              <el-option
                v-for="item in originOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <!-- 自定义网址 -->
          <el-form-item v-if="form.origin === 'custom'" label="自定义网址" prop="custom">
            <el-input
              v-model="form.custom"
              placeholder="请输入自定义网址"
              maxlength="100"
              :formatter="(value: string) => value.replace(/\s/g, '')"
            />
          </el-form-item>

          <!-- 参数选择 -->
          <el-form-item label="URL参数">
            <el-checkbox-group
              v-model="form.params"
              @change="checkboxChange"
              size="small"
              class="checkbox-group-box"
            >
              <el-checkbox
                border
                v-for="option in paramOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </el-checkbox>
              <el-button
                type="success"
                circle
                size="small"
                :icon="Plus"
                @click="handleCreateParam"
              ></el-button>
            </el-checkbox-group>
          </el-form-item>

          <!-- 动态Input -->
          <el-form-item
            v-for="input in form.paramsInput"
            :key="input.key"
            :label="input.label"
            :prop="input.key"
          >
            <el-input
              v-model="input.value"
              :placeholder="`请输入${input.label}`"
              :maxlength="100"
              :formatter="(value: string) => value.replace(/\s/g, '')"
            />
          </el-form-item>

          <!-- 样式配置区域 -->
          <el-divider content-position="left">
            <el-icon><Brush /></el-icon>
            样式配置
          </el-divider>

          <el-form-item label="二维码尺寸">
            <div style="display: flex; align-items: center; gap: 12px">
              <el-input-number
                v-model="size"
                :min="80"
                :max="400"
                :step="10"
                :step-strictly="true"
                controls-position="right"
                style="width: 150px"
              />
              <span style="color: #909399; font-size: 14px">像素</span>
            </div>
          </el-form-item>

          <el-form-item label="颜色设置">
            <div class="color-picker-group">
              <div class="color-item">
                <span>码颜色</span>
                <el-color-picker v-model="codeColor" />
              </div>
              <div class="color-item">
                <span>背景色</span>
                <el-color-picker v-model="backgroundColor" />
              </div>
            </div>
          </el-form-item>

          <!-- Logo 配置区域 -->
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
                  @click="removeLogo"
                  class="delete-btn"
                ></el-button>
              </div>

              <div class="logo-size-control">
                <span class="label">大小</span>
                <el-slider v-model="logoSize" :min="15" :max="30" :step="1" show-stops />
                <span class="value">{{ logoSize }}%</span>
              </div>
            </div>
          </el-card>

          <!-- 操作按钮 -->
          <el-form-item style="margin-top: 30px; margin-bottom: 0">
            <el-button type="primary" size="large" @click="onSubmit" :icon="Check" style="width: 48%">
              生成
            </el-button>
            <el-button size="large" @click="onReset" :icon="RefreshLeft" style="width: 48%">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 右侧预览区 -->
      <div class="preview-card">
        <div class="preview-header">
          <el-icon><View /></el-icon>
          <span>预览</span>
        </div>
        <div class="preview-content">
          <transition name="fade" mode="out-in">
            <div class="qrcode-result" v-if="qrCodeDataUrl" key="result">
              <div class="qrcode-container">
                <div class="qrcode-image">
                  <img :src="qrCodeDataUrl" alt="QR Code" />
                </div>
                <el-alert :closable="false" type="info" style="margin-top: 16px">
                  <template #title>
                    <div class="url-display">
                      <el-text type="primary" truncated style="font-size: 12px">
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
            <div v-else class="empty-state" key="empty">
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
    </div>
  </div>
  <CreateParam
    :visible="dialogFormVisible"
    @close="dialogFormVisible = false"
    @submit="onParamCreate"
  />
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import type { FormInstance, CheckboxValueType, UploadProps } from 'element-plus';
import '@/style/global.css';
import {
  Plus,
  Upload,
  Delete,
  Link,
  Brush,
  Picture,
  Check,
  RefreshLeft,
  Download,
  View,
} from '@element-plus/icons-vue';
import QRCode from 'qrcode';
import CreateParam from '@/components/create-param/index.vue';
import { ElMessage } from 'element-plus';
const formRef = ref<FormInstance>();
const originOptions = [
  { value: 'https://c.sinbaad.com', label: '薪八达个人签约' },
  { value: 'https://test-c.sinbaad.com', label: '薪八达个人签约-测试环境' },
  // 自定义
  { value: 'custom', label: '自定义' },
];
const paramOptions = reactive([
  {
    label: '企业UUID',
    value: 'customer_user_uuid',
  },
  {
    label: '供应商UUID',
    value: 'provider_user_uuid',
  },
  {
    label: '岗位UUID',
    value: 'position_uuid',
  },
  {
    label: '项目UUID',
    value: 'project_uuid',
  },
  {
    label: 'proxy_uuid',
    value: 'proxy_uuid',
  },
  {
    label: 'proxy_user_uuid',
    value: 'proxy_user_uuid',
  },
]);
// do not use same name with ref
interface ParamsInput {
  value: string;
  label: string;
  key: string;
}
// 码颜色
const codeColor = ref('#000000');
const backgroundColor = ref('#FFFFFF');
const size = ref(180);
const logoImage = ref(''); // Logo 图片 base64
const logoSize = ref(20); // Logo 占二维码的百分比
const form = reactive<{
  origin: string;
  custom: string;
  params: (string | number)[];
  paramsInput: ParamsInput[];
}>({
  origin: '',
  custom: '',
  params: [],
  paramsInput: [],
});
// 表单校验规则
const validateURL = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入自定义网址'));
    return;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      callback(new Error('网址必须以 http:// 或 https:// 开头'));
      return;
    }
    callback();
  } catch {
    callback(new Error('请输入有效的网址格式'));
  }
};

const rules = {
  origin: [{ required: true, message: '请选择网址', trigger: 'change' }],
  custom: [
    { required: true, message: '请输入自定义网址', trigger: 'change' },
    { validator: validateURL, trigger: 'change' },
  ],
};
const checkboxChange = (val: CheckboxValueType[]) => {
  form.paramsInput = val.map((v) => {
    const key = String(v);
    const item = paramOptions.find((option) => option.value === key);
    const oldValue = form.paramsInput.find((input) => input.key === key);
    return {
      value: oldValue ? oldValue.value : '',
      label: item ? item.label : '',
      key,
    };
  });
};
const qrCodeDataUrl = ref('');
const qrCodeUrl = ref('');

// 在二维码上叠加 logo
const addLogoToQRCode = (qrDataUrl: string, logoDataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const qrImage = new Image();
    qrImage.onload = () => {
      canvas.width = qrImage.width;
      canvas.height = qrImage.height;

      // 绘制二维码
      ctx.drawImage(qrImage, 0, 0);

      // 加载 logo
      const logoImg = new Image();
      logoImg.onload = () => {
        // Logo 尺寸使用用户配置的百分比
        const logoWidth = canvas.width * (logoSize.value / 100);
        const logoHeight = logoWidth; // 保持正方形
        const x = (canvas.width - logoWidth) / 2;
        const y = (canvas.height - logoHeight) / 2;

        // 绘制白色背景（增加对比度和容错率）
        const padding = 4;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - padding, y - padding, logoWidth + padding * 2, logoHeight + padding * 2);

        // 绘制 logo
        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

        resolve(canvas.toDataURL('image/png'));
      };
      logoImg.src = logoDataUrl;
    };
    qrImage.src = qrDataUrl;
  });
};

const onSubmit = async () => {
  try {
    await formRef.value?.validate();
    const url = new URL(form.origin === 'custom' ? form.custom : form.origin);
    form.paramsInput.forEach((input) => {
      // input.value maybe empty
      if (input.value) {
        url.searchParams.append(input.key, input.value);
      }
    });
    qrCodeUrl.value = url.toString();
    QRCode.toDataURL(
      qrCodeUrl.value,
      {
        errorCorrectionLevel: 'H', // 高容错率，支持 logo 遮挡
        width: size.value,
        margin: 1,
        color: {
          dark: codeColor.value,
          light: backgroundColor.value,
        },
      },
      async (err, dataUrl) => {
        if (err) {
          ElMessage.error('二维码生成失败');
          return;
        }

        // 如果有 logo，叠加到二维码上
        if (logoImage.value) {
          qrCodeDataUrl.value = await addLogoToQRCode(dataUrl, logoImage.value);
        } else {
          qrCodeDataUrl.value = dataUrl;
        }
      }
    );
  } catch (error) {
    console.log('Validation failed', error);
    return;
  }
};
const onReset = () => {
  form.paramsInput = [];
  codeColor.value = '#000000';
  backgroundColor.value = '#FFFFFF';
  size.value = 180;
  logoImage.value = '';
  logoSize.value = 20;
  formRef.value?.resetFields();
};

const dialogFormVisible = ref(false);
const handleCreateParam = () => {
  dialogFormVisible.value = true;
};

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
    logoImage.value = e.target?.result as string;
  };
  reader.readAsDataURL(rawFile);
};

// 删除 Logo
const removeLogo = () => {
  logoImage.value = '';
};

// 新增参数回调
const onParamCreate = (value: { label: string; value: string }) => {
  // 去重
  const exists = paramOptions.find((option) => option.value === value.value);
  if (exists) {
    // element-plus 提示
    ElMessage.warning('参数已存在');
    return;
  }
  paramOptions.push({
    label: value.label,
    value: value.value,
  });
};
</script>

<style scoped lang="less">
.qrcode-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.page-header {
  max-width: 1400px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: #303133;
  }
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  align-items: start;
}

// 左侧表单卡片
.form-card {
  border-radius: 12px;
  
  :deep(.el-card__body) {
    padding: 24px;
  }
}

// 分隔线样式
.el-divider {
  margin: 24px 0 20px;

  :deep(.el-divider__text) {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
    color: #606266;
    background-color: #fff;
  }
}

// 复选框组
.checkbox-group-box {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .el-checkbox {
    margin-right: 0;
  }
}

// 颜色选择器组
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

// Logo 配置卡片
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

// 右侧预览区域
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

// 响应式
@media (max-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .preview-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .qrcode-page {
    padding: 10px;
  }

  .page-header {
    h1 {
      font-size: 22px;
    }
  }

  .color-picker-group {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .logo-size-control {
    flex-direction: column;
    align-items: stretch;

    .value {
      text-align: center;
    }
  }
}
</style>
