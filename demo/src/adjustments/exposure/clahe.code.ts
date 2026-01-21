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
    
    // 使用 numBins 作为线程数 (256)，每个线程处理多个像素
    @compute @workgroup_size(${numBins}, 1)
    fn main(@builtin(global_invocation_id) global_id: vec3<u32>, 
            @builtin(local_invocation_id) local_id: vec3<u32>, 
            @builtin(workgroup_id) group_id: vec3<u32>) {
            
      let tid = local_id.x; // 0..255
      let block_coord = group_id.xy;
      
      // 1. 初始化 workgroup 共享内存直方图
      // 每个线程负责初始化4个通道的对应bin
      if (tid < ${numBins}u) {
        for (var c = 0u; c < 4u; c++) {
            atomicStore(&histogram[c][tid], 0u);
        }
      }
      workgroupBarrier();
      
      // 2. 遍历Block中的所有像素
      // 总像素数 = blockSize * blockSize
      // 线程数 = numBins
      let total_pixels = ${blockSize}u * ${blockSize}u;
      
      // 简单的循环步进
      for (var i = tid; i < total_pixels; i += ${numBins}u) {
          let px = i % ${blockSize}u;
          let py = i / ${blockSize}u;
          
          let global_x = block_coord.x * ${blockSize}u + px;
          let global_y = block_coord.y * ${blockSize}u + py;
          
          if (global_x < params.width && global_y < params.height) {
              let color = textureLoad(inputTexture, vec2<i32>(i32(global_x), i32(global_y)), 0);
              
              // 累积到共享内存
              atomicAdd(&histogram[0][u32(color.r * f32(${numBins - 1}))], 1u);
              atomicAdd(&histogram[1][u32(color.g * f32(${numBins - 1}))], 1u);
              atomicAdd(&histogram[2][u32(color.b * f32(${numBins - 1}))], 1u);
              atomicAdd(&histogram[3][u32(color.a * f32(${numBins - 1}))], 1u);
          }
      }
      workgroupBarrier();
      
      // 3. 将共享内存写入全局 Buffer
      // 每个线程负责写入一个 bin 的 4 个通道
      // Flattened Index: (BlockIndex) * (4 * 256) + (Channel * 256) + Bin
      
      if (tid < ${numBins}u) {
          let numBlocksX = (params.width + ${blockSize - 1}u) / ${blockSize}u;
          let flattened_block_idx = block_coord.y * numBlocksX + block_coord.x;
          let block_addr_base = flattened_block_idx * ${numBins * 4}u;
          
          for (var c = 0u; c < 4u; c++) {
              let channel_addr = block_addr_base + c * ${numBins}u + tid;
              atomicStore(&histogramBuffer[channel_addr], atomicLoad(&histogram[c][tid]));
          }
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
      
      var clip_limit = u32(params.clipLimit * f32(params.blockSize * params.blockSize) / f32(params.numBins));
      if (clip_limit < 1u) {
          clip_limit = 32u; // Fallback safety
      }
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
    @group(0) @binding(1) var<storage, read_write> lutBuffer: array<f32>;
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
      
      let normalizedCdf = f32(cdf) / f32(params.blockSize * params.blockSize);
      
      // 写入LUT Buffer
      lutBuffer[buffer_offset + bin] = normalizedCdf;
    }
  `

    // 4. LUT应用阶段（带双线性插值）
    const 应用LUT着色器 = /* wgsl */`
    struct CLAHEParams {
      width: u32,
      height: u32,
      clipLimit: f32,
      blockSize: u32,
      numBins: u32,
      strength: f32
    }
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var<storage, read> lutBuffer: array<f32>;
    @group(0) @binding(2) var<uniform> params: CLAHEParams;
    @group(0) @binding(3) var<storage, read_write> outputBuffer: array<u32>;
    
    @compute @workgroup_size(16, 16)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      if (id.x >= params.width || id.y >= params.height) { return; }
      
      let pos = vec2<i32>(id.xy);
      let color = textureLoad(inputTexture, pos, 0);
      let block_id = vec2<u32>(pos) / params.blockSize;
      let local_pos = vec2<f32>(vec2<u32>(pos) % params.blockSize) / f32(params.blockSize);
      
      // 计算网格尺寸
      let numBlocksX = (params.width + params.blockSize - 1u) / params.blockSize;
      let numBlocksY = (params.height + params.blockSize - 1u) / params.blockSize;
      
      // 双线性插值的4个邻居块坐标 (Clamped)
      let bx0 = block_id.x;
      let bx1 = min(bx0 + 1u, numBlocksX - 1u);
      let by0 = block_id.y;
      let by1 = min(by0 + 1u, numBlocksY - 1u);
      
      // 预计算4个块的Buffer起始索引 (Flattened Index: y * W + x)
      // Buffer Layout: Block -> Channel -> Bin
      // Block Offset = BlockIndex * 4 * numBins
      let b00_base = (by0 * numBlocksX + bx0) * 4u * params.numBins;
      let b10_base = (by0 * numBlocksX + bx1) * 4u * params.numBins;
      let b01_base = (by1 * numBlocksX + bx0) * 4u * params.numBins;
      let b11_base = (by1 * numBlocksX + bx1) * 4u * params.numBins;
      
      var enhanced_color = vec4<f32>(0.0);
      
      // 对RGB通道应用CLAHE增强
      for (var c = 0u; c < 3u; c++) {
        let channel_value = color[c];
        let bin = u32(channel_value * f32(params.numBins - 1));
        
        let channel_offset = c * params.numBins;
        
        // 读取4个角落的CDF值
        let cdf00 = lutBuffer[b00_base + channel_offset + bin];
        let cdf10 = lutBuffer[b10_base + channel_offset + bin];
        let cdf01 = lutBuffer[b01_base + channel_offset + bin];
        let cdf11 = lutBuffer[b11_base + channel_offset + bin];
        
        // 双线性插值
        // mix(x, y, a) = x*(1-a) + y*a
        // 先在X方向插值
        let cdf_top = mix(cdf00, cdf10, local_pos.x);
        let cdf_bottom = mix(cdf01, cdf11, local_pos.x);
        
        // 再在Y方向插值
        let cdf_final = mix(cdf_top, cdf_bottom, local_pos.y);
        
        enhanced_color[c] = cdf_final;
      }
      
      // 保留原始Alpha通道
      enhanced_color.a = color.a;
      
      // 混合原始颜色和增强颜色
      let final_color = mix(color, enhanced_color, params.strength);
      
      let index = id.y * params.width + id.x;
      outputBuffer[index] = pack4x8unorm(final_color);
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
