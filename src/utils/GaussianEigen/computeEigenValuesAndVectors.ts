import * as tf from "@tensorflow/tfjs";
import type { 特征值和特征向量结果 } from "../../types/imageProcessingModules";
import '@tensorflow/tfjs-backend-webgpu';

/**
 * 使用雅可比方法计算协方差矩阵的特征值和特征向量
 *
 * 该函数通过迭代的雅可比旋转方法来计算3x3协方差矩阵的特征值和特征向量。
 * 雅可比方法是一种数值稳定的算法，通过一系列的平面旋转来将矩阵对角化，
 * 从而得到特征值（对角线元素）和特征向量（旋转矩阵的累积乘积）。
 *
 * @param covarMat - 3x3 协方差矩阵张量，必须是二维的方阵
 * @returns Promise<特征值和特征向量结果> 包含：
 *   - eigenValues: number[] 特征值数组，长度为3
 *   - eigenVectors: number[][] 特征向量矩阵，每个子数组代表一个特征向量
 *
 * @example
 * ```typescript
 * const covarMat = tf.tensor2d([[2, 1, 0], [1, 2, 1], [0, 1, 2]]);
 * const result = await computeEigenValuesAndVectors(covarMat);
 * console.log('特征值:', result.eigenValues);
 * console.log('特征向量:', result.eigenVectors);
 * ```
 *
 * @throws 如果输入矩阵不是3x3或不是方阵，可能会导致计算错误
 */
export async function computeEigenValuesAndVectors(covarMat: tf.Tensor<tf.Rank.R2>): Promise<特征值和特征向量结果> {
    await tf.setBackend('webgpu');
    await tf.ready(); // 等待 WebGPU 后端完全初始化
    // 验证后端是否设置成功
    console.log(`当前 TensorFlow.js 后端: ${tf.getBackend()}`); // 应输出 'webgpu'

    const n = 3; // 假设协方差矩阵是 3x3
    let A = covarMat;
    let eigenVecs = tf.eye(n);

    // 获取所有数据以减少异步调用
    let AData = await A.array() as number[][];

    // 雅可比迭代次数
    const maxIterations = 10;

    // 收敛阈值
    const tolerance = 1e-10;

    for (let nIter = 0; nIter < maxIterations; nIter++) {
        let converged = true; // 检查是否收敛

        for (let p = 0; p < n - 1; p++) {
            for (let q = p + 1; q < n; q++) {
                const Apq = AData[p][q];
                const App = AData[p][p];
                const Aqq = AData[q][q];

                // 检查是否需要进行旋转
                if (Math.abs(Apq) > tolerance) {
                    converged = false; // 未收敛

                    // 计算旋转角度
                    const phi = 0.5 * Math.atan2(2 * Apq, Aqq - App);
                    const c = Math.cos(phi);
                    const s = Math.sin(phi);

                    // 构造旋转矩阵 S
                    const S = tf.tensor2d(Array.from({ length: n }, (_, i) => {
                        return Array.from({ length: n }, (_, j) => {
                            if (i === p && j === p) return c;
                            if (i === q && j === q) return c;
                            if (i === p && j === q) return -s;
                            if (i === q && j === p) return s;
                            return i === j ? 1 : 0;
                        });
                    }));

                    // 在单个 tidy 块中更新 A 和特征向量
                    [A, eigenVecs] = tf.tidy(() => {
                        const ST = S.transpose() as tf.Tensor<tf.Rank.R2>;
                        const newA = tf.matMul(tf.matMul(ST, A), S) as tf.Tensor<tf.Rank.R2>;
                        const newEigenVectors = tf.matMul(eigenVecs, S) as tf.Tensor<tf.Rank.R2>;
                        return [newA, newEigenVectors];
                    });

                    // 更新 AData 以用于下一次迭代
                    AData = await A.array() as number[][];
                }
            }
        }

        // 如果已经收敛，则提前退出
        if (converged) {
            break;
        }
    }

    // 提取对角线元素作为特征值
    const eigenValues = Array.from({ length: n }, (_, i) => AData[i][i]);

    // 返回特征值和特征向量
    return {
        eigenValues,
        eigenVectors: await eigenVecs.array() as number[][]
    };
}
