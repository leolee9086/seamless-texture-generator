export function initializeEigenVectors(): number[][] {
    let eigenVectors: number[][] = [];
    for (let i = 0; i < 3; i++) {
        eigenVectors[i] = [0, 0, 0];
    }
    return eigenVectors;
}
