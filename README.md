# Seamless Texture Generator

一个基于浏览器的图片无缝化工具，使用直方图保留混合算法将普通图片转换为无缝可平铺纹理。

[在线演示](https://leolee9086.github.io/seamless-texture-generator/) | [English Version](./README_EN.md)

## ✨ 特性

- 🎨 **智能无缝化处理** - 使用先进的直方图保留混合算法，保持图片色彩和细节
- 📱 **移动端优化** - 完美支持移动设备，包括摄像头拍照功能
- ⚡ **纯浏览器运行** - 无需服务器，所有处理在本地完成
- 🔍 **实时预览** - 支持分屏对比、放大镜、缩放等多种预览方式
- 📐 **灵活控制** - 可调整分辨率、边界混合范围等参数
- 💾 **即时保存** - 一键下载处理后的无缝纹理

## 🚀 快速开始

### 在线使用

访问 [在线演示](https://leolee9086.github.io/seamless-texture-generator/) 直接使用。

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
cd demo
pnpm dev

# 构建生产版本
pnpm build
```

## 📖 使用方法

1. **选择图片**
   - 点击"Select Image"上传本地图片
   - 点击"Sample"加载示例图片
   - 在移动设备上可以使用摄像头拍照

2. **调整参数**
   - **Max Res** - 设置最大分辨率（512-4096px）
   - **Border (%)** - 调整边界混合范围（5-100%）
   - **Zoom** - 缩放查看细节（0.01-5倍）

3. **处理图片**
   - 点击"Make Seamless"开始处理
   - 使用分割线对比处理前后效果
   - 开启放大镜查看细节

4. **保存结果**
   - 点击"Save Result"下载无缝纹理

## 🛠️ 技术栈

- **Vue 3** - 响应式UI框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速构建工具
- **UnoCSS** - 原子CSS引擎
- **Canvas API** - 图像处理

## 📐 算法原理

本项目使用**直方图保留混合（Histogram-Preserving Blending）**算法：

1. 提取图片边界区域
2. 计算对边的颜色直方图匹配
3. 使用高斯混合在边界区域平滑过渡
4. 保持原始图片的色彩分布和细节

该算法相比简单的图像混合，能够更好地保持纹理的视觉连续性和色彩一致性。

**算法来源**：本实现基于 Unity Grenoble 的研究成果，详细算法说明请参考：
https://unity-grenoble.github.io/website/demo/2020/10/16/demo-histogram-preserving-blend-make-tileable.html

## 📦 NPM包使用

```bash
npm install seamless-texture-generator
```

```typescript
import { makeTileable } from 'seamless-texture-generator'

// 从Canvas获取ImageData
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!
const img = new Image()
img.src = 'your-image.jpg'
img.onload = async () => {
  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  
  // 处理为无缝纹理（边界混合范围为20%）
  const seamlessImageData = await makeTileable(imageData, 20, null)
  
  // 绘制结果
  ctx.putImageData(seamlessImageData, 0, 0)
}
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 [AGPL-3.0-or-later](./LICENSE) 许可证。

## 🙏 致谢

- 算法灵感来源于图像处理领域的无缝纹理生成研究
- UI设计采用现代玻璃态风格（Glassmorphism）

---

如果这个项目对你有帮助，欢迎 ⭐ Star 支持！

## 赞赏

如果这个项目帮到了你，可以请我喝杯咖啡：

![赞赏码](assets/sponsor-qr.png)

也欢迎通过 [爱发电](https://afdian.net/a/leolee9086) 支持。