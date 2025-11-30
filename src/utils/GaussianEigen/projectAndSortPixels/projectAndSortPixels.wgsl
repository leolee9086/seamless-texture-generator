struct Uniforms {
  width: u32,
  height: u32,
};

@group(0) @binding(0) var<storage, read> dataRGBA: array<f32>;
@group(0) @binding(1) var<storage, read> eigenVectors: array<f32>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<f32>;  // 存储交织的RGB值
@group(0) @binding(3) var<storage, read_write> outputOffsets: array<u32>; // 存储交织的像素偏移
@group(0) @binding(4) var<uniform> uniforms: Uniforms;

// 计算点积
fn dotProduct(px: f32, py: f32, pz: f32, ev0: f32, ev1: f32, ev2: f32) -> f32 {
  return px * ev0 + py * ev1 + pz * ev2;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let width = uniforms.width;
  let height = uniforms.height;
  
  let i = global_id.x;
  let j = global_id.y;
  
  // 检查边界
  if (i >= width || j >= height) {
    return;
  }
  
  let pixelIndex = j * width + i;
  let rgbaIndex = pixelIndex * 4u; // 每个像素4个分量(RGBA)
  
  // 直接从RGBA数据中提取RGB值
  let pixelR = dataRGBA[rgbaIndex];
  let pixelG = dataRGBA[rgbaIndex + 1u];
  let pixelB = dataRGBA[rgbaIndex + 2u];
  
  // 计算三个特征向量上的投影值
  let valueR = dotProduct(pixelR, pixelG, pixelB, eigenVectors[0], eigenVectors[1], eigenVectors[2]);
  let valueG = dotProduct(pixelR, pixelG, pixelB, eigenVectors[3], eigenVectors[4], eigenVectors[5]);
  let valueB = dotProduct(pixelR, pixelG, pixelB, eigenVectors[6], eigenVectors[7], eigenVectors[8]);
  
  // 存储交织的投影结果，使用像素索引作为偏移（三个通道对应同一个像素）
  let pixelOffset = pixelIndex;
  outputValues[pixelIndex * 3u] = valueR;
  outputValues[pixelIndex * 3u + 1u] = valueG;
  outputValues[pixelIndex * 3u + 2u] = valueB;
  outputOffsets[pixelIndex * 3u] = pixelOffset;
  outputOffsets[pixelIndex * 3u + 1u] = pixelOffset;
  outputOffsets[pixelIndex * 3u + 2u] = pixelOffset;
}