/**
 * 函数最小行数检查规则
 * 
 * 检查函数实际行数是否少于3行
 * 这有助于识别过于简单的函数，可能需要合并或重构
 */

/**
 * 提示词字典
 */
export const PROMPTS = {
    FUNCTION_TOO_SHORT: {
        id: 'FUNC-001: Too Short Function',
        mode: 'CODE_REFACTORING_SPECIALIST',
        reason: "检测到函数实际行数少于3行。",
        action: "请考虑将此函数合并到调用处或增加功能，避免过度拆分。"
    }
};

/**
 * 生成 Agent 指令信息
 */
export function generateAgentInstruction(prompt: any): string {
    return `🤖 Agent指令: ${prompt.id} | ${prompt.mode}\n${prompt.reason}\n${prompt.action}`;
}

/**
 * 计算函数的实际行数（排除空行和注释）
 */
function calculateActualFunctionLines(node: any, sourceCode: any): number {
    if (!node.loc) return 0;
    
    const lines = sourceCode.getLines();
    const startLine = node.loc.start.line - 1; // 转换为0基索引
    const endLine = node.loc.end.line - 1;
    
    let actualLines = 0;
    
    for (let i = startLine; i <= endLine; i++) {
        const line = lines[i];
        
        // 跳过空行
        if (line.trim() === '') continue;
        
        // 跳过只包含注释的行
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) continue;
        
        // 跳过函数声明行和函数体的大括号行
        if (i === startLine || line.trim() === '{' || line.trim() === '}') continue;
        
        actualLines++;
    }
    
    return actualLines;
}

/**
 * 函数最小行数检查插件
 */
export const functionMinLinesPlugin = {
    rules: {
        'function-min-lines': {
            meta: { 
                type: 'problem',
                docs: {
                    description: '检查函数实际行数是否少于3行',
                    category: 'Best Practices',
                    recommended: true
                }
            },
            create(context: any) {
                const MIN_LINES = 3;
                const sourceCode = context.getSourceCode();
                
                return {
                    // 检查函数声明
                    FunctionDeclaration(node: any) {
                        const actualLines = calculateActualFunctionLines(node, sourceCode);
                        if (actualLines < MIN_LINES && actualLines > 0) {
                            context.report({
                                node,
                                message: generateAgentInstruction(PROMPTS.FUNCTION_TOO_SHORT)
                            });
                        }
                    },
                    // 检查箭头函数
                    ArrowFunctionExpression(node: any) {
                        const actualLines = calculateActualFunctionLines(node, sourceCode);
                        if (actualLines < MIN_LINES && actualLines > 0) {
                            context.report({
                                node,
                                message: generateAgentInstruction(PROMPTS.FUNCTION_TOO_SHORT)
                            });
                        }
                    },
                    // 检查函数表达式
                    FunctionExpression(node: any) {
                        const actualLines = calculateActualFunctionLines(node, sourceCode);
                        if (actualLines < MIN_LINES && actualLines > 0) {
                            context.report({
                                node,
                                message: generateAgentInstruction(PROMPTS.FUNCTION_TOO_SHORT)
                            });
                        }
                    },
                    // 检查类方法
                    MethodDefinition(node: any) {
                        if (node.value && (node.value.type === 'FunctionExpression' || node.value.type === 'ArrowFunctionExpression')) {
                            const actualLines = calculateActualFunctionLines(node.value, sourceCode);
                            if (actualLines < MIN_LINES && actualLines > 0) {
                                context.report({
                                    node,
                                    message: generateAgentInstruction(PROMPTS.FUNCTION_TOO_SHORT)
                                });
                            }
                        }
                    }
                };
            }
        }
    }
};