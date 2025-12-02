export const 生成全白RGBA图像数据 = (width: number, height: number): Uint8Array => {
    const maskSize = width * height * 4
    const whiteMask = new Uint8Array(maskSize)
    for (let i = 0; i < maskSize; i += 4) {
        whiteMask[i] = 255     // R
        whiteMask[i + 1] = 255 // G
        whiteMask[i + 2] = 255 // B
        whiteMask[i + 3] = 255 // A
    }
    return whiteMask
}
