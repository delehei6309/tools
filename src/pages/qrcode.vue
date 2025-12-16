<template>
    <el-card style="max-width: 800px; margin: 30px auto" shadow="hover">
        <template #header>
            <div class="card-header">
                <span>生成二维码</span>
                <el-link type="primary" underline="always" href="https://cli.im/url" target="_blank">更多>></el-link>
            </div>
        </template>
        <el-form :model="form" size="large" label-position="top" ref="formRef" :rules="rules">
            <el-form-item label="网址" prop="origin">
                <el-select v-model="form.origin" placeholder="请选择网址">
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
                <el-input v-model="form.custom" placeholder="请输入自定义网址" maxlength="100" :formatter="(value:string) => value.replace(/\s/g, '')" />
            </el-form-item>
            <!-- 参数选择 -->
            <el-form-item label="URL参数" prop="params">
                    <el-checkbox-group v-model="form.params" @change="checkboxChange" size="default" class="checkbox-group-box">
                    <el-checkbox border v-for="option in paramOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </el-checkbox>
                    <el-button type="success" circle size="default" :icon="Plus" @click="handleCreateParam"></el-button>
                </el-checkbox-group>
            </el-form-item>
            <!-- 动态Input -->
            <el-form-item v-for="(input) in form.paramsInput" :key="input.key" :label="input.label" :prop="input.key">
                <el-input v-model="input.value" :placeholder="`请输入${input.label}`" :maxlength="100" :formatter="(value:string) => value.replace(/\s/g, '')" />
            </el-form-item>
            <!-- 二维码风格 -->
            <el-form-item label="二维码风格" prop="style" size="default">
                <div style="display: flex; gap: 20px;">
                    <span>
                        码颜色：<el-color-picker v-model="codeColor" />
                    </span>
                    <span>
                        背景色：<el-color-picker v-model="backgroundColor" />
                    </span>
                </div>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="onSubmit">生成二维码</el-button>
                <el-button @click="onReset">重置参数</el-button>
            </el-form-item>
        </el-form>
        <div class="qrcode-container" v-show="!!qrCodeDataUrl">
            <el-text type="warning" line-clamp="100" style="word-break: break-word;">{{qrCodeUrl}}</el-text>
            <img :src="qrCodeDataUrl" alt="">
            <el-link type="primary" underline="never" download="qrcode.png" :href="qrCodeDataUrl">保存到本地</el-link>
        </div>
    </el-card>
    <CreateParam :visible="dialogFormVisible" 
        @close="dialogFormVisible = false"
        @submit="onParamCreate" />
</template>

<script lang="ts" setup>
    import { reactive, ref } from "vue";
    import type { FormInstance, CheckboxValueType } from 'element-plus';
    import { Plus } from '@element-plus/icons-vue';
    import QRCode from "qrcode";
    import CreateParam from '@/components/create-param/index.vue';
    import { ElMessage } from 'element-plus'
    const formRef = ref<FormInstance>()
    const originOptions = [
        { value: "https://c.sinbaad.com", label: "薪八达个人签约" },
        { value: "https://test-c.sinbaad.com", label: "薪八达个人签约-测试环境" },
        // 自定义
        { value: "custom", label: "自定义" },
    ];
    const paramOptions = reactive([
        {
            label: "企业UUID",
            value: "customer_user_uuid",
        },
        {
            label: "供应商UUID",
            value: "provider_user_uuid",
        },{
            label: "岗位UUID",
            value: "position_uuid",
        },{
            label: "项目UUID",
            value: "project_uuid",
        },{
            label: "proxy_uuid",
            value: "proxy_uuid",
        },{
            label: "proxy_user_uuid",
            value: "proxy_user_uuid"
        }
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
    const form = reactive<{
        origin: string;
        custom: string;
        params: (string | number)[];
        paramsInput: ParamsInput[];
    }>({
        origin: "",
        custom: "",
        params: [],
        paramsInput: [],
    });
    // 表单校验规则
    const rules = {
        origin: [
            { required: true, message: '请选择网址', trigger: 'change' }
        ],
        custom: [
            { required: true, message: '请输入自定义网址', trigger: 'blur' }
        ],
    }
    const checkboxChange = (val: CheckboxValueType[]) => {
        form.paramsInput = val.map((v) => {
            const key = String(v);
            const item = paramOptions.find((option) => option.value === key);
            const oldValue = form.paramsInput.find((input) => input.key === key);
            return {
                value: oldValue ? oldValue.value : "",
                label: item ? item.label : "",
                key,
            };
        });
        
    };
    const qrCodeDataUrl = ref('');
    const qrCodeUrl = ref('');
    const onSubmit = async () => {
        try{
            await formRef.value?.validate();
            const url = new URL(form.origin === 'custom' ? form.custom : form.origin);
            form.paramsInput.forEach((input) => {
                // input.value maybe empty
                if (input.value) {
                    url.searchParams.append(input.key, input.value);
                }
            });
            qrCodeUrl.value = url.toString();
            QRCode.toDataURL(qrCodeUrl.value, {
                // errorCorrectionLevel: "H",
                width: 180,
                margin: 1,
                color: {
                    // 给我个好看的搭配颜色
                    dark: codeColor.value,
                    light: backgroundColor.value
                }
            }, (err, dataUrl) => {
                // 清空容器 并且添加新的canvas
                qrCodeDataUrl.value = dataUrl;
            })
        } catch (error) {
            console.log('Validation failed', error);
            return;
        }
    };
    const onReset = () => {
        form.paramsInput = [];
        codeColor.value = '#000000';
        backgroundColor.value = '#FFFFFF';
        formRef.value?.resetFields();
    };


    const dialogFormVisible = ref(false);
    const handleCreateParam = () => {
        dialogFormVisible.value = true;
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
    .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .checkbox-group-box{
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        .el-checkbox{
            margin-right: 0;
        }
    }
    .qrcode-container{
        margin-top: 20px;
        border: 1px solid #eee;
        padding:6px;
        border-radius: 2px;
        font-size: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        text-align: center;
        img{
            width: 180px;
            height: 180px;
        }
    }
</style>
