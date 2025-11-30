import { emptyImageInput, imageDataToImageInput } from "../utils/imageInputTransform";
import { unmakeHistoGaussianEigen, makeHistoGaussianEigen } from "../utils/GaussianEigen"
import { withPerformanceLogging } from "../utils/performanceRun";
import { wangHash } from "../utils/wangHash";
import { applyTileBlending } from "./applyTileBlending";
import { applyBorderBlendingWebGPU } from "./applyBorderBlending/applyBorderBlendingWebGPU";
import type { 图像输入, WebGPU图像数据数组RGB, WebGPU图像数据数组RGBA, WebGPU图像数据数组, 瓦片参数, 瓦片中心和偏移量 } from "../types/imageProcessing";

/***
 * 用于将贴图进行无缝化
 * 原始算法来自https://unity-grenoble.github.io/website/demo/2020/10/16/demo-histogram-preserving-blend-make-tileable.html
 * 有一定修改以便于加快运行速度
 */

/****************** ALGORITHM *****************/
/**********************************************/
/**********************************************/
/**********************************************/
/**********************************************/
var rngState = 0;

const randXorshift = (): void => {
    // Xorshift algorithm from George Marsaglia's paper
    rngState ^= (rngState << 13);
    rngState ^= (rngState >> 17);
    rngState ^= (rngState << 5);
    rngState = customModulo(rngState, 4294967296);
};

export const randXorshiftFloat = (): number => {
    randXorshift();
    const res = rngState * (1.0 / 4294967296.0);
    return res;
};
const setSeed = (i: number): void => {
    rngState = wangHash(i);
};
export const customModulo = (x: number, n: number): number => {
    let r = x % n;
    if (r < 0) {
        r += n;
    }
    return r;
};
const getBorderSize = (num: number, imageInput: 图像输入): number => {
    const pos = num / 100;
    return Math.max(Math.floor(pos * Math.min(imageInput.width, imageInput.height) / 2.0), 2);
};
const calculateTileParameters = (targetWidth: number, targetHeight: number, borderSize: number): 瓦片参数 => {
    let tileCountWidth = Math.floor(targetWidth / borderSize);
    let tileRadiusWidth = borderSize;
    let restWidth = targetWidth - tileRadiusWidth * tileCountWidth;
    tileRadiusWidth += Math.floor(restWidth / tileCountWidth);
    restWidth = targetWidth - tileRadiusWidth * tileCountWidth;

    let tileCountHeight = Math.floor(targetHeight / borderSize);
    let tileRadiusHeight = borderSize;
    let restHeight = targetHeight - tileRadiusHeight * tileCountHeight;
    tileRadiusHeight += Math.floor(restHeight / tileCountHeight);
    restHeight = targetHeight - tileRadiusHeight * tileCountHeight;

    let tileWidth = tileRadiusWidth * 2;
    let tileHeight = tileRadiusHeight * 2;

    return {
        tileCountWidth,
        tileRadiusWidth,
        restWidth,
        tileCountHeight,
        tileRadiusHeight,
        restHeight,
        tileWidth,
        tileHeight
    };
};
export const calculateTileCenterAndOffset = (
    i_tile: number,
    j_tile: number,
    tileCountWidth: number,
    tileCountHeight: number,
    restWidth: number,
    restHeight: number
): 瓦片中心和偏移量 => {
    let tileCenterWidth = 0, tileCenterHeight = 0;
    let cumulativeOffsetWidth = 0, cumulativeOffsetHeight = 0;

    if (i_tile > tileCountWidth - 2 - restWidth) {
        tileCenterWidth = 1;
        cumulativeOffsetWidth = (i_tile - 1) - (tileCountWidth - 2 - restWidth);
    } else if (j_tile > tileCountHeight - 2 - restHeight) {
        tileCenterHeight = 1;
        cumulativeOffsetHeight = (j_tile - 1) - (tileCountHeight - 2 - restHeight);
    }

    return { tileCenterWidth, tileCenterHeight, cumulativeOffsetWidth, cumulativeOffsetHeight };
};


/**
 * 将RGB格式的图像数据转换为RGBA格式
 * @param rgbData - RGB格式的图像数据
 * @param width - 图像宽度
 * @param height - 图像高度
 * @returns RGBA格式的图像数据
 */
const 转换RGB到RGBA = (rgbData: Float32Array, width: number, height: number): Float32Array => {
    const totalPixels = width * height;
    const rgbaData = new Float32Array(totalPixels * 4);

    for (let i = 0; i < totalPixels; i++) {
        const rgbPixelIndex = i * 3;
        const rgbaPixelIndex = i * 4;
        rgbaData[rgbaPixelIndex] = rgbData[rgbPixelIndex];
        rgbaData[rgbaPixelIndex + 1] = rgbData[rgbPixelIndex + 1];
        rgbaData[rgbaPixelIndex + 2] = rgbData[rgbPixelIndex + 2];
        rgbaData[rgbaPixelIndex + 3] = 255; // Alpha 通道默认为 255
    }

    return rgbaData;
};

/**
 * 将RGBA格式的图像数据转换为RGB格式
 * @param rgbaData - RGBA格式的图像数据
 * @param width - 图像宽度
 * @param height - 图像高度
 * @returns RGB格式的图像数据
 */
const 转换RGBA到RGB = (rgbaData: Float32Array, width: number, height: number): Float32Array => {
    const totalPixels = width * height;
    const rgbData = new Float32Array(totalPixels * 3);

    for (let i = 0; i < totalPixels; i++) {
        const rgbaPixelIndex = i * 4;
        const rgbPixelIndex = i * 3;
        rgbData[rgbPixelIndex] = rgbaData[rgbaPixelIndex];
        rgbData[rgbPixelIndex + 1] = rgbaData[rgbaPixelIndex + 1];
        rgbData[rgbPixelIndex + 2] = rgbaData[rgbaPixelIndex + 2];
    }

    return rgbData;
};

// algorithm main function
export const makeTileable = async (
    _imageInput: ImageData,
    _borderSize: number,
    canvas: HTMLCanvasElement | null
): Promise<ImageData> => {
    // Set random seed
    const start = performance.now();
    setSeed(4256);
    const borderSize = getBorderSize(_borderSize, imageDataToImageInput(_imageInput));
    const imageInput = imageDataToImageInput(_imageInput);
    // get algorithm parameters from UI
    const targetWidth = imageInput.width;
    const targetHeight = imageInput.height;
    // Compute adjusted optimal tile size for selected border size
    const tileParameters = calculateTileParameters(targetWidth, targetHeight, borderSize);
    // Allocate output image
    const end1 = performance.now();
    console.log(`setSeed: ${end1 - start} ms`);
    let output = emptyImageInput(targetWidth, targetHeight);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.putImageData(new ImageData(new Uint8ClampedArray(output.data), output.width, output.height), 0, 0);
        }
    }
    const imageGaussianedResult = await withPerformanceLogging(makeHistoGaussianEigen)(imageInput);
    const { eigenVectors } = imageGaussianedResult;
    const imageInputGaussian = imageGaussianedResult.output;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.putImageData(new ImageData(new Uint8ClampedArray(imageInputGaussian.data), imageInputGaussian.width, imageInputGaussian.height), 0, 0);
        }
    }
    const end2 = performance.now();
    console.log(`setSeed: ${end2 - start} ms`);
    // --- 修复调用 applyBorderBlendingWebGPU ---
    // 1. 转换数据结构
    // 将RGBA格式的图像数据转换为RGB格式
    const rgbaData = new Float32Array(imageInputGaussian.data);
    const rgbData = 转换RGBA到RGB(rgbaData, imageInputGaussian.width, imageInputGaussian.height);

    // 2. 调用新的 API (移除了 output 参数)
    const blendedResult = await withPerformanceLogging(applyBorderBlendingWebGPU)(
        {
            data: rgbData,
            width: imageInputGaussian.width,
            height: imageInputGaussian.height
        },
        targetWidth,
        targetHeight,
        borderSize
    );

    // 将RGB格式的数据转换为RGBA格式并合并到 output 的扁平化结构中
    const blendedRGBAData = 转换RGB到RGBA(blendedResult.data, targetWidth, targetHeight);
    output.data = Array.from(blendedRGBAData);
    // --- 修复结束 ---

    withPerformanceLogging(applyTileBlending)(output, imageInputGaussian, tileParameters, targetWidth, targetHeight);

    // make output image have same histogram as input
    output = await withPerformanceLogging(unmakeHistoGaussianEigen)(output, imageInput, eigenVectors);
    const outputImageData = new ImageData(new Uint8ClampedArray(output.data), output.width, output.height);
    const end3 = performance.now();
    console.log(`setSeed: ${end3 - start} ms`);
    // return histogramMatchGPU(outputImageData,_imageInput)
    return outputImageData;
};
