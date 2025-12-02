/**
 * 等待图片加载完成
 * @param img 图片元素
 * @returns 
 */
export const 等待图片加载完成 = (img: HTMLImageElement) => {
    //返回一个promise，当图片加载完成时，resolve,加载失败时reject
    return new Promise((resolve, reject) => {
        img.onload = () => {
            resolve(img)
        }
        img.onerror = () => {
            reject(new Error('图片加载失败'))
        }
    })
}
/**
 * 从文件创建图片并等待加载完成
 * @param file 文件
 * @returns 图片元素
 */
export const 从文件创建图片并等待加载完成 = async (file: File): Promise<HTMLImageElement> => {
    const 文件对象临时URL = URL.createObjectURL(file)
    return 从URL创建图片并等待加载完成(文件对象临时URL)
}

/**
 * 从URL创建图片并等待加载完成
 * @param url URL
 * @returns 图片元素
 */
export const 从URL创建图片并等待加载完成 = async (url: string): Promise<HTMLImageElement> => {
    const img = new Image()
    img.src = url
    await 等待图片加载完成(img)
    return img
}
/**
 * 
 * @param img 
 * @returns 
 */
export const 获取imgeData = (img: HTMLImageElement): ImageData => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, img.width, img.height)
}
