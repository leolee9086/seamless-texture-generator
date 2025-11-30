import { projectAndSortPixels } from "./projectAndSortPixels";
import type { 图像输入 } from "../../types/imageProcessing";
import { withPerformanceLogging } from "../performanceRun";
import { mapUniformToGaussian } from "./mapUniformToGaussian";

export async function allocateAndComputeOutput(input: 图像输入, eigenVectors: number[][]): Promise<图像输入> {
    let RGBOffsets=await withPerformanceLogging(projectAndSortPixels)(input, eigenVectors);
    const totalPixels = input.width * input.height;
    const data = new Array(totalPixels * 4).fill(0);
    let output: 图像输入 = { data, width: input.width, height: input.height };
    
    withPerformanceLogging(mapUniformToGaussian)(input, RGBOffsets, output);

    return output;
}
