// 将遮罩放大到目标尺寸
export const upscaleMask = (mask: Uint8Array, srcWidth: number, srcHeight: number, dstWidth: number, dstHeight: number): Uint8Array => {
    const upscaledMask = new Uint8Array(dstWidth * dstHeight)
    for (let y = 0; y < dstHeight; y++) {
        for (let x = 0; x < dstWidth; x++) {
            // 计算源坐标
            const srcX = Math.floor((x / dstWidth) * srcWidth)
            const srcY = Math.floor((y / dstHeight) * srcHeight)
            // 确保坐标在有效范围内
            const clampedSrcX = Math.min(Math.max(srcX, 0), srcWidth - 1)
            const clampedSrcY = Math.min(Math.max(srcY, 0), srcHeight - 1)
            // 获取源像素值
            const srcIndex = clampedSrcY * srcWidth + clampedSrcX
            const dstIndex = y * dstWidth + x
            upscaledMask[dstIndex] = mask[srcIndex]
        }
    }
    return upscaledMask
}

