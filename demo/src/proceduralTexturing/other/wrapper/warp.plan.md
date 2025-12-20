# UV Warp / Vector Map Implementation Plan

> 本文档用于规划 `UV Warp` (矢量扭曲/重映射) 节点的实现细节。
> 该节点模拟 Substance "Vector Warp" / "UV Mapper" 的核心功能。

## 核心机制

### 1. Shader 逻辑设计

扭曲本质上是改变采样坐标。

```wgsl
// 伪代码 - Core Logic
fn warp(
    pixelPos: vec2<i32>,   // 当前输出画像素坐标
    sourceTex: texture_2d<f32>,
    mapTex: texture_2d<f32>,
    strength: f32,
    mode: u32, // 0: Absolute (UV Mapper), 1: Relative (Vector Warp)
    midPoint: f32 // 通常为 0.5
) -> vec4<f32> {
    
    // 1. 获取当前基础 UV
    let dims = textureDimensions(sourceTex);
    let baseUV = vec2<f32>(pixelPos) / vec2<f32>(dims);
    
    // 2. 采样扭曲图 (Vector Map)
    // 注意：这里需要 sampler 使用 linear filter 以获得平滑扭曲
    let vector = textureSample(mapTex, mySampler, baseUV).rg;
    
    var finalUV = vec2<f32>(0.0);

    if (mode == 0u) {
        // [Mode 0: Absolute UV Mapper]
        // 映射图的 R/G 直接对应目标 UV 的 U/V
        finalUV = vector;
        
        // 可选：强度混合 (Lerp between original UV and mapped UV)
        finalUV = mix(baseUV, finalUV, strength);
    } 
    else {
        // [Mode 1: Relative Vector Warp]
        // 映射图的值代表偏移量 (Offset)
        // midPoint (0.5) 代表无偏移
        
        let offset = (vector - vec2<f32>(midPoint)) * strength;
        finalUV = baseUV + offset;
    }
    
    // 3. 采样源图像
    // 根据需求选择 wrap mode (repeat/clamp)
    return textureSample(sourceTex, mySampler, finalUV);
}
```

### 2. 关键技术卡点 (Critical Path)

#### A. 精度问题 (Precision) ⚠️
如果 `mapTex` 是普通的 `rgba8unorm` (8位整数)：
-   每个步进为 `1/255`。
-   在 `Relative` 模式下，微小的强度会导致明显的**阶梯状伪影 (Stepping)**。
-   **解决方案**：
    -   **WebGPU 资源**：`mapTex` 必须请求 `rgba16float` 或 `rgba32float` 格式。
    -   **数据输入**：如果输入源是普通图片，必须在导入时或者在 Shader 中通过 Dithering 或 Blur 进行平滑处理（权宜之计），或者确保整个管线支持高精度浮点纹理。

#### B. 采样器配置 (Sampler)
-   `mapTex` 采样：必须使用 `filterMode: 'linear'`，否则梯田纹理严重。
-   `sourceTex` 采样：建议支持 Anisotropic Filtering (各向异性过滤)，因为扭曲会导致极端的纹理拉伸，普通 linear 采样会变糊。

### 3. 数据流架构

1.  **Inputs**:
    -   `Source Image` (被扭曲的图)
    -   `Warp Map` (扭曲驱动图，通常通过 Perlin Noise 或 Slope Blur 生成)
2.  **Uniforms**:
    -   `Strength` (强度系数)
    -   `MidPoint` (中点，通常 0.5)
    -   `Type` (Absolute/Relative)

### 4. 扩展功能建议 (Nice to have)

-   **Slope Blur (斜坡模糊)**: 这其实是 Warp 的变种。多次低强度 Warp + Mipmap Level 偏移，常用于模拟掉漆、做旧。
-   **Directional Warp**: 只接收灰度图作为 Map，配合一个 `Angle` 参数，算出偏移向量 `vec2(cos(a), sin(a)) * mapValue`。

---

## 下一步行动

- [ ] 确认 WebGPU `float16` 纹理支持情况（大部分现代设备都支持）。
- [ ] 编写专门的 `WarpShader.wgsl`。
- [ ] 在 UI 面板中添加 `Warp` 专用控制组。
