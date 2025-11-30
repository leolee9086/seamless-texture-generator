struct Uniforms {
  targetWidth: f32,
  targetHeight: f32,
  borderSize: f32
}

@group(0) @binding(0) var<storage, read> inputData: array<f32>;
@group(0) @binding(1) var<storage, read_write> outputData: array<f32>;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;

// 重映射值函数
fn remapValue(value: f32, low1: f32, high1: f32, low2: f32, high2: f32) -> f32 {
  return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
  let x = global_id.x;
  let y = global_id.y;
  
  // 检查是否在目标图像范围内
  if (f32(x) >= uniforms.targetWidth || f32(y) >= uniforms.targetHeight) {
    return;
  }
  
  let targetWidth = u32(uniforms.targetWidth);
  let targetHeight = u32(uniforms.targetHeight);
  let borderSize = uniforms.borderSize;
  
  // 计算索引 (RGB格式，每个像素3个值)
  let pixelIndex = y * targetWidth + x;
  let rgbIndex = pixelIndex * 3u;
  
  // 计算权重
  var w = min(remapValue(f32(x), 0.0, borderSize, 0.0, 1.0), 1.0); // Left border
  w *= min(remapValue(f32(x), uniforms.targetWidth - 1.0, uniforms.targetWidth - 1.0 - borderSize, 0.0, 1.0), 1.0); // Right border
  w *= min(remapValue(f32(y), 0.0, borderSize, 0.0, 1.0), 1.0); // Top border
  w *= min(remapValue(f32(y), uniforms.targetHeight - 1.0, uniforms.targetHeight - 1.0 - borderSize, 0.0, 1.0), 1.0); // Bottom border
  
  let w_inv = 1.0 - w;
  w = w / sqrt(w * w + w_inv * w_inv);
  
  // 应用混合权重到RGB三个通道
  outputData[rgbIndex] = w * inputData[rgbIndex];         // R通道
  outputData[rgbIndex + 1u] = w * inputData[rgbIndex + 1u]; // G通道
  outputData[rgbIndex + 2u] = w * inputData[rgbIndex + 2u]; // B通道
}