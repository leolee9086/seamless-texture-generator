/**
 * @fileoverview CLAHE 着色器生成模块
 * 生成WGSL着色器代码
 * 
 * @author 织
 * @version 1.0.0
 */

/**
 * 生成CLAHE四阶段WGSL着色器代码
 * @param {Object} params - 算法参数
 * @param {number} params.clipLimit - 对比度限制
 * @param {number} params.blockSize - 分块大小
 * @param {number} params.numBins - 直方图bin数
 * @returns {Object} 包含四阶段WGSL代码的对象
 */
export function generateCLAHEShaders(params) {
  const { clipLimit = 2.0, blockSize = 64, numBins = 256 } = params;

  // 1. 直方图计算阶段
  const histogramShader = `
    struct CLAHEParams {
      width: u32,
      height: u32,
      clipLimit: f32,
      blockSize: u32,
      numBins: u32
    }
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var<storage, read_write> histogramBuffer: array<u32>;
    @group(0) @binding(2) var<uniform> params: CLAHEParams;
    var<workgroup> histogram: array<array<u32, ${numBins}>, 4>;
    @compute @workgroup_size(${blockSize}, ${blockSize})
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let block_id = id.xy / ${blockSize}u;
      let local_pos = id.xy % ${blockSize}u;
      if (local_pos.x < ${numBins}u && local_pos.y < 4u) {
        histogram[local_pos.y][local_pos.x] = 0u;
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
      if (local_pos.x < ${numBins}u && local_pos.y < 4u) {
        let buffer_index = (block_id.y * u32(params.width / ${blockSize}) + block_id.x) * ${numBins * 4}u + local_pos.y * ${numBins}u + local_pos.x;
        histogramBuffer[buffer_index] = histogram[local_pos.y][local_pos.x];
      }
    }
  `;

  // 2. 对比度限制阶段
  const clipShader = `
    @group(0) @binding(0) var<storage, read_write> histogramBuffer: array<u32>;
    @group(0) @binding(1) var<storage, read_write> excessBuffer: array<u32>;
    @group(0) @binding(2) var<uniform> params: CLAHEParams;
    @compute @workgroup_size(${numBins}, 1)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let block_id = id.x / ${numBins}u;
      let channel = (id.x % ${numBins * 4}u) / ${numBins}u;
      let bin = id.x % ${numBins}u;
      let buffer_offset = block_id * ${numBins * 4}u + channel * ${numBins}u;
      let clip_limit = u32(params.clipLimit * f32(params.blockSize * params.blockSize) / f32(params.numBins));
      let original_count = histogramBuffer[buffer_offset + bin];
      let clipped_count = min(original_count, clip_limit);
      let excess = original_count - clipped_count;
      let total_excess = atomicAdd(&excessBuffer[block_id * 4u + channel], excess);
      histogramBuffer[buffer_offset + bin] = clipped_count;
    }
  `;

  // 3. 累积分布计算阶段
  const cdfShader = `
    @group(0) @binding(0) var<storage, read_write> histogramBuffer: array<u32>;
    @group(0) @binding(1) var lutTexture: texture_storage_2d<rgba8unorm, write>;
    @group(0) @binding(2) var<uniform> params: CLAHEParams;
    @compute @workgroup_size(${numBins}, 1)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let block_id = id.x / ${numBins}u;
      let channel = (id.x % ${numBins * 4}u) / ${numBins}u;
      let bin = id.x % ${numBins}u;
      let buffer_offset = block_id * ${numBins * 4}u + channel * ${numBins}u;
      var cdf = 0u;
      for (var i = 0u; i <= bin; i++) {
        cdf += histogramBuffer[buffer_offset + i];
      }
      let lut_pos = vec2<u32>(bin, block_id * 4u + channel);
      textureStore(lutTexture, vec2<i32>(lut_pos), vec4<f32>(f32(cdf) / f32(params.blockSize * params.blockSize)));
    }
  `;

  // 4. LUT应用阶段
  const applyLUTShader = `
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var lutTexture: texture_2d<f32>;
    @group(0) @binding(2) var<uniform> params: CLAHEParams;
    @group(0) @binding(3) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @compute @workgroup_size(16, 16)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let pos = vec2<i32>(id.xy);
      let color = textureLoad(inputTexture, pos, 0);
      let block_id = vec2<u32>(pos) / params.blockSize;
      let local_pos = vec2<f32>(pos) / f32(params.blockSize) - vec2<f32>(block_id);
      var enhanced_color = vec4<f32>(0.0);
      for (var c = 0; c < 4; c++) {
        let channel_value = color[c];
        let bin = u32(channel_value * f32(params.numBins - 1));
        let cdf_00 = textureLoad(lutTexture, vec2<i32>(bin, block_id.y * 4 + c), 0);
        let cdf_01 = textureLoad(lutTexture, vec2<i32>(bin + 1, block_id.y * 4 + c), 0);
        let cdf_10 = textureLoad(lutTexture, vec2<i32>(bin, (block_id.y + 1) * 4 + c), 0);
        let cdf_11 = textureLoad(lutTexture, vec2<i32>(bin + 1, (block_id.y + 1) * 4 + c), 0);
        let cdf_interp = mix(
          mix(cdf_00, cdf_01, local_pos.x),
          mix(cdf_10, cdf_11, local_pos.x),
          local_pos.y
        );
        enhanced_color[c] = cdf_interp.x;
      }
      textureStore(outputTexture, pos, enhanced_color);
    }
  `;

  return {
    histogramShader,
    clipShader,
    cdfShader,
    applyLUTShader
  };
} 