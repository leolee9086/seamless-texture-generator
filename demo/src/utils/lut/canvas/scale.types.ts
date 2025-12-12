/**
 * 画布缩放相关的类型定义
 */

export interface 缩放画布执行细节 {
    //操作是否成功
    success: boolean,
    //操作细节
    detail: {
        //缩放比例
        ratio: number,
        //结果宽度
        resultWidth: number,
        //结果高度
        resultHeight: number,
        //原始宽度
        originalWidth: number,
        //原始高度
        originalHeight: number
    }
}