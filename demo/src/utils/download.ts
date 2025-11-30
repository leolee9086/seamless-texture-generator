export const downloadCanvasJPG = (canvas: HTMLCanvasElement | null, fileName: string = 'download'): void => {
    if (!canvas) return;
    // Create a JPG URL from the canvas
    const imageUrl = canvas.toDataURL('image/jpeg', 1.0); // 1.0 quality for high quality
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${fileName}.jpg`; // Set the download file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}