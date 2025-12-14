#!/usr/bin/env node

/**
 * 函数最小行数健康度检查脚本
 * 
 * 专门用于检查函数实际行数是否少于3行
 * 这个脚本独立于ESLint，可以单独运行
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    minLines: 3,
    targetDirectory: './src',
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    excludeDirectories: ['node_modules', 'dist', '.git', 'coverage'],
    excludeFiles: ['*.d.ts']
};

/**
 * 检查路径是否应该被排除
 */
function shouldExcludePath(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // 检查是否在排除目录中
    for (const dir of CONFIG.excludeDirectories) {
        if (normalizedPath.includes(`/${dir}/`) || normalizedPath.startsWith(`${dir}/`)) {
            return true;
        }
    }
    
    // 检查文件扩展名
    const ext = path.extname(filePath);
    if (!CONFIG.fileExtensions.includes(ext)) {
        return true;
    }
    
    // 检查排除文件模式
    for (const pattern of CONFIG.excludeFiles) {
        if (normalizedPath.endsWith(pattern.replace('*', ''))) {
            return true;
        }
    }
    
    return false;
}

/**
 * 递归获取所有符合条件的文件
 */
function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            if (!CONFIG.excludeDirectories.includes(file)) {
                getAllFiles(filePath, fileList);
            }
        } else {
            if (!shouldExcludePath(filePath)) {
                fileList.push(filePath);
            }
        }
    });
    
    return fileList;
}

/**
 * 计算函数的实际行数（排除空行、注释和函数声明行）
 */
function calculateActualFunctionLines(lines, startLine, endLine) {
    let actualLines = 0;
    
    for (let i = startLine; i <= endLine && i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过空行
        if (line.trim() === '') continue;
        
        // 跳过只包含注释的行
        if (line.trim().startsWith('//') || 
            line.trim().startsWith('/*') || 
            line.trim().startsWith('*') ||
            line.trim().startsWith('*')) continue;
        
        // 跳过函数声明行和函数体的大括号行
        if (i === startLine || 
            line.trim() === '{' || 
            line.trim() === '}' ||
            line.trim().startsWith('function ') ||
            line.trim().startsWith('const ') ||
            line.trim().startsWith('let ') ||
            line.trim().startsWith('var ')) continue;
        
        actualLines++;
    }
    
    return actualLines;
}

/**
 * 分析单个文件中的函数
 */
function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    // 简单的函数匹配正则表达式
    const functionPatterns = [
        // 函数声明: function name() {}
        /function\s+(\w+)\s*\([^)]*\)\s*\{/g,
        // 箭头函数: const name = () => {}
        /(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{/g,
        // 方法: name() {}
        /(\w+)\s*\([^)]*\)\s*\{/g,
        // 异步函数: async function name() {}
        /async\s+function\s+(\w+)\s*\([^)]*\)\s*\{/g,
        // 异步箭头函数: const name = async () => {}
        /(?:const|let|var)\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*=>\s*\{/g
    ];
    
    functionPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const functionName = match[1];
            const matchStart = match.index;
            const matchLine = content.substring(0, matchStart).split('\n').length - 1;
            
            // 查找函数体的结束位置
            let braceCount = 0;
            let functionStartLine = matchLine;
            let functionEndLine = matchLine;
            let foundStart = false;
            
            for (let i = matchLine; i < lines.length; i++) {
                const line = lines[i];
                
                for (let j = 0; j < line.length; j++) {
                    if (line[j] === '{') {
                        braceCount++;
                        if (!foundStart) {
                            functionStartLine = i;
                            foundStart = true;
                        }
                    } else if (line[j] === '}') {
                        braceCount--;
                        if (foundStart && braceCount === 0) {
                            functionEndLine = i;
                            break;
                        }
                    }
                }
                
                if (foundStart && braceCount === 0) {
                    break;
                }
            }
            
            // 计算实际行数
            const actualLines = calculateActualFunctionLines(lines, functionStartLine, functionEndLine);
            
            if (actualLines < CONFIG.minLines && actualLines > 0) {
                issues.push({
                    functionName,
                    line: functionStartLine + 1, // 转换为1基索引
                    actualLines,
                    filePath
                });
            }
        }
    });
    
    return issues;
}

/**
 * 主函数
 */
function main() {
    console.log('🔍 开始检查函数最小行数...\n');
    
    const targetDir = path.resolve(CONFIG.targetDirectory);
    
    if (!fs.existsSync(targetDir)) {
        console.error(`❌ 目标目录不存在: ${targetDir}`);
        process.exit(1);
    }
    
    const files = getAllFiles(targetDir);
    console.log(`📁 找到 ${files.length} 个文件需要检查\n`);
    
    let totalIssues = 0;
    const allIssues = [];
    
    files.forEach(filePath => {
        const issues = analyzeFile(filePath);
        if (issues.length > 0) {
            allIssues.push({ filePath, issues });
            totalIssues += issues.length;
        }
    });
    
    // 输出结果
    if (totalIssues === 0) {
        console.log('✅ 所有函数都符合最小行数要求！');
    } else {
        console.log(`❌ 发现 ${totalIssues} 个函数行数过少的问题：\n`);
        
        allIssues.forEach(({ filePath, issues }) => {
            console.log(`📄 ${filePath}`);
            issues.forEach(issue => {
                console.log(`   📍 第${issue.line}行: 函数 '${issue.functionName}' 只有 ${issue.actualLines} 行实际代码`);
            });
            console.log('');
        });
        
        console.log('💡 建议:');
        console.log('   - 考虑将过于简单的函数合并到调用处');
        console.log('   - 或者增加函数的功能，避免过度拆分');
        console.log('   - 确保每个函数都有足够的逻辑价值');
    }
    
    console.log(`\n🏁 检查完成！共检查了 ${files.length} 个文件`);
    
    // 设置退出码
    process.exit(totalIssues > 0 ? 1 : 0);
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    analyzeFile,
    getAllFiles,
    calculateActualFunctionLines,
    CONFIG
};