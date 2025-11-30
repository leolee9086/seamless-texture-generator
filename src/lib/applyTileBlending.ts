import { calculateTileCenterAndOffset, randXorshiftFloat, customModulo } from "./HistogramPreservingBlendMakeTileable";
import { calculateWeight } from "./calculateWeight";
import type { 图像输入, 瓦片参数 } from "../types/imageProcessing";

export function applyTileBlending(
  output: 图像输入,
  imageInputGaussian: 图像输入,
  tileParameters: 瓦片参数,
  targetWidth: number,
  targetHeight: number
): 图像输入 {
  let { tileCountWidth, tileCountHeight, tileWidth, tileHeight, restWidth, restHeight } = tileParameters;
  for (let c = -1; c < (tileCountWidth - 1) + (tileCountHeight - 1); ++c) {
    let i_tile = c < tileCountWidth - 1 ? c : -1;
    let j_tile = c >= tileCountWidth - 1 ? c - (tileCountWidth - 1) : -1;

    let { tileCenterWidth, tileCenterHeight, cumulativeOffsetWidth, cumulativeOffsetHeight } = calculateTileCenterAndOffset(
      i_tile,
      j_tile,
      tileCountWidth,
      tileCountHeight,
      restWidth,
      restHeight
    );
    let offset_i = Math.floor((imageInputGaussian.width - (tileWidth + tileCenterWidth)) * randXorshiftFloat());
    let offset_j = Math.floor((imageInputGaussian.height - (tileHeight + tileCenterHeight)) * randXorshiftFloat());

    for (let j = 0; j < tileHeight + tileCenterHeight; ++j) {
      for (let i = 0; i < tileWidth + tileCenterWidth; ++i) {
        let w = calculateWeight(i, j, tileWidth, tileHeight, tileCenterWidth, tileCenterHeight);
        let index_i_output = customModulo(i + i_tile * tileWidth / 2 + cumulativeOffsetWidth, targetWidth);
        let index_j_output = customModulo(j + j_tile * tileHeight / 2 + cumulativeOffsetHeight, targetHeight);
        let index_i_input = (i + offset_i) % targetWidth;
        let index_j_input = (j + offset_j) % targetHeight;

        const outputIndexR = (index_j_output * output.width + index_i_output) * 4;
        const outputIndexG = outputIndexR + 1;
        const outputIndexB = outputIndexR + 2;

        const inputIndexR = (index_j_input * imageInputGaussian.width + index_i_input) * 4;
        const inputIndexG = inputIndexR + 1;
        const inputIndexB = inputIndexR + 2;

        output.data[outputIndexR] += w * imageInputGaussian.data[inputIndexR];
        output.data[outputIndexG] += w * imageInputGaussian.data[inputIndexG];
        output.data[outputIndexB] += w * imageInputGaussian.data[inputIndexB];
      }
    }
  }
  return output;
}