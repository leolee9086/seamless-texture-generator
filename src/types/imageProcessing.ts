// 图像处理相关类型定义

/**
 * 图像输入格式，包含扁平化的像素数据（按[R, G, B, A, R, G, B, A, ...]顺序排列）和图像尺寸
 */
export interface 图像输入 {
  data: number[];
  width: number;
  height: number;
}

/**
 * WebGPU图像数据数组格式（RGBA）
 * 数据按[R, G, B, A, R, G, B, A, ...]顺序排列，与canvas对齐
 */
export interface WebGPU图像数据数组RGBA {
  data: Float32Array;
  width: number;
  height: number;
}

/**
 * WebGPU图像数据数组格式（RGB）
 * 数据按[R, G, B, R, G, B, ...]顺序排列
 */
export interface WebGPU图像数据数组RGB {
  data: Float32Array;
  width: number;
  height: number;
}

/**
 * WebGPU图像数据数组格式（兼容性，默认使用RGBA）
 * @deprecated 请使用WebGPU图像数据数组RGBA或WebGPU图像数据数组RGB
 */
export interface WebGPU图像数据数组 extends WebGPU图像数据数组RGBA {}

/**
 * 瓦片参数
 */
export interface 瓦片参数 {
  tileCountWidth: number;
  tileRadiusWidth: number;
  restWidth: number;
  tileCountHeight: number;
  tileRadiusHeight: number;
  restHeight: number;
  tileWidth: number;
  tileHeight: number;
}

/**
 * 瓦片中心和偏移量
 */
export interface 瓦片中心和偏移量 {
  tileCenterWidth: number;
  tileCenterHeight: number;
  cumulativeOffsetWidth: number;
  cumulativeOffsetHeight: number;
}