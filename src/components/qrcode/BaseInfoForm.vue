<template>
  <div class="base-info-form">
    <el-divider content-position="left">
      <el-icon><Link /></el-icon>
      基础信息
    </el-divider>

    <el-form-item label="网址" prop="origin">
      <el-select
        :model-value="modelValue.origin"
        @update:model-value="(val) => emit('update:modelValue', { ...props.modelValue, origin: val })"
        placeholder="请选择网址"
        style="width: 100%"
      >
        <el-option
          v-for="item in originOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <!-- 自定义网址 -->
    <el-form-item v-if="modelValue.origin === 'custom'" label="自定义网址" prop="custom">
      <el-input
        :model-value="modelValue.custom"
        @update:model-value="(val) => emit('update:modelValue', { ...props.modelValue, custom: val })"
        placeholder="请输入自定义网址"
        maxlength="100"
        :formatter="(value: string) => value.replace(/\s/g, '')"
      />
    </el-form-item>

    <!-- 参数选择 -->
    <el-form-item label="URL参数">
      <el-checkbox-group
        :model-value="modelValue.params"
        @update:model-value="handleParamsChange"
        size="small"
        class="checkbox-group-box"
      >
        <el-checkbox border v-for="option in paramOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </el-checkbox>
        <el-button
          type="success"
          circle
          size="small"
          :icon="Plus"
          @click="emit('create-param')"
        ></el-button>
      </el-checkbox-group>
    </el-form-item>

    <!-- 动态Input -->
    <el-form-item
      v-for="(input, index) in modelValue.paramsInput"
      :key="input.key"
      :label="input.label"
      :prop="input.key"
    >
      <el-input
        :model-value="input.value"
        @update:model-value="(val) => handleInputChange(index, val)"
        :placeholder="`请输入${input.label}`"
        :maxlength="100"
        :formatter="(value: string) => value.replace(/\s/g, '')"
      />
    </el-form-item>
  </div>
</template>

<script lang="ts" setup>
import { Link, Plus } from '@element-plus/icons-vue';
import type { CheckboxValueType } from 'element-plus';
import type { QRCodeForm, ParamOption, OriginOption } from '@/types/qrcode';

const props = defineProps<{
  modelValue: QRCodeForm;
  originOptions: OriginOption[];
  paramOptions: ParamOption[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: QRCodeForm];
  'create-param': [];
}>();

const handleParamsChange = (val: CheckboxValueType[]) => {
  const newParamsInput = val.map((v) => {
    const key = String(v);
    const item = props.paramOptions.find((option) => option.value === key);
    const oldValue = props.modelValue.paramsInput.find((input) => input.key === key);
    return {
      value: oldValue ? oldValue.value : '',
      label: item ? item.label : '',
      key,
    };
  });

  emit('update:modelValue', {
    ...props.modelValue,
    params: val as (string | number)[],
    paramsInput: newParamsInput,
  });
};

const handleInputChange = (index: number, value: string) => {
  const newParamsInput = [...props.modelValue.paramsInput];
  newParamsInput[index] = { ...newParamsInput[index], value };
  
  emit('update:modelValue', {
    ...props.modelValue,
    paramsInput: newParamsInput,
  });
};

</script>

<style scoped lang="less">
.base-info-form {
  .checkbox-group-box {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .el-checkbox {
      margin-right: 0;
    }
  }
}
</style>
