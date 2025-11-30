export function calculateWeight(
  i: number,
  j: number,
  tileWidth: number,
  tileHeight: number,
  tileCenterWidth: number,
  tileCenterHeight: number
): number {
  let w = 0;
  if (i >= tileWidth / 2 && i < tileWidth / 2 + tileCenterWidth) {
    let w0 = 1.0 - Math.floor(Math.abs(j - 0.5 * (tileHeight - 1))) / (tileHeight / 2 - 1);
    let w1 = 1.0 - w0;
    w = w0 / Math.sqrt(w0 * w0 + w1 * w1);
  } else if (j >= tileHeight / 2 && j < tileHeight / 2 + tileCenterHeight) {
    let w0 = 1.0 - Math.floor(Math.abs(i - 0.5 * (tileWidth - 1))) / (tileWidth / 2 - 1);
    let w1 = 1.0 - w0;
    w = w0 / Math.sqrt(w0 * w0 + w1 * w1);
  } else {
    let temp_j = j >= tileHeight / 2 + tileCenterHeight ? j - tileCenterHeight : j;
    let temp_i = i >= tileWidth / 2 + tileCenterWidth ? i - tileCenterWidth : i;

    let lambda_x = 1.0 - Math.floor(Math.abs(temp_i - 0.5 * (tileWidth - 1))) / (tileWidth / 2 - 1);
    let lambda_y = 1.0 - Math.floor(Math.abs(temp_j - 0.5 * (tileHeight - 1))) / (tileHeight / 2 - 1);
    let w00 = (1.0 - lambda_x) * (1.0 - lambda_y);
    let w10 = lambda_x * (1.0 - lambda_y);
    let w01 = (1.0 - lambda_x) * lambda_y;
    let w11 = lambda_x * lambda_y;
    w = lambda_x * lambda_y / Math.sqrt(w00 * w00 + w10 * w10 + w01 * w01 + w11 * w11);
  }
  return w;
}