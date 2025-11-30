import type { 图像输入 } from "../../types/imageProcessing";
import { withPerformanceLogging } from "../performanceRun";
import { allocateAndComputeOutput } from "./allocateAndComputeOutput";
import { getImageRGBEigenVectors } from "./getImageRGBEigenVectors";
import { initializeEigenVectors } from "./initializeEigenVectors";


export async function makeHistoGaussianEigen(input: 图像输入) {
    let eigenVectors = initializeEigenVectors();
    eigenVectors = await withPerformanceLogging(getImageRGBEigenVectors)(input, eigenVectors);
    let output = await allocateAndComputeOutput(input, eigenVectors);
    return { output, eigenVectors };
}
