import type { HSLAdjustmentParams } from './hsl-shaders.types';

/**
 * 将十六进制颜色转换为HSL
 */
export function hexToHsl(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];

    const redValue = parseInt(result[1] ?? '0', 16) / 255;
    const greenValue = parseInt(result[2] ?? '0', 16) / 255;
    const blueValue = parseInt(result[3] ?? '0', 16) / 255;

    const maxValue = Math.max(redValue, greenValue, blueValue);
    const minValue = Math.min(redValue, greenValue, blueValue);
    let hueValue = 0, saturationValue = 0;
    const lightnessValue = (maxValue + minValue) / 2;

    if (maxValue !== minValue) {
        const deltaValue = maxValue - minValue;
        saturationValue = lightnessValue > 0.5 ?
            deltaValue / (2 - maxValue - minValue) :
            deltaValue / (maxValue + minValue);
        
        // 使用对象字面量替代switch语句
        const hueCalculationMap: { [key: number]: () => number } = {
            [redValue]: (): number => ((greenValue - blueValue) / deltaValue + (greenValue < blueValue ? 6 : 0)) / 6,
            [greenValue]: (): number => ((blueValue - redValue) / deltaValue + 2) / 6,
            [blueValue]: (): number => ((redValue - greenValue) / deltaValue + 4) / 6
        };
        
        // 找到最大值对应的计算函数并执行
        for (const [key, calcFunc] of Object.entries(hueCalculationMap)) {
            if (parseFloat(key) === maxValue) {
                hueValue = calcFunc();
                break;
            }
        }
    }

    return [hueValue, saturationValue, lightnessValue];
}

/**
 * 创建HSL参数缓冲区数据
 */
export function createHSLParams(params: HSLAdjustmentParams): Float32Array {
    const [targetHue, targetSaturation] = hexToHsl(params.targetColor);

    const maskModeValue = params.maskMode === 'adjust' ? 0 :
        params.maskMode === 'mask' ? 1 : 2;

    const overlayColor = params.overlayColor || [1.0, 0.0, 0.0]; // 默认红色
    const overlayAlpha = params.overlayAlpha ?? 0.6; // 默认60%透明度

    // 创建16个元素的数组以满足16字节对齐要求
    const data = new Float32Array(16)

    // 填充实际的13个参数值
    data[0] = targetHue                    // targetHue (Offset 0)
    data[1] = targetSaturation            // targetSaturation (Offset 4)
    data[2] = params.hueOffset / 360     // hueOffset (Offset 8)
    data[3] = params.saturationOffset / 100 // saturationOffset (Offset 12)
    data[4] = params.lightnessOffset / 100  // lightnessOffset (Offset 16)
    data[5] = params.precision           // precision (Offset 20)
    data[6] = params.range               // range (Offset 24)
    data[7] = params.maskMode === 'none' ? 0 : 1 // enableMask (Offset 28)
    data[8] = maskModeValue              // maskMode (Offset 32)

    // Padding (Offset 36-48) - 3 floats (12 bytes) to align vec3 to 16 bytes
    data[9] = 0
    data[10] = 0
    data[11] = 0

    data[12] = overlayColor[0]           // overlayColor.r (Offset 48)
    data[13] = overlayColor[1]           // overlayColor.g (Offset 52)
    data[14] = overlayColor[2]           // overlayColor.b (Offset 56)
    data[15] = overlayAlpha              // overlayAlpha (Offset 60)

    return data
}