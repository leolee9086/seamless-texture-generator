/**
 * 等待图片加载完成
 * @param img 图片元素
 * @param options 配置选项
 * @param options.onload 自定义加载成功回调函数
 * @param options.onerror 自定义加载失败回调函数
 * @returns Promise<HTMLImageElement>
 */
export const 等待图片加载完成 = (
    img: HTMLImageElement,
    options?: {
        onload?: (img: HTMLImageElement) => void;
        onerror?: (error: Error) => void;
    }
): Promise<HTMLImageElement> => {
    //返回一个promise，当图片加载完成时，resolve,加载失败时reject
    //@AIDONE: onload和onerror已通过参数传入，支持更多使用场景
    return new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = (): void => {
            try {
                // 如果提供了自定义onload回调，先执行它
                if (options?.onload) {
                    options.onload(img);
                }
                resolve(img);
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        };
        
        img.onerror = (): void => {
            const error = new Error('图片加载失败');
            try {
                // 如果提供了自定义onerror回调，先执行它
                if (options?.onerror) {
                    options.onerror(error);
                }
                reject(error);
            } catch (callbackError) {
                reject(callbackError instanceof Error ? callbackError : new Error(String(callbackError)));
            }
        };
    });
}
/**
 * 从文件创建图片并等待加载完成
 * @param file 文件
 * @param options 配置选项
 * @param options.onload 自定义加载成功回调函数
 * @param options.onerror 自定义加载失败回调函数
 * @returns 图片元素
 */
export const 从文件创建图片并等待加载完成 = async (
    file: File,
    options?: {
        onload?: (img: HTMLImageElement) => void;
        onerror?: (error: Error) => void;
    }
): Promise<HTMLImageElement> => {
    const 文件对象临时URL = URL.createObjectURL(file)
    try {
        return await 从URL创建图片并等待加载完成(文件对象临时URL, options)
    } finally {
        // 确保在所有情况下都清理临时URL，避免内存泄漏
        URL.revokeObjectURL(文件对象临时URL)
    }
}

/**
 * 从URL创建图片并等待加载完成
 * @param url URL
 * @param options 配置选项
 * @param options.onload 自定义加载成功回调函数
 * @param options.onerror 自定义加载失败回调函数
 * @returns 图片元素
 */
export const 从URL创建图片并等待加载完成 = async (
    url: string,
    options?: {
        onload?: (img: HTMLImageElement) => void;
        onerror?: (error: Error) => void;
    }
): Promise<HTMLImageElement> => {
    const img = new Image()
    img.src = url
    await 等待图片加载完成(img, options)
    return img
}
/**
 * 从图片元素获取ImageData
 * @param img 图片元素
 * @returns ImageData对象
 */
export const 获取ImageData = (img: HTMLImageElement): ImageData => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // 添加错误处理，确保canvas上下文存在
    if (!ctx) {
        throw new Error('无法获取2D渲染上下文')
    }
    
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, img.width, img.height)
}
