<template>
  <div class="smart-review-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>智能商品评价生成器</span>
        </div>
      </template>

      <el-form :model="form" label-width="120px">
        <!-- 输入方式切换 -->
        <el-form-item label="输入方式">
          <el-radio-group v-model="form.inputType">
            <el-radio-button label="link">链接解析</el-radio-button>
            <el-radio-button label="manual">手动输入</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 链接输入模式 -->
        <template v-if="form.inputType === 'link'">
          <el-form-item label="商品链接">
            <el-input
              v-model="form.productLink"
              placeholder="请粘贴商品详情页链接 (京东/淘宝/天猫)"
              clearable
            />
          </el-form-item>
        </template>

        <!-- 手动输入模式 -->
        <template v-else>
          <el-form-item label="商品名称">
            <el-input v-model="form.productName" placeholder="请输入商品名称" />
          </el-form-item>

          <el-form-item label="商品特点">
            <el-input
              v-model="form.features"
              type="textarea"
              :rows="3"
              placeholder="请输入商品特点，例如：外观时尚、性价比高、物流快"
            />
          </el-form-item>
        </template>

        <el-divider content-position="left">评价设置</el-divider>

        <!-- 评价分值 -->
        <el-form-item label="评价分值">
          <el-radio-group v-model="form.rating">
            <el-radio label="5">好评 (5星)</el-radio>
            <el-radio label="3">中评 (3星)</el-radio>
            <el-radio label="1">差评 (1星)</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 评价风格 -->
        <el-form-item label="评价风格">
          <el-radio-group v-model="form.tone">
            <el-radio label="normal">标准</el-radio>
            <el-radio label="humorous">幽默</el-radio>
            <el-radio label="serious">严肃</el-radio>
            <el-radio label="literary">文艺</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="generateReview">生成评价</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>

      <div v-if="result" class="result-area">
        <el-divider content-position="left">生成结果</el-divider>
        <div class="review-content">
          {{ result }}
        </div>
        <div class="copy-btn">
          <el-button type="success" link @click="copyResult">复制评价</el-button>
        </div>
      </div>
    </el-card>
    <el-input v-model="smsCode" placeholder="请输入短信验证码" />
    <el-button @click="loginJD">登录JD测试</el-button>
    <el-button @click="submitSmsCode">提交验证码</el-button>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const result = ref('');

const form = reactive({
  inputType: 'link', // manual | link
  productLink: '',
  productName: '',
  features: '',
  rating: '5', // 5, 3, 1
  tone: 'normal', // normal, humorous, serious, literary
});

const generateReview = async () => {
  // 校验
  if (form.inputType === 'link' && !form.productLink) {
    ElMessage.warning('请输入商品链接');
    return;
  }
  if (form.inputType === 'manual' && !form.productName) {
    ElMessage.warning('请输入商品名称');
    return;
  }

  loading.value = true;

  let productInfo = {};

  if (form.inputType === 'link') {
    const resp = await fetch('http://192.168.31.189/:3000/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: form.productLink,
      }),
    })
      .then((res) => res.json())
      .catch(() => null);
    console.log('Scrape response:', resp);

    if (resp && resp.data) {
      productInfo = resp.data;
    }
  } else {
    productInfo = {
      title: form.productName,
      features: form.features,
    };
  }

  // 流式数据  http://localhost:3000/review
  const reviewResp = await fetch('http://192.168.31.189/:3000/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productInfo,
      rating: form.rating,
      tone: form.tone,
    }),
  });
  const reader = reviewResp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let reviewText = '';
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // 保留最后一个可能不完整的行
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine.startsWith('data: ')) continue;

      const jsonStr = trimmedLine.replace(/^data: /, '');
      if (jsonStr === '[DONE]') continue;

      try {
        const json = JSON.parse(jsonStr);
        if (json.content) {
          reviewText += json.content;
          result.value = reviewText;
        }
      } catch (e) {
        console.error('Failed to parse chunk JSON:', e);
      }
    }
  }
  console.log('Final review text:', reviewText);
  loading.value = false;
};

const resetForm = () => {
  form.inputType = 'link';
  form.productLink = '';
  form.productName = '';
  form.features = '';
  form.rating = '5';
  form.tone = 'normal';
  result.value = '';
};

const copyResult = () => {
  if (!result.value) return;
  navigator.clipboard
    .writeText(result.value)
    .then(() => {
      ElMessage.success('复制成功');
    })
    .catch(() => {
      ElMessage.error('复制失败');
    });
};
const smsCode = ref('');
const sessionId = ref('');
const loginJD = async () => {
  try {
    const resp = await fetch('http://localhost:3000/send-code', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await resp.json();
    console.log('Login response:', data);
    if (data.ok) {
      ElMessage.success(data.msg || 'JD登录成功');
      if (data.sessionId) {
        sessionId.value = data.sessionId;
      }
    } else {
      ElMessage.error(data.error || 'JD登录失败');
    }
  } catch (e) {
    ElMessage.error('JD登录请求失败');
  }
};
const submitSmsCode = async () => {
  if (!sessionId.value) {
    ElMessage.warning('请先点击登录获取会话ID');
    return;
  }
  try {
    const resp = await fetch('http://192.168.31.189/:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ code: smsCode.value, sessionId: sessionId.value }),
    });
    const data = await resp.json();
    console.log('Submit SMS response:', data);
    if (data.ok) {
      ElMessage.success(data.msg || '验证码提交成功');
    } else {
      ElMessage.error(data.error || '验证码提交失败');
    }
  } catch (e) {
    ElMessage.error('验证码提交请求失败');
  }
};
</script>

<style scoped>
.smart-review-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 18px;
}

.result-area {
  margin-top: 30px;
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}

.review-content {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 15px;
  white-space: pre-wrap;
}

.copy-btn {
  text-align: right;
}
</style>
