/**
 * 高级平纹织物参数 - 支持独立的经纬线控制
 */
export interface PlainWeaveAdvancedParams {
    tileSize: number;           // 平铺尺寸 (例如 1.0 表示在 0-1 UV 内无缝循环)

    // 独立的密度控制
    warpDensity: number;        // 经线密度 (每单位长度的纱线数)
    weftDensity: number;        // 纬线密度 (每单位长度的纱线数)

    // 纱线物理属性
    threadThickness: number;    // 纱线粗细 (0.1-1.0)
    threadTwist: number;        // 纱线捻度 (0.0-1.0)
    fiberDetail: number;        // 纤维细节程度 (0.0-1.0)
    fuzziness: number;          // 毛绒感 (0.0-1.0)

    // 织造特征
    weaveTightness: number;     // 织造紧密度 (0.0-1.0)
    threadUnevenness: number;   // 纱线粗细不均匀度 (0.0-1.0)
    weaveImperfection: number;  // 织造不完美度 (0.0-1.0, 模拟手工感)

    // 独立的颜色控制 (Hex String)
    warpColor: string;          // 经线颜色
    weftColor: string;          // 纬线颜色
    backgroundColor: string;    // 背景颜色
    backgroundOpacity: number;  // 背景不透明度 (0.0-1.0)

    // 高级噪声控制
    fbmOctaves: number;         // FBM 噪声的 octaves 数量 (1-5)
    fbmAmplitude: number;       // FBM 初始振幅 (0.1-1.0)
    noiseFrequency: number;     // 噪声频率 (1.0-10.0)
    colorVariation: number;     // 颜色变化幅度 (0.0-0.2)

    // 材质属性
    warpSheen: number;          // 经线光泽 (0.0-1.0)
    weftSheen: number;          // 纬线光泽 (0.0-1.0)
    roughnessMin: number;       // 最小粗糙度 (0.3-0.7)
    roughnessMax: number;       // 最大粗糙度 (0.7-1.0)
    normalStrength: number;     // 法线强度 (1.0-20.0)

    // 几何属性
    threadHeightScale: number;  // 纱线高度缩放 (0.5-2.0)
    threadShadowStrength: number; // 纱线交叉处阴影强度 (0.0-1.0)
}

export interface PlainWeaveAdvancedResources {
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
}

export interface RenderPlainWeaveAdvancedParams {
    texture: GPUTexture;
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    vertexBuffer: GPUBuffer;
}
