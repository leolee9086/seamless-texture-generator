/**
 * 使用 CPU 对像素投影数据进行排序,仅仅在测试中用于校验GPU实现的正确性
 * @param Rvalues - R通道的值数组
 * @param Gvalues - G通道的值数组
 * @param Bvalues - B通道的值数组
 * @param pixelOffsets - 像素偏移数组
 * @returns 排序后的RGB像素偏移数组
 * 仅在诊断时使用
 */
export const 使用CPU排序像素偏移 = (
    Rvalues: Float32Array,
    Gvalues: Float32Array,
    Bvalues: Float32Array,
    pixelOffsets: Uint32Array
): Uint32Array => {
    // 使用新的通用函数实现，保持接口兼容性
    return 使用CPU排序像素偏移_通用([Rvalues, Gvalues, Bvalues], pixelOffsets, 3);
};

/**
 * 使用 CPU 对像素投影数据进行排序（支持任意通道数）
 * @param channelValues - 各通道的值数组数组
 * @param pixelOffsets - 像素偏移数组
 * @param channelCount - 通道数量
 * @returns 排序后的像素偏移数组
 */
export const 使用CPU排序像素偏移_通用 = (
    channelValues: Float32Array[],
    pixelOffsets: Uint32Array,
    channelCount: number
): Uint32Array => {
    const originalElementCount = channelValues[0].length;
    
    // 准备多通道值数据和像素偏移数据
    const multiChannelValues = new Float32Array(originalElementCount * channelCount);
    const multiChannelPixelOffsets = new Uint32Array(originalElementCount * channelCount);
    
    for (let i = 0; i < originalElementCount; i++) {
        for (let channel = 0; channel < channelCount; channel++) {
            multiChannelValues[i * channelCount + channel] = channelValues[channel][i];
            multiChannelPixelOffsets[i * channelCount + channel] = pixelOffsets[i];
        }
    }
    
    // 为每个通道执行排序
    for (let channel = 0; channel < channelCount; channel++) {
        // 1. 提取通道数据
        const channelData = new Float32Array(originalElementCount);
        const channelOffsets = new Uint32Array(originalElementCount);
        
        for (let i = 0; i < originalElementCount; i++) {
            channelData[i] = multiChannelValues[i * channelCount + channel];
            channelOffsets[i] = multiChannelPixelOffsets[i * channelCount + channel];
        }
        
        // 2. 执行双调排序
        双调排序通道(channelData, channelOffsets);
        
        // 3. 写回排序后的数据
        for (let i = 0; i < originalElementCount; i++) {
            multiChannelPixelOffsets[i * channelCount + channel] = channelOffsets[i];
        }
    }
    
    return multiChannelPixelOffsets;
};

/**
 * 双调排序算法实现
 * @param values - 值数组
 * @param offsets - 偏移数组
 */
const 双调排序通道 = (values: Float32Array, offsets: Uint32Array): void => {
    const n = values.length;
    
    // 如果元素数量不是2的幂，填充到下一个2的幂
    let paddedN = n;
    if ((n & (n - 1)) !== 0) {
        paddedN = 1 << Math.ceil(Math.log2(n));
    }
    
    // 创建填充后的数组
    const paddedValues = new Float32Array(paddedN);
    const paddedOffsets = new Uint32Array(paddedN);
    
    // 复制原始数据
    for (let i = 0; i < n; i++) {
        paddedValues[i] = values[i];
        paddedOffsets[i] = offsets[i];
    }
    
    // 填充剩余部分
    for (let i = n; i < paddedN; i++) {
        paddedValues[i] = Infinity;
        paddedOffsets[i] = 0;
    }
    
    // 执行双调排序
    for (let k = 2; k <= paddedN; k *= 2) {
        for (let j = k >> 1; j > 0; j >>= 1) {
            for (let i = 0; i < paddedN; i++) {
                const ix = i ^ j;
                if (ix > i && ix < paddedN) {
                    const direction = (i & k) === 0;
                    if (direction === (paddedValues[i] > paddedValues[ix])) {
                        // 交换值
                        const tempValue = paddedValues[i];
                        paddedValues[i] = paddedValues[ix];
                        paddedValues[ix] = tempValue;
                        
                        // 交换偏移
                        const tempOffset = paddedOffsets[i];
                        paddedOffsets[i] = paddedOffsets[ix];
                        paddedOffsets[ix] = tempOffset;
                    }
                }
            }
        }
    }
    
    // 将排序后的数据复制回原数组
    for (let i = 0; i < n; i++) {
        values[i] = paddedValues[i];
        offsets[i] = paddedOffsets[i];
    }
};