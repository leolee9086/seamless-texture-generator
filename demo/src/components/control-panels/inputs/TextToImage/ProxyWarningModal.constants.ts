/**
 * 代理警告弹窗相关常量
 */

export const PROXY_WARNING = {
    TITLE: '⚠️ 代理服务不可用',

    DESCRIPTION: `由于浏览器的 CORS（跨域资源共享）安全策略限制，直接访问 ModelScope API 将被阻止。没有可用的代理服务，文本生成图片功能很可能会失败。`,

    REQUIREMENTS_TITLE: '代理服务要求',

    REQUIREMENTS: [
        '代理需支持 ?target=encodedUrl 转发形式',
        '代理需要正确处理跨域请求头（CORS）',
        '建议使用本地开发服务器自带的代理（如 Vite dev server）',
    ],

    SOLUTIONS_TITLE: '解决方案',

    SOLUTIONS: [
        '使用 npm run dev 启动本地开发服务器',
        '在高级参数中配置可用的代理 URL',
        '部署到支持代理的服务器环境',
    ],

    BUTTONS: {
        CONTINUE: '继续尝试',
        CANCEL: '取消',
    },

    CONTINUE_WARNING: '继续操作可能会因 CORS 限制而失败',
} as const

/**
 * 代理检测相关常量
 */
export const PROXY_CHECK = {
    // 检测超时时间（毫秒）
    TIMEOUT: 5000,

    // 用于检测的测试URL（一个简单的健康检查端点）
    TEST_TARGET: 'https://httpstat.us/200',

    // 状态消息
    STATUS: {
        CHECKING: '检查代理可用性...',
    },

    // 错误消息
    ERRORS: {
        UNAVAILABLE: '默认代理不可用',
        TIMEOUT: '代理检测超时',
    },
} as const
