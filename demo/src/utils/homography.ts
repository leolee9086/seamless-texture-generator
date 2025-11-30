
export interface Point {
    x: number;
    y: number;
}

/**
 * Solves a system of linear equations Ax = B using Gaussian elimination.
 * @param A The matrix A (n x n)
 * @param B The vector B (n)
 * @returns The solution vector x (n)
 */
function solve(A: number[][], B: number[]): number[] {
    const n = A.length;
    // Augment A with B
    const M: number[][] = [];
    for (let i = 0; i < n; i++) {
        M.push([...A[i], B[i]]);
    }

    // Gaussian elimination
    for (let i = 0; i < n; i++) {
        // Find pivot
        let pivot = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(M[j][i]) > Math.abs(M[pivot][i])) {
                pivot = j;
            }
        }

        // Swap rows
        [M[i], M[pivot]] = [M[pivot], M[i]];

        // Normalize pivot row
        const div = M[i][i];
        if (Math.abs(div) < 1e-10) {
            // Singular matrix, return zeros or handle error
            return new Array(n).fill(0);
        }
        for (let j = i; j <= n; j++) {
            M[i][j] /= div;
        }

        // Eliminate other rows
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                const mul = M[j][i];
                for (let k = i; k <= n; k++) {
                    M[j][k] -= mul * M[i][k];
                }
            }
        }
    }

    // Extract solution
    const x: number[] = [];
    for (let i = 0; i < n; i++) {
        x.push(M[i][n]);
    }
    return x;
}

/**
 * Computes the homography matrix that maps source points to destination points.
 * @param srcPoints Array of 4 source points
 * @param dstPoints Array of 4 destination points
 * @returns The 3x3 homography matrix as a 1D array of 9 elements
 */
export function getHomographyMatrix(srcPoints: Point[], dstPoints: Point[]): number[] {
    if (srcPoints.length !== 4 || dstPoints.length !== 4) {
        throw new Error('Need exactly 4 points for both source and destination');
    }

    const A: number[][] = [];
    const B: number[] = [];

    for (let i = 0; i < 4; i++) {
        const s = srcPoints[i];
        const d = dstPoints[i];
        // x_src * h00 + y_src * h01 + h02 - x_src * x_dst * h20 - y_src * x_dst * h21 = x_dst
        A.push([s.x, s.y, 1, 0, 0, 0, -s.x * d.x, -s.y * d.x]);
        B.push(d.x);
        // 0 * h00 + 0 * h01 + 0 * h02 + x_src * h10 + y_src * h11 + h12 - x_src * y_dst * h20 - y_src * y_dst * h21 = y_dst
        A.push([0, 0, 0, s.x, s.y, 1, -s.x * d.y, -s.y * d.y]);
        B.push(d.y);
    }

    const h = solve(A, B);
    return [...h, 1];
}

/**
 * Applies the homography transform to an image and returns the result as a new ImageData.
 * @param sourceImage The source ImageData
 * @param srcPoints The 4 corners of the quadrilateral in the source image
 * @param width The width of the output image
 * @param height The height of the output image
 * @returns The transformed ImageData
 */
export function warpPerspective(
    sourceImage: ImageData,
    srcPoints: Point[],
    width: number,
    height: number
): ImageData {
    const dstPoints: Point[] = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
    ];

    // We need the inverse homography to map destination pixels back to source pixels
    // Mapping dst -> src
    const H = getHomographyMatrix(dstPoints, srcPoints);

    const output = new ImageData(width, height);
    const srcData = sourceImage.data;
    const dstData = output.data;
    const srcWidth = sourceImage.width;
    const srcHeight = sourceImage.height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Apply homography
            const den = H[6] * x + H[7] * y + H[8];
            const srcX = (H[0] * x + H[1] * y + H[2]) / den;
            const srcY = (H[3] * x + H[4] * y + H[5]) / den;

            // Bilinear interpolation
            if (srcX >= 0 && srcX < srcWidth - 1 && srcY >= 0 && srcY < srcHeight - 1) {
                const x0 = Math.floor(srcX);
                const y0 = Math.floor(srcY);
                const x1 = x0 + 1;
                const y1 = y0 + 1;

                const dx = srcX - x0;
                const dy = srcY - y0;

                const idx00 = (y0 * srcWidth + x0) * 4;
                const idx10 = (y0 * srcWidth + x1) * 4;
                const idx01 = (y1 * srcWidth + x0) * 4;
                const idx11 = (y1 * srcWidth + x1) * 4;

                const dstIdx = (y * width + x) * 4;

                for (let c = 0; c < 4; c++) {
                    const val00 = srcData[idx00 + c];
                    const val10 = srcData[idx10 + c];
                    const val01 = srcData[idx01 + c];
                    const val11 = srcData[idx11 + c];

                    const val0 = val00 * (1 - dx) + val10 * dx;
                    const val1 = val01 * (1 - dx) + val11 * dx;

                    dstData[dstIdx + c] = val0 * (1 - dy) + val1 * dy;
                }
            }
        }
    }

    return output;
}
