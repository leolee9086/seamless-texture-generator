# 灰度蒙版合成器

基于灰度蒙版将两个图片进行精细混合的WebGPU合成器。

## 功能特性

- ✨ **精细参数控制**：阈值、柔和度、对比度等多维度调节
- 🎨 **多种混合模式**：Normal、Multiply、Screen、Overlay
- 🔧 **蒙版处理**：支持反转、偏移、Gamma校正
- ⚡ **GPU加速**：使用WebGPU compute shader实现高性能合成
- 📦 **预设参数**：提供多种常用效果预设

## 使用方法

```typescript
import { compositeWithMask, defaultCompositorParams, compositorPresets } from './compositorGenerator'

// 基础用法
const result = await compositeWithMask(
    'path/to/imageA.jpg',      // 图片A
    'path/to/imageB.jpg',      // 图片B
    'path/to/mask.png',        // 灰度蒙版（如图灵斑纹）
    defaultCompositorParams    // 参数
)

// 使用预设
const softResult = await compositeWithMask(
    imageA,
    imageB,
    mask,
    compositorPresets.soft     // 柔和过渡预设
)

// 自定义参数
const customResult = await compositeWithMask(
    imageA,
    imageB,
    mask,
    {
        threshold: 0.6,         // 提高阈值
        softness: 0.3,          // 中等柔和度
        contrast: 1.5,          // 增强对比度
        invert: false,          // 不反转
        blendMode: 'multiply',  // 正片叠底
        opacity: 0.9,           // 90%不透明度
        maskBias: 0.1,          // 轻微提亮蒙版
        maskGamma: 1.2          // Gamma校正
    }
)
```

## 参数说明

### GrayscaleCompositorParams

| 参数 | 类型 | 范围 | 说明 |
|------|------|------|------|
| `threshold` | number | 0.0 - 1.0 | 蒙版阈值，控制混合的分界点 |
| `softness` | number | 0.0 - 1.0 | 边缘柔和度，0为硬边缘，1为最柔和 |
| `contrast` | number | 0.0 - 2.0 | 蒙版对比度，增强或减弱蒙版的对比 |
| `invert` | boolean | - | 是否反转蒙版（黑白互换） |
| `blendMode` | string | - | 混合模式：'normal' \| 'multiply' \| 'screen' \| 'overlay' |
| `opacity` | number | 0.0 - 1.0 | 整体不透明度，控制混合强度 |
| `maskBias` | number | -1.0 - 1.0 | 蒙版偏移，调整蒙版整体明暗 |
| `maskGamma` | number | 0.1 - 3.0 | Gamma校正，调整蒙版中间调 |

## 混合模式说明

- **Normal（正常）**：直接混合，不做额外处理
- **Multiply（正片叠底）**：相乘混合，产生变暗效果
- **Screen（滤色）**：反向相乘，产生提亮效果
- **Overlay（叠加）**：结合Multiply和Screen，增强对比度

## 预设效果

### `soft` - 柔和过渡
适用于需要自然过渡的场景，边缘柔和。

### `hard` - 硬边缘
适用于需要清晰分界的场景，边缘锐利。

### `highContrast` - 高对比度
增强蒙版对比度，突出图案特征。

### `inverted` - 反向蒙版
反转蒙版的黑白区域。

### `multiply` - 正片叠底
使用正片叠底模式混合，产生加深效果。

### `screen` - 滤色
使用滤色模式混合，产生提亮效果。

## 与图灵斑纹结合

这个合成器特别适合与 `GrayScottTuring` 和 `MultiscaleTuring` 生成的斑纹结合使用：

```typescript
import { generateFilmGradeTexture, defaultFilmParams } from '../GrayScottTuring/turingGenerator'
import { compositeWithMask, compositorPresets } from './compositorGenerator'

// 1. 生成图灵斑纹蒙版
const turingMask = await generateFilmGradeTexture(
    defaultFilmParams,
    1024,
    1024
)

// 2. 使用斑纹蒙版合成两个纹理
const composite = await compositeWithMask(
    'texture1.jpg',
    'texture2.jpg',
    turingMask,
    compositorPresets.soft
)
```

## 技术细节

- 使用 WebGPU Compute Shader 实现GPU加速
- 在线性色彩空间中进行混合计算，确保色彩准确性
- 支持sRGB ↔ Linear色彩空间自动转换
- 自动处理不同尺寸的输入图片
- 使用Smoothstep函数实现平滑的边缘过渡

## 性能建议

- 首次调用会初始化WebGPU设备，可能需要一些时间
- 建议批量处理时复用同一个设备实例
- 对于大尺寸图片，合成速度主要取决于GPU性能
- 典型性能：1024x1024图片约10-50ms（取决于设备）
