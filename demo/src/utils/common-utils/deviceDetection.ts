/**
 * 移动设备检测规则列表
 * 每个规则是一个正则表达式，用于匹配特定的设备类型
 * 新增设备类型只需在此数组中添加对应的正则即可
 */
const 移动设备检测规则: RegExp[] = [
    /Android/i,       // 安卓设备
    /webOS/i,         // webOS 设备 (如 LG 智能电视)
    /iPhone/i,        // iPhone
    /iPad/i,          // iPad
    /iPod/i,          // iPod
    /BlackBerry/i,    // 黑莓设备
    /IEMobile/i,      // Windows Phone
    /Opera Mini/i,    // Opera Mini 浏览器
]

/**
 * @AIDONE 已重构为多条件组合模式，提升可扩展性和可维护性
 * @简洁函数 这是一个谓词工具函数，简洁性是其设计目标
 * 检测是否为移动设备
 * @returns 是否为移动设备
 */
export function isMobileDevice(): boolean {
    const userAgent = navigator.userAgent
    return 移动设备检测规则.some(规则 => 规则.test(userAgent))
}

/**
 * @简洁函数 这是一个谓词工具函数，简洁性是其设计目标
 * 检测是否支持原生相机
 * @returns 是否支持原生相机
 */
export function supportsNativeCamera(): boolean {
    const mobile = isMobileDevice()
    const hasCaptureSupport = 'capture' in document.createElement('input')
    return mobile && hasCaptureSupport
}

