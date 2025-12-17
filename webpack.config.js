import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { VueLoaderPlugin } from 'vue-loader';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
// import CompressionPlugin from 'compression-webpack-plugin';
import fs from 'fs';

// element ui 自动导入插件
import AutoImport from 'unplugin-auto-import/webpack';
import Components from 'unplugin-vue-components/webpack';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

// 读取页面标题配置
let pageTitleConfig = {};
try {
  const configModule = await import('./src/config/page-title.js');
  pageTitleConfig = configModule.default || {};
} catch (error) {
  console.warn('页面标题配置文件不存在，将使用默认标题');
}

// 动态获取 entries 和 htmlPlugins
const entries = {};
const htmlPlugins = [];
const pagesDir = path.resolve(__dirname, 'src/pages');
// 临时入口目录（不放在 `src` 下，避免触发文件监听循环）
const tempEntriesDir = path.resolve(__dirname, '.temp-entries');

// 确保临时目录存在
if (!fs.existsSync(tempEntriesDir)) {
  fs.mkdirSync(tempEntriesDir, { recursive: true });
}
if (fs.existsSync(pagesDir)) {
  const pageFiles = fs.readdirSync(pagesDir).filter((file) => file.endsWith('.vue'));
  pageFiles.forEach((file) => {
    const name = file.replace('.vue', '');
    const entryPath = path.join(tempEntriesDir, `${name}.js`);

    // 自动生成入口文件内容
    // 开发环境下，全局引入 Element Plus，避免重复打包
    const content = `
		import { createApp } from 'vue';
		import ElementPlus from 'element-plus'
		import 'element-plus/dist/index.css'
		import App from '@/pages/${file}';
		createApp(App).use(ElementPlus).mount('#app');
	`;
    const buildContent = `
		import { createApp } from 'vue';
		import App from '@/pages/${file}';
		createApp(App).mount('#app');
	`;

    const mainContent = isProduction ? buildContent : content;
    // 只在文件不存在或内容变化时才写入，避免触发无谓的文件监听
    if (!fs.existsSync(entryPath) || fs.readFileSync(entryPath, 'utf-8') !== mainContent) {
      fs.writeFileSync(entryPath, mainContent);
    }

    entries[name] = entryPath;

    // 使用配置的标题，如果没有配置则使用页面名称
    const pageTitle = pageTitleConfig[name] || name;

    htmlPlugins.push(
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: `${name}.html`,
        chunks: [name],
        title: pageTitle,
      })
    );
  });
}

function setPlugins() {
  return isProduction
    ? [
        AutoImport({
          resolvers: [ElementPlusResolver()],
        }),
        Components({
          resolvers: [ElementPlusResolver()],
        }),
      ]
    : [];
}
export default {
  mode: isProduction ? 'production' : 'development',
  // 性能提示配置
  performance: {
    // hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxEntrypointSize: 600000, // 入口点最大体积 600KB
    maxAssetSize: 512000, // 单个资源最大体积 500KB
  },
  // 忽略自动生成的类型/临时文件，避免触发 rebuild 循环
  watchOptions: {
    ignored: [
      '**/node_modules',
      path.resolve(__dirname, 'auto-imports.d.ts'),
      path.resolve(__dirname, 'components.d.ts'),
      path.resolve(__dirname, '.temp-entries/**'),
    ],
  },
  entry: entries,
  output: {
    filename: '[name].[contenthash:8].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false, // 不生成 LICENSE.txt 文件
        terserOptions: {
          compress: {
            drop_console: isProduction, // 生产环境移除 console
          },
        },
      }),
      new CssMinimizerPlugin(), // CSS 压缩
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // 提取 Vue 相关库
        vue: {
          test: /[\\/]node_modules[\\/](vue|@vue)[\\/]/,
          name: 'vue-vendor',
          priority: 20,
        },
        // 提取 Element Plus
        elementPlus: {
          test: /[\\/]node_modules[\\/]element-plus[\\/]/,
          name: 'element-plus',
          priority: 15,
        },
        // 提取其他第三方库
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        // 提取公共代码（至少被2个页面引用）
        common: {
          minChunks: 2,
          name: 'common',
          priority: 5,
          reuseExistingChunk: true,
        },
        // 提取所有 CSS 到单独文件
        styles: {
          name: 'styles',
          type: 'css/mini-extract',
          chunks: 'all',
          enforce: true,
        },
      },
    },
    runtimeChunk: {
      name: 'runtime',
    },
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/], // 让 ts-loader 处理 .vue 文件中的 TypeScript
          transpileOnly: true, // 只进行转译，不进行类型检查，提高构建速度
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [isProduction ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
      },
      {
        test: /\.less$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'less-loader',
        ],
      },
    ],
  },
  resolve: {
    // 代表模块解析配置
    extensions: ['.ts', '.js', '.vue', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    // 插件配置
    ...setPlugins(),
    ...htmlPlugins,
    new VueLoaderPlugin(), // Vue Loader 插件 用于处理 .vue 文件
    // 生产环境提取 CSS
    ...(isProduction
      ? [
          new MiniCssExtractPlugin({
            filename: '[name].[contenthash:8].css',
            chunkFilename: '[id].[contenthash:8].css',
            ignoreOrder: true, // 忽略 CSS 顺序冲突警告
          }),
          // Gzip 压缩（仅用于支持 gzip_static 的服务器，GitHub Pages 不需要）
          // 如果部署到 GitHub Pages，可以注释掉此插件
          // new CompressionPlugin({
          //   filename: '[path][base].gz',
          //   algorithm: 'gzip',
          //   test: /\.(js|css|html|svg)$/,
          //   threshold: 10240,
          //   minRatio: 0.8,
          // }),
        ]
      : []),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    // compress: true, // 开发服务器也启用 Gzip
    port: 3000,
    hot: false,
    open: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: (error) => {
          // 忽略 ResizeObserver 循环错误（Element Plus 等 UI 库常见问题）
          if (error.message.includes('ResizeObserver loop')) {
            return false;
          }
          return true;
        },
      },
    },
    // 额外忽略 watch，防止插件生成 d.ts 时触发重载
    watchFiles: {
      paths: ['src/**/*'],
      options: {
        ignored: ['**/*.d.ts', path.resolve(__dirname, '.temp-entries')],
      },
    },
  },
};
