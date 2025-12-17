<template>
  <el-dialog v-model="dialogVisible" title="新增参数" width="380" center @close="onClose">
    <el-form :model="form" :rules="rules" label-position="top" ref="formRef">
      <el-form-item label="参数名称" prop="label">
        <el-input
          v-model="form.label"
          autocomplete="off"
          maxlength="50"
          placeholder="请输入参数名称"
          clearable
          :formatter="(value: string) => value.replace(/\s/g, '')"
        />
      </el-form-item>
      <el-form-item label="参数值" prop="value">
        <el-input
          v-model="form.value"
          autocomplete="off"
          maxlength="100"
          placeholder="请输入参数值"
          clearable
          :formatter="(value: string) => value.replace(/\s/g, '')"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" @click="onSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { FormInstance } from 'element-plus';
import { computed, reactive, ref } from 'vue';

const formRef = ref<FormInstance>();
const props = defineProps<{
  visible: boolean;
}>();
const emits = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', value: { label: string; value: string }): void;
}>();

// 使用计算属性来同步 visible 状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => {
    if (!value) {
      emits('close');
    }
  },
});

const onClose = () => {
  formRef.value?.resetFields();
  emits('close');
};

const onSubmit = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      emits('submit', { ...form });
      onClose();
    }
  });
};
const form = reactive<{
  label: string;
  value: string;
}>({
  label: '',
  value: '',
});

const rules = reactive({
  label: [{ required: true, message: '参数名称不能为空', trigger: 'change' }],
  value: [{ required: true, message: '参数值不能为空', trigger: 'change' }],
});
</script>
