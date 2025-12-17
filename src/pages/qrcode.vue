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
          <!-- 基础信息表单 -->
          <BaseInfoForm
            :model-value="form"
            @update:model-value="(val) => Object.assign(form, val)"
            :origin-options="originOptions"
            :param-options="paramOptions"
            @create-param="handleCreateParam"
          />

          <!-- 样式配置 -->
          <StyleConfig
            v-model:size="styleConfig.size"
            v-model:code-color="styleConfig.codeColor"
            v-model:background-color="styleConfig.backgroundColor"
          />

          <!-- Logo 配置 -->
          <LogoConfig
            v-model:logo-image="logoConfig.image"
            v-model:logo-size="logoConfig.size"
            @remove-logo="handleRemoveLogo"
          />

          <!-- 操作按钮 -->
          <el-form-item style="margin-top: 30px; margin-bottom: 0">
            <el-button
              type="primary"
              size="large"
              @click="onSubmit"
              :icon="Check"
              style="width: 48%"
            >
              生成
            </el-button>
            <el-button size="large" @click="onReset" :icon="RefreshLeft" style="width: 48%">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 右侧预览区 -->
      <QRCodePreview :qr-code-data-url="qrCodeDataUrl" :qr-code-url="qrCodeUrl" />
    </div>
  </div>

  <!-- 创建参数对话框 -->
  <CreateParam
    :visible="dialogFormVisible"
    @close="dialogFormVisible = false"
    @submit="onParamCreate"
  />
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Check, RefreshLeft } from '@element-plus/icons-vue';
import '@/style/global.css';

// 组件导入
import BaseInfoForm from '@/components/qrcode/BaseInfoForm.vue';
import StyleConfig from '@/components/qrcode/StyleConfig.vue';
import LogoConfig from '@/components/qrcode/LogoConfig.vue';
import QRCodePreview from '@/components/qrcode/QRCodePreview.vue';
import CreateParam from '@/components/create-param/index.vue';

// 类型和工具函数导入
import type {
  QRCodeForm,
  ParamOption,
  StyleConfig as StyleConfigType,
  LogoConfig as LogoConfigType,
} from '@/types/qrcode';
import { generateQRCode, buildURL, isValidURL } from '@/utils/qrcode/utils';
import {
  ORIGIN_OPTIONS,
  DEFAULT_PARAM_OPTIONS,
  DEFAULT_STYLE_CONFIG,
  DEFAULT_LOGO_CONFIG,
} from '@/utils/qrcode/constants';

// 表单引用
const formRef = ref<FormInstance>();

// 来源选项配置
const originOptions = ORIGIN_OPTIONS;

// 参数选项（使用 reactive 因为需要动态添加）
const paramOptions = reactive<ParamOption[]>([...DEFAULT_PARAM_OPTIONS]);

// 表单数据
const form = reactive<QRCodeForm>({
  origin: 'custom',
  custom: '',
  params: [],
  paramsInput: [],
});

// 样式配置
const styleConfig = reactive<StyleConfigType>({ ...DEFAULT_STYLE_CONFIG });

// Logo 配置
const logoConfig = reactive<LogoConfigType>({ ...DEFAULT_LOGO_CONFIG });

// 二维码结果
const qrCodeDataUrl = ref('');
const qrCodeUrl = ref('');

// 对话框控制
const dialogFormVisible = ref(false);

// URL 校验规则
const validateURL = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入自定义网址'));
    return;
  }
  if (!isValidURL(value)) {
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      callback(new Error('网址必须以 http:// 或 https:// 开头'));
    } else {
      callback(new Error('请输入有效的网址格式'));
    }
    return;
  }
  callback();
};

// 表单校验规则
const rules = {
  origin: [{ required: true, message: '请选择网址', trigger: 'change' }],
  custom: [
    { required: true, message: '请输入自定义网址', trigger: 'change' },
    { validator: validateURL, trigger: 'change' },
  ],
};

// 生成二维码
const onSubmit = async () => {
  try {
    await formRef.value?.validate();

    const baseUrl = form.origin === 'custom' ? form.custom : form.origin;
    const url = buildURL(baseUrl, form.paramsInput);

    const result = await generateQRCode({
      url,
      size: styleConfig.size,
      codeColor: styleConfig.codeColor,
      backgroundColor: styleConfig.backgroundColor,
      logoImage: logoConfig.image,
      logoSize: logoConfig.size,
    });

    qrCodeDataUrl.value = result.dataUrl;
    qrCodeUrl.value = result.url;
  } catch (error) {
    console.log('Validation or generation failed', error);
  }
};

// 重置表单
const onReset = () => {
  form.paramsInput = [];
  Object.assign(styleConfig, DEFAULT_STYLE_CONFIG);
  Object.assign(logoConfig, DEFAULT_LOGO_CONFIG);
  qrCodeDataUrl.value = '';
  qrCodeUrl.value = '';
  formRef.value?.resetFields();
};

// 打开创建参数对话框
const handleCreateParam = () => {
  dialogFormVisible.value = true;
};

// 删除 Logo
const handleRemoveLogo = () => {
  logoConfig.image = '';
};

// 新增参数回调
const onParamCreate = (value: { label: string; value: string }) => {
  const exists = paramOptions.find((option) => option.value === value.value);
  if (exists) {
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

.form-card {
  border-radius: 12px;

  :deep(.el-card__body) {
    padding: 24px;
  }
}

// 分隔线统一样式
:deep(.el-divider) {
  margin: 24px 0 20px;

  .el-divider__text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
    color: #606266;
    background-color: #fff;
  }
}

// 响应式
@media (max-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 1fr;
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
}
</style>
