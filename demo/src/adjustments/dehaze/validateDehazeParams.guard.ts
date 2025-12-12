import type { DehazeParams } from './types';

/**
 * 检查参数是否为数字类型
 * @param value 参数值
 * @returns 是否为数字类型
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 检查参数对象中是否存在指定参数
 * @param params 参数对象
 * @param paramName 参数名
 * @returns 是否存在该参数
 */
export function hasParam(params: Partial<DehazeParams>, paramName: string): boolean {
  return paramName in params && params[paramName as keyof DehazeParams] !== undefined;
}

/**
 * 获取参数值（带类型检查）
 * @param params 参数对象
 * @param paramName 参数名
 * @returns 参数值或null
 */
export function getParamValue(params: Partial<DehazeParams>, paramName: string): number | null {
  if (!hasParam(params, paramName)) {
    return null;
  }
  
  const value = params[paramName as keyof DehazeParams];
  return isNumber(value) ? value : null;
}