<template>
  <div class="money-input" :class="{ 'money-input--disabled': disabled }">
    <span v-if="showPrefix" class="money-input__prefix">¥</span>
    <input
      ref="inputRef"
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      class="money-input__inner"
      inputmode="decimal"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    <span v-if="suffix" class="money-input__suffix">{{ suffix }}</span>
  </div>
</template>

<script setup lang="ts">
/* global FocusEvent, Event, HTMLInputElement */
import { ref, computed, watch } from 'vue';

interface Props {
  modelValue: number;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  min?: number;
  max?: number;
  precision?: number; // 小数位数，默认2位
  showPrefix?: boolean; // 是否显示 ¥ 前缀
  suffix?: string; // 后缀文字
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入金额',
  disabled: false,
  readonly: false,
  min: 0,
  max: Infinity,
  precision: 2,
  showPrefix: true,
  suffix: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'change', value: number): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);
const inputValue = ref('');

// 显示值：聚焦时显示原始输入，失焦时格式化显示
const displayValue = computed(() => {
  if (isFocused.value) {
    return inputValue.value;
  }
  // 失焦时，显示格式化后的值
  if (props.modelValue === 0 || props.modelValue === null || props.modelValue === undefined) {
    return '';
  }
  return String(props.modelValue);
});

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (!isFocused.value) {
      inputValue.value = newVal ? String(newVal) : '';
    }
  },
  { immediate: true }
);

// 验证并格式化输入值
function parseAndValidate(value: string): {
  isValid: boolean;
  numValue: number;
  displayStr: string;
} {
  // 移除非法字符，只保留数字、小数点和负号
  let cleaned = value.replace(/[^\d.-]/g, '');

  // 处理多个小数点，只保留第一个
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // 处理多个负号，只保留开头的一个
  if (cleaned.startsWith('-')) {
    cleaned = '-' + cleaned.slice(1).replace(/-/g, '');
  } else {
    cleaned = cleaned.replace(/-/g, '');
  }

  // 限制小数位数
  if (cleaned.includes('.')) {
    const [integer, decimal] = cleaned.split('.');
    if (decimal && decimal.length > props.precision) {
      cleaned = integer + '.' + decimal.slice(0, props.precision);
    }
  }

  // 转换为数字
  const numValue = cleaned === '' || cleaned === '-' ? 0 : parseFloat(cleaned);

  // 范围限制
  let finalValue = numValue;
  if (!isNaN(numValue)) {
    if (numValue < props.min) {
      finalValue = props.min;
    } else if (numValue > props.max) {
      finalValue = props.max;
    }
  }

  return {
    isValid: !isNaN(numValue),
    numValue: finalValue,
    displayStr: cleaned,
  };
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const { isValid, numValue, displayStr } = parseAndValidate(target.value);

  // 更新输入框显示
  inputValue.value = displayStr;

  // 同步到 DOM（防止非法字符残留）
  if (target.value !== displayStr) {
    target.value = displayStr;
  }

  // 发出更新事件
  if (isValid) {
    emit('update:modelValue', numValue);
  }
}

function handleBlur(event: FocusEvent) {
  isFocused.value = false;

  // 失焦时格式化值
  const { numValue } = parseAndValidate(inputValue.value);
  emit('update:modelValue', numValue);
  emit('change', numValue);
  emit('blur', event);
}

function handleFocus(event: FocusEvent) {
  isFocused.value = true;
  // 聚焦时显示当前值
  inputValue.value = props.modelValue ? String(props.modelValue) : '';
  emit('focus', event);
}

// 暴露方法
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
});
</script>

<style scoped lang="less">
.money-input {
  display: inline-flex;
  align-items: center;
  width: 100%;
  height: 32px;
  padding: 0 11px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:hover:not(.money-input--disabled) {
    border-color: #c0c4cc;
  }

  &:focus-within:not(.money-input--disabled) {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }

  &--disabled {
    background-color: #f5f7fa;
    border-color: #e4e7ed;
    cursor: not-allowed;

    .money-input__inner {
      cursor: not-allowed;
      color: #c0c4cc;
    }
  }

  &__prefix {
    flex-shrink: 0;
    color: #909399;
    font-size: 14px;
    margin-right: 4px;
  }

  &__inner {
    flex: 1;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: #606266;
    text-align: left;

    &::placeholder {
      color: #c0c4cc;
    }

    // 隐藏 number 类型的上下箭头
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      appearance: none;
      margin: 0;
    }

    &[type='number'] {
      -moz-appearance: textfield;
      appearance: textfield;
    }
  }

  &__suffix {
    flex-shrink: 0;
    color: #909399;
    font-size: 14px;
    margin-left: 4px;
  }
}
</style>
