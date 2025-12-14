/**
 * @AITODO 需要创建一个高级版本的平纹织物生成器
 * 要求：
 * - 1.纵横向的纱线密度可以单独调节
 * - 2.纵横向的纱线应该可以单独调节颜色
 * - 3.纱线可以有捻度效果
 * - 4.不要修改现有的生成器而是创建一个新的plainWeaveAdvanced
 * PlainWeaveParams 接口
 * 平纹织物程序化纹理参数
 */
export interface PlainWeaveParams {
    tileSize: number;           // 平铺尺寸 (例如 1.0 表示在 0-1 UV 内无缝循环)
    threadDensity: number;      // 纱线密度 (每单位长度的纱线数)
    threadThickness: number;    // 纱线粗细 (0.1-1.0)
    warpWeftRatio: number;      // 经纬线密度比 (0.5-2.0, 1.0表示相等)

    // 纱线结构
    threadTwist: number;        // 纱线捻度 (0.0-1.0)
    fiberDetail: number;        // 纤维细节程度 (0.0-1.0)
    fuzziness: number;          // 毛绒感 (0.0-1.0)

    // 织造特征
    weaveTightness: number;     // 织造紧密度 (0.0-1.0)
    threadUnevenness: number;   // 纱线粗细不均匀度 (0.0-1.0)
    weaveImperfection: number;  // 织造不完美度 (0.0-1.0, 模拟手工感)

    // 颜色渐变
    gradientStops: { offset: number, color: string }[];

    // 高级参数
    fbmOctaves: number;         // FBM 噪声的 octaves 数量 (1-5)
    fbmAmplitude: number;       // FBM 初始振幅 (0.1-1.0)
    noiseFrequency: number;     // 噪声频率 (1.0-10.0)
    colorVariation: number;     // 颜色变化幅度 (0.0-0.2)

    // 光泽和材质
    warpSheen: number;          // 经线光泽 (0.0-1.0)
    weftSheen: number;          // 纬线光泽 (0.0-1.0)
    roughnessMin: number;       // 最小粗糙度 (0.3-0.7)
    roughnessMax: number;       // 最大粗糙度 (0.7-1.0)
    normalStrength: number;     // 法线强度 (1.0-20.0)

    // 纱线厚度调节
    threadHeightScale: number;  // 纱线高度缩放 (0.5-2.0)
    threadShadowStrength: number; // 纱线交叉处阴影强度 (0.0-1.0)
}

export interface PlainWeaveResources {
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
}

export interface RenderPlainWeaveParams {
    texture: GPUTexture;
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    vertexBuffer: GPUBuffer;
}

export interface TextureExportConfig {
    device: GPUDevice;
    texture: GPUTexture;
    width: number;
    height: number;
}
