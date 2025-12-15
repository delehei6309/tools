import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { VueLoaderPlugin } from 'vue-loader';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 动态获取 entries 和 htmlPlugins
const entries = {};
const htmlPlugins = [];
const pagesDir = path.resolve(__dirname, 'src/pages');
// 将临时目录移到 src 下，避免 node_modules 的潜在问题，也方便调试
const tempEntriesDir = path.resolve(__dirname, 'src/.temp-entries');

// 确保临时目录存在
if (!fs.existsSync(tempEntriesDir)) {
  fs.mkdirSync(tempEntriesDir, { recursive: true });
}

if (fs.existsSync(pagesDir)) {
  const pageFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.vue'));
  pageFiles.forEach(file => {
    const name = file.replace('.vue', '');
    const entryPath = path.join(tempEntriesDir, `${name}.js`);
    
    // 自动生成入口文件内容
    const content = `import { createApp } from 'vue';
        import App from '@/pages/${file}';
        import '@/style/global.css'; // 尝试引入一个全局样式（如果存在），或者只是为了确保 css loader 工作
        createApp(App).mount('#app');
    `;
    // 简化内容，去掉不必要的引用
    const simpleContent = `import { createApp } from 'vue';
        import App from '@/pages/${file}';
        createApp(App).mount('#app');
    `;
    
    fs.writeFileSync(entryPath, content);

    entries[name] = entryPath;
    
    htmlPlugins.push(new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: `${name}.html`,
      chunks: [name],
      title: `${name} - Vue 3 App`
    }));
  });
}export default {
  mode: 'development', // 设置为开发模式 执行 npm run build 会自动切换为 production 模式
  entry: entries,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      }
    ]
  },
  resolve: { // 代表模块解析配置
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [ // 插件配置
    ...htmlPlugins,
    new VueLoaderPlugin() // Vue Loader 插件 用于处理 .vue 文件
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    hot: true,
    open: true
  }
};

