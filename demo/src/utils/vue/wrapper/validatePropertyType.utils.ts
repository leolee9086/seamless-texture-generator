import { VALIDATION_CONSTANTS } from './constants';

/**
 * 验证属性类型的辅助函数
 * @param params 验证参数对象
 */
export function validatePropertyType(params: {
  obj: unknown;
  path: string;
  expectedType: 'function' | 'object' | 'string' | 'boolean';
  errors: string[];
}): void {
  const { obj, path, expectedType, errors } = params;

  // 合并条件判断，避免嵌套if
  if (obj !== null && obj !== undefined && typeof obj !== expectedType) {
    const errorMessage = VALIDATION_CONSTANTS.STRING_GENERATORS.createTypeErrorMessage(path, expectedType);
    errors.push(errorMessage);

  }
}
