/**
 * 王哈希函数类型定义
 */
export type 王哈希函数 = (seed: number) => number;

/**
 * Wang 哈希函数实现
 * 这是一种用于生成伪随机数的哈希函数
 * @param seed 输入的种子值
 * @returns 哈希后的数值
 */
export const 王哈希: 王哈希函数 = (seed: number): number => {
  let 处理中的种子 = seed;
  处理中的种子 = (处理中的种子 ^ 61) ^ (处理中的种子 >> 16);
  处理中的种子 *= 9;
  处理中的种子 = 处理中的种子 ^ (处理中的种子 >> 4);
  处理中的种子 *= 0x27d4eb2d;
  处理中的种子 = 处理中的种子 ^ (处理中的种子 >> 15);
  return 处理中的种子;
};

// 为了兼容性，导出英文名称
export const wangHash = 王哈希;