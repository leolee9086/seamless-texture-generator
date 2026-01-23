/**
 * 画布模式错误类
 */

/**
 * 画布模式错误
 */
export class CanvasModeError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly modeId?: string
    ) {
        super(message)
        this.name = 'CanvasModeError'
    }
}
