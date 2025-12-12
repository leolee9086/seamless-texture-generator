import type { WoodParams } from './imports'

export const isValidWoodParamId = (id: string): id is keyof Omit<WoodParams, 'gradientStops'> => {
    const validIds: (keyof Omit<WoodParams, 'gradientStops'>)[] = [
        'tileSize', 'ringScale', 'ringDistortion', 'knotIntensity', 'latewoodBias', 'rayStrength', 'poreDensity',
        'fbmOctaves', 'fbmAmplitude', 'knotFrequency', 'distortionFreq', 'ringNoiseFreq', 'rayFrequencyX', 'rayFrequencyY',
        'knotThresholdMin', 'knotThresholdMax', 'poreScale', 'poreThresholdEarly', 'poreThresholdLate', 'poreThresholdRange',
        'poreStrength', 'normalStrength', 'roughnessMin', 'roughnessMax'
    ]
    return validIds.includes(id as keyof Omit<WoodParams, 'gradientStops'>)
}

export const updateWoodParam = (state: WoodParams, data: { id: string; value: number }): boolean => {
    if (!isValidWoodParamId(data.id)) return false
    
    // Check if the parameter is a number type
    const paramValue = state[data.id]
    if (typeof paramValue === 'number') {
        state[data.id] = data.value
        return true
    }
    
    return false
}