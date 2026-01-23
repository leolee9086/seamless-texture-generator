/**
 * 画布模式初始化
 *
 * 注册所有内置的画布模式
 */

import { useCanvasModeManager } from '../index'
import { createProjectMode } from './projectMode/index'
import { createProceduralMode } from './proceduralMode/index'
import { CANVAS_MODE_IDS } from '../constants'

/**
 * 初始化所有画布模式
 *
 * 注册项目模式和程序化纹理模式
 */
export function initializeCanvasModes(): void {
    const manager = useCanvasModeManager()

    // 注册项目模式
    manager.registerMode({
        id: CANVAS_MODE_IDS.PROJECT,
        displayName: '项目预览',
        persistStrategy: 'auto',
        factory: () => createProjectMode(),
    })

    // 注册程序化纹理模式
    manager.registerMode({
        id: CANVAS_MODE_IDS.PROCEDURAL,
        displayName: '程序化纹理',
        persistStrategy: 'confirm',
        factory: () => createProceduralMode(),
    })

    // 默认切换到项目模式
    manager.switchMode(CANVAS_MODE_IDS.PROJECT).catch((error) => {
        console.error('初始化画布模式失败:', error)
    })
}
