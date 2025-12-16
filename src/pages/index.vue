<template>
    <div class="container">
        <el-card class="welcome-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span>欢迎使用工具集</span>
                </div>
            </template>
            <div class="content">
                <h2>👋 你好！</h2>
                <p>这是一个基于 Vue 3 + Webpack + TypeScript + Element Plus 构建的多页面工具应用。</p>
                
                <el-divider />
                
                <h3>🛠️ 可用工具</h3>
                <el-space direction="vertical" :size="15" style="width: 100%">
                    <el-card shadow="hover" class="tool-card">
                        <div class="tool-item">
                            <div>
                                <h4>📱 二维码生成器</h4>
                                <p>快速生成自定义网址的二维码，支持参数配置和颜色定制</p>
                            </div>
                            <el-button type="primary" @click="goToQRCode">立即使用</el-button>
                        </div>
                    </el-card>
                </el-space>
                
                <el-divider />
                
                <div class="footer-info">
                    <el-alert
                        title="提示"
                        type="info"
                        :closable="false"
                        show-icon
                    >
                        <template #default>
                            更多工具正在开发中，敬请期待...
                        </template>
                    </el-alert>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
const goToQRCode = () => {
    window.location.href = './qrcode.html';
};
</script>

<style scoped lang="less">
.container {
    padding: 40px 20px;
    max-width: 900px;
    margin: 0 auto;
}

.welcome-card {
    .card-header {
        font-size: 20px;
        font-weight: bold;
    }
}

.content {
    h2 {
        margin: 0 0 16px 0;
        color: #303133;
    }

    h3 {
        margin: 20px 0 16px 0;
        color: #606266;
    }

    p {
        margin: 8px 0;
        color: #909399;
        line-height: 1.6;
    }
}

.tool-card {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
        transform: translateY(-2px);
    }

    .tool-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;

        h4 {
            margin: 0 0 8px 0;
            color: #303133;
            font-size: 16px;
        }

        p {
            margin: 0;
            color: #909399;
            font-size: 14px;
        }
    }
}

.footer-info {
    margin-top: 20px;
}
</style>