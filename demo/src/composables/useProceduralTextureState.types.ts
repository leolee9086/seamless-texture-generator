
import type { WoodParams, PlainWeaveAdvancedParams } from './imports'

// 定义所有程序化纹理类型的参数接口
export interface ProceduralTextureState {
    // 通用状态
    activeTab: 'Upload' | 'Procedural' | 'Text-to-Image'
    proceduralType: string

    // 木纹参数
    woodParams: WoodParams

    // 其他纹理参数（未来扩展）
    plainWeaveParams?: any // To be typed
    plainWeaveAdvancedParams: PlainWeaveAdvancedParams
    leatherParams?: any
    twillWeaveParams?: any
    velvetParams?: any
    turingParams?: any
    grayScottParams?: any
    compositorParams?: any

    // 文本生成图像参数
    textToImageParams?: {
        prompt: string
        size: string
        n: number
        numInferenceSteps: number
        model: string
    }

    // UI 状态
    uiState: {
        woodPanel: {
            showColors: boolean
            showBasicParams: boolean
            showPoreParams: boolean
            showAdvancedParams: boolean
            showMaterialParams: boolean
            showPresets: boolean
        },
        plainWeavePanel?: any,
        plainWeaveAdvancedPanel?: any,
        leatherPanel?: any,
        twillWeavePanel?: any,
        velvetPanel?: any,
        turingPanel?: any,
        grayScottPanel?: any,
        compositorPanel?: any,
        textToImagePanel?: any
    }
}
