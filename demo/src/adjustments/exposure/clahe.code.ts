/**
 * @fileoverview CLAHE 着色器代码模块
 * 限制对比度自适应直方图均衡化 (Contrast Limited Adaptive Histogram Equalization)
 * 
 * 参考实现: toread/claheWebgpu
 */

/**
 * 生成CLAHE四阶段WGSL着色器代码
 */
export function 生成CLAHE着色器(参数: {
    clipLimit?: number
    blockSize?: number
    numBins?: number
}) {
    const { clipLimit = 2.0, blockSize = 64, numBins = 256 } = 参数

    // 1. 直方图计算阶段
    const 直方图着色器 = /* wgsl */`
    struct CLAHEParams {
      width: u32,
      height: u32,
      clipLimit: f32,
      blockSize: u32,
      numBins: u32
    }
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var<storage, read_write> histogramBuffer: array<atomic<u32>>;
    @group(0) @binding(2) var<uniform> params: CLAHEParams;
    
    var<workgroup> histogram: array<array<atomic<u32>, ${numBins}>, 4>;
    
    @compute @workgroup_size(${blockSize}, ${blockSize > 16 ? 1 : blockSize})
    fn main(@builtin(global_invocation_id) id: vec3<u32>, @builtin(local_invocation_id) lid: vec3<u32>) {
      let block_id = id.xy / ${blockSize}u;
      let local_pos = id.xy % ${blockSize}u;
      
      // 初始化 workgroup 直方图
      if (local_pos.x < ${numBins}u && local_pos.y < 4u) {
        atomicStore(&histogram[local_pos.y][local_pos.x], 0u);
      }
      workgroupBarrier();
      
      let global_pos = block_id * ${blockSize}u + local_pos;
      if (global_pos.x < params.width && global_pos.y < params.height) {
        let color = textureLoad(inputTexture, vec2<i32>(global_pos), 0);
        let r = u32(color.r * f32(${numBins - 1}));
        let g = u32(color.g * f32(${numBins - 1}));
        let b = u32(color.b * f32(${numBins - 1}));
        let a = u32(color.a * f32(${numBins - 1}));
        atomicAdd(&histogram[0][r], 1u);
        atomicAdd(&histogram[1][g], 1u);
        atomicAdd(&histogram[2][b], 1u);
        atomicAdd(&histogram[3][a], 1u);
      }
      workgroupBarrier();
      
      // 写入全局直方图缓冲区
      if (local_pos.x < ${numBins}u && local_pos.y < 4u) {
        let numBlocksX = (params.width + ${blockSize - 1}u) / ${blockSize}u;
        let buffer_index = (block_id.y * numBlocksX + block_id.x) * ${numBins * 4}u + local_pos.y * ${numBins}u + local_pos.x;
        atomicStore(&histogramBuffer[buffer_index], atomicLoad(&histogram[local_pos.y][local_pos.x]));
      }
    }
  `

    // 2. 对比度限制阶段
    const 裁剪着色器 = /* wgsl */`
    struct CLAHEParams {
      width: u32,
      height: u32,
      clipLimit: f32,
      blockSize: u32,
      numBins: u32
    }
    @group(0) @binding(0) var<storage, read_write> histogramBuffer: array<u32>;
    @group(0) @binding(1) var<storage, read_write> excessBuffer: array<atomic<u32>>;
    @group(0) @binding(2) var<uniform> params: CLAHEParams;
    
    @compute @workgroup_size(${numBins}, 1)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let block_id = id.x / ${numBins * 4}u;
      let channel = (id.x % ${numBins * 4}u) / ${numBins}u;
      let bin = id.x % ${numBins}u;
      let buffer_offset = block_id * ${numBins * 4}u + channel * ${numBins}u;
      
      let clip_limit = u32(params.clipLimit * f32(params.blockSize * params.blockSize) / f32(params.numBins));
      let original_count = histogramBuffer[buffer_offset + bin];
      let clipped_count = min(original_count, clip_limit);
      let excess = original_count - clipped_count;
      
      atomicAdd(&excessBuffer[block_id * 4u + channel], excess);
      histogramBuffer[buffer_offset + bin] = clipped_count;
    }
  `

    // 3. 累积分布计算阶段
    const CDF着色器 = /* wgsl */`
    struct CLAHEParams {
      width: u32,
      height: u32,
      clipLimit: f32,
      blockSize: u32,
      numBins: u32
    }
    @group(0) @binding(0) var<storage, read> histogramBuffer: array<u32>;
    @group(0) @binding(1) var lutTexture: texture_storage_2d<rgba8unorm, write>;
    @group(0) @binding(2) var<uniform> params: CLAHEParams;
    
    @compute @workgroup_size(${numBins}, 1)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let block_id = id.x / ${numBins * 4}u;
      let channel = (id.x % ${numBins * 4}u) / ${numBins}u;
      let bin = id.x % ${numBins}u;
      let buffer_offset = block_id * ${numBins * 4}u + channel * ${numBins}u;
      
      // 串行计算CDF（每个线程处理一个bin）
      var cdf = 0u;
      for (var i = 0u; i <= bin; i++) {
        cdf += histogramBuffer[buffer_offset + i];
      }
      
      let lut_pos = vec2<u32>(bin, block_id * 4u + channel);
      let normalizedCdf = f32(cdf) / f32(params.blockSize * params.blockSize);
      textureStore(lutTexture, vec2<i32>(lut_pos), vec4<f32>(normalizedCdf, 0.0, 0.0, 1.0));
    }
  `

    // 4. LUT应用阶段（带双线性插值）
    const 应用LUT着色器 = /* wgsl */`
    struct CLAHEParams {
      width: u32,
      height: u32,
      clipLimit: f32,
      blockSize: u32,
      numBins: u32
    }
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var lutTexture: texture_2d<f32>;
    @group(0) @binding(2) var<uniform> params: CLAHEParams;
    @group(0) @binding(3) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    
    @compute @workgroup_size(16, 16)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      if (id.x >= params.width || id.y >= params.height) { return; }
      
      let pos = vec2<i32>(id.xy);
      let color = textureLoad(inputTexture, pos, 0);
      let block_id = vec2<u32>(pos) / params.blockSize;
      let local_pos = vec2<f32>(vec2<u32>(pos) % params.blockSize) / f32(params.blockSize);
      
      var enhanced_color = vec4<f32>(0.0);
      
      // 对每个通道应用CLAHE增强
      for (var c = 0; c < 4; c++) {
        let channel_value = color[c];
        let bin = u32(channel_value * f32(params.numBins - 1));
        
        // 获取相邻块的CDF值（双线性插值）
        let cdf_00 = textureLoad(lutTexture, vec2<i32>(i32(bin), i32(block_id.y * 4u + u32(c))), 0).x;
        let cdf_10 = textureLoad(lutTexture, vec2<i32>(i32(bin), i32((block_id.y + 1u) * 4u + u32(c))), 0).x;
        
        // 简化：仅在Y方向插值（完整版本需要X方向插值）
        let cdf_interp = mix(cdf_00, cdf_10, local_pos.y);
        enhanced_color[c] = cdf_interp;
      }
      
      textureStore(outputTexture, pos, enhanced_color);
    }
  `

    return {
        直方图着色器,
        裁剪着色器,
        CDF着色器,
        应用LUT着色器
    }
}

/** 英文别名 */
export const generateCLAHEShaders = 生成CLAHE着色器
