/**
 * 二维码生成工具函数
 */
import QRCode from 'qrcode';
import { ElMessage } from 'element-plus';
import type { QRCodeOptions } from '@/types/qrcode';

/**
 * 在二维码上叠加 Logo
 * @param qrDataUrl 二维码 base64 数据
 * @param logoDataUrl Logo base64 数据
 * @param logoSize Logo 占二维码的百分比
 * @returns Promise<string> 叠加后的二维码 base64
 */
export const addLogoToQRCode = (
  qrDataUrl: string,
  logoDataUrl: string,
  logoSize: number
): Promise<string> => {
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
        const logoWidth = canvas.width * (logoSize / 100);
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

/**
 * 根据 URL 长度和 Logo 自动选择纠错级别
 * @param url 二维码 URL
 * @param hasLogo 是否有 Logo
 * @returns 'L' | 'M' | 'Q' | 'H'
 */
const getErrorCorrectionLevel = (url: string, hasLogo: boolean): 'L' | 'M' | 'Q' | 'H' => {
  const urlLength = url.length;

  // 如果有 Logo，必须使用高纠错率
  if (hasLogo) {
    return 'H'; // 30% 纠错能力，适合叠加 Logo
  }

  // 根据 URL 长度选择纠错级别
  // URL 越短，可以使用更高的纠错级别
  if (urlLength < 50) {
    return 'H'; // 30% 纠错
  } else if (urlLength < 100) {
    return 'Q'; // 25% 纠错
  } else if (urlLength < 200) {
    return 'M'; // 15% 纠错
  } else {
    return 'L'; // 7% 纠错，适合长 URL
  }
};

/**
 * 生成二维码
 * @param options 二维码生成选项
 * @returns Promise<{ dataUrl: string; url: string }>
 */
export const generateQRCode = async (
  options: QRCodeOptions
): Promise<{ dataUrl: string; url: string }> => {
  return new Promise((resolve, reject) => {
    const hasLogo = Boolean(options.logoImage && options.logoSize);
    const errorCorrectionLevel = getErrorCorrectionLevel(options.url, hasLogo);

    QRCode.toDataURL(
      options.url,
      {
        errorCorrectionLevel, // 自动选择纠错级别
        width: options.size,
        margin: 1,
        color: {
          dark: options.codeColor,
          light: options.backgroundColor,
        },
      },
      async (err, dataUrl) => {
        if (err) {
          ElMessage.error('二维码生成失败');
          reject(err);
          return;
        }

        // 如果有 logo，叠加到二维码上
        if (hasLogo) {
          const finalDataUrl = await addLogoToQRCode(
            dataUrl,
            options.logoImage!,
            options.logoSize!
          );
          resolve({ dataUrl: finalDataUrl, url: options.url });
        } else {
          resolve({ dataUrl, url: options.url });
        }
      }
    );
  });
};

/**
 * URL 验证函数
 * @param value URL 字符串
 * @returns boolean
 */
export const isValidURL = (value: string): boolean => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * 构建完整的 URL（包含参数）
 * @param baseUrl 基础 URL
 * @param params 参数列表
 * @returns string
 */
export const buildURL = (
  baseUrl: string,
  params: Array<{ key: string; value: string }>
): string => {
  const url = new URL(baseUrl);
  params.forEach((param) => {
    if (param.value) {
      url.searchParams.append(param.key, param.value);
    }
  });
  return url.toString();
};
