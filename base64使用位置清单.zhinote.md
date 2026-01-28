# 项目中 Base64 图片数据使用位置清单（技术债务诊断版）

> [!WARNING]
> **现状警示**：本项目中存在严重的 Base64/Blob URL 滥用现象。大量图片数据在 GPU 和 CPU 之间进行冗余转换，导致了显著的性能开销和内存管理风险。

## 1. 核心转换工具 (Utilities)

| 文件路径 | 关键函数/逻辑 | 说明 |
| :--- | :--- | :--- |
| [download.ts](file:///d:/dev/seamless-texture-generator/demo/src/utils/download.ts) | `downloadCanvasJPG`, `dataURLToBlob`, `saveImage` | 负责 Canvas 转 Base64 下载及逆向解析。 |
| [useProjectState.utils.ts](file:///d:/dev/seamless-texture-generator/demo/src/composables/project-state/useProjectState.utils.ts) | `blobToDataURL` | 将图片 Blob 转换为 Base64 字符串，常用于状态持久化。 |
| [plainWeave.utils.ts](file:///d:/dev/seamless-texture-generator/demo/src/proceduralTexturing/fabrics/plainWeave/plainWeave.utils.ts) | `convertTextureToBase64` | 将 WebGPU 纹理导出为 Base64 图片。 |

## 2. 网络资源获取与缓存 (API & Cache)

| 文件路径 | 关键函数/逻辑 | 说明 |
| :--- | :--- | :--- |
| [imageFetcher.api.ts](file:///d:/dev/seamless-texture-generator/demo/src/api/imageFetcher.api.ts) | `fetchImageAsBase64` | 远程下载并使用 `FileReader` 转换为 Base64 以供预览和缓存。 |
| [TextToImageTabContent.indexedDB.ctx.ts](file:///d:/dev/seamless-texture-generator/demo/src/components/control-panels/inputs/TextToImage/TextToImageTabContent.indexedDB.ctx.ts) | `cacheImage` | 将获取到的图片 Base64 写入 IndexedDB 数据库。 |
| [TextToImageTabContent.ctx.ts](file:///d:/dev/seamless-texture-generator/demo/src/components/control-panels/inputs/TextToImage/TextToImageTabContent.ctx.ts) | `imageBase64` 数据流 | 在文字生成图像逻辑中作为主要数据格式传递。 |

## 3. 程序化生成算法 (Generators)

这些生成器通过 `toDataURL('image/png')` 输出计算出的纹理结果：

- [woodGeneratorPipeline.ts](file:///d:/dev/seamless-texture-generator/demo/src/proceduralTexturing/wood/woodGeneratorPipeline.ts) ✅ 已优化为 Blob URL 方案
- [leatherGenerator.ts](file:///d:/dev/seamless-texture-generator/demo/src/proceduralTexturing/leather/leatherGenerator.ts) ✅ 已优化为 Blob URL 方案
- [velvetGenerator.ts](file:///d:/dev/seamless-texture-generator/demo/src/proceduralTexturing/fabrics/velvet/velvetGenerator.ts) ✅ 已优化为 Blob URL 方案
- [twillWeaveGenerator.ts](file:///d:/dev/seamless-texture-generator/demo/src/proceduralTexturing/fabrics/twillWeave/twillWeaveGenerator.ts) ✅ 已优化为 Blob URL 方案
- [turingGenerator.ts](file:///d:/dev/seamless-texture-generator/demo/src/proceduralTexturing/other/turing/turingGenerator.ts) ✅ 已优化为 Blob URL 方案
- [compositorGenerator.ts](file:///d:/dev/seamless-texture-generator/demo/src/proceduralTexturing/other/GrayscaleCompositor/compositorGenerator.ts) ✅ 已优化为 Blob URL 方案
- [turingGenerator.ts (MultiscaleTuring)](file:///d:/dev/seamless-texture-generator/demo/src/proceduralTexturing/other/MultiscaleTuring/turingGenerator.ts) ✅ 已优化为 Blob URL 方案
- [turingGenerator.ts (GrayScottTuring)](file:///d:/dev/seamless-texture-generator/demo/src/proceduralTexturing/other/GrayScottTuring/turingGenerator.ts) ✅ 已优化为 Blob URL 方案

## 4. 预览与 UI 交互 (UI Components)

| 文件路径 | 关键动作 | 说明 |
| :--- | :--- | :--- |
| [watermark.renderer.ts](file:///d:/dev/seamless-texture-generator/demo/src/components/control-panels/watermark/watermark.renderer.ts) ✅ | 水印处理 | 已优化为 Blob URL 方案。 |
| [useMaskPreview.ts](file:///d:/dev/seamless-texture-generator/demo/src/composables/useMaskPreview.ts) ✅ | 实时预览 | 已优化为 Blob URL 方案。 |
| [LUTPanel.utils.ts](file:///d:/dev/seamless-texture-generator/demo/src/components/control-panels/lut/LUTPanel.utils.ts) ✅ | 滤镜预览 | 已优化为 Blob URL 方案。 |
| [SamplingEditor.actions.ts](file:///d:/dev/seamless-texture-generator/demo/src/components/sampling-editor/SamplingEditor.actions.ts) ✅ | 裁剪确认 | 已优化为 Blob URL 方案。 |

## 4.1 图像上传与监听 (Image Handlers)

| 文件路径 | 关键函数/逻辑 | 说明 |
| :--- | :--- | :--- |
| [imageWatcher.ts](file:///d:/dev/seamless-texture-generator/demo/src/utils/imageWatcher.ts) | `watchImageChanges` | 监听图像变化，使用 FileReader 读取为 Base64。 |
| [imageHandlers.ts](file:///d:/dev/seamless-texture-generator/demo/src/utils/app-utils/imageHandlers.ts) ✅ | `handleImageUpload` | 已优化为 Blob URL 方案。 |
| [modelscope.api.ts](file:///d:/dev/seamless-texture-generator/demo/src/api/modelscope.api.ts) | `fetchImageWithProxy` | 含 `btoa` 和 `readAsDataURL`，用于远程图像获取。 |

---

## 5. Base64/URL 滥用深度分析 (Technical Debt)

目前项目中将图片数据统一编码为 Base64 或 Blob URL 字符串的做法，实质上是早期开发为了规避复杂的生命周期管理而留下的**技术债务**：

### 5.1 性能瓶颈
*   **冗余转码链条**：数据流经历了 `显存 -> 内存 -> Canvas -> 编码字符串 -> 浏览器解析 -> 重新上传显存` 的极其低效的过程。
*   **同步阻塞**：Base64 编码是 CPU 密集型操作，大图转换会直接导致 UI 卡顿。
*   **显卡带宽浪费**：无法利用 WebGPU 的零拷贝特性，强制数据在 PCIe 总线上进行无意义的回传。

### 5.2 内存风险
*   **手动释放延迟**：依赖 `URL.revokeObjectURL` 的手动管理，清理逻辑分布在各处补丁中，极其容易造成不可控的内存泄漏。
*   **数据膨胀**：Base64 编码会导致数据体积膨胀约 33%，进一步加剧内存压力。

## 6. split-viewer 组件支持状况对比

关联组件 `@leolee9086/split-viewer` 本身拥有极其现代化的数据加载能力，但目前在项目中被“阉割”使用：

| 数据源类型 | 组件是否支持 | 项目当前使用状况 | 优势 |
| :--- | :---: | :--- | :--- |
| **WebGPU Texture** | **支持** | **完全未使用** | **性能最高**：零拷贝，直接 GPU 渲染。 |
| **WebGPU Buffer** | **支持** | **完全未使用** | 直接读取计算结果。 |
| **Blob / ArrayBuffer** | **支持** | **极少直接使用** | 减少编码开销。 |
| **URL (Base64/Blob)** | **支持** | **100% 依赖** | **最差性能**：涉及多次编解码和内存搬运。 |

---

## 7. 重构进度总结 (2026-01-28)

### 已完成重构的模块

| 类别 | 数量 | 文件 |
| :--- | :---: | :--- |
| 程序化生成器 | 8 | woodGeneratorPipeline.ts, leatherGenerator.ts, velvetGenerator.ts, twillWeaveGenerator.ts, turingGenerator.ts (turing), compositorGenerator.ts, turingGenerator.ts (MultiscaleTuring), turingGenerator.ts (GrayScottTuring) |
| 图像上传处理 | 1 | imageHandlers.ts |
| 预览与UI组件 | 4 | watermark.renderer.ts, useMaskPreview.ts, LUTPanel.utils.ts, SamplingEditor.actions.ts |

### 重构成果

- **消除了 13 处 Base64 编码瓶颈**，改用 Blob URL 方案
- **性能提升**：避免了 CPU 密集型的 Base64 编码操作，减少 UI 卡顿
- **内存优化**：Blob URL 不会导致 33% 的数据膨胀

### 待处理位置

- `imageWatcher.ts` - watchImageChanges
- `modelscope.api.ts` - fetchImageWithProxy

---
*注：此文件由织（with Antigravity）根据哥哥的要求更新，旨在为后续架构重构提供诊断依据。初始记录于 2026-01-24，重构进度更新于 2026-01-28。*
