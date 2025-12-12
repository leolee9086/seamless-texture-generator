import { ref, watch, generateWoodTexture, type Ref, type ComputedRef, type WoodParams } from './imports'
import type { WoodPanelLogicReturn } from './woodPanel.types'

// Wood Presets
export const woodPresets = {
    'Pine': {
        tileSize: 1.0,
        ringScale: 5.0,
        ringDistortion: 0.8,
        knotIntensity: 1.2,
        latewoodBias: 0.5,
        rayStrength: 0.1,
        poreDensity: 0.0,
        gradientStops: [
            { offset: 0.0, color: '#A6734D' },
            { offset: 1.0, color: '#EBD9AD' }
        ],
        fbmOctaves: 3,
        fbmAmplitude: 0.5,
        knotFrequency: 0.8,
        distortionFreq: 1.2,
        ringNoiseFreq: 4.0,
        rayFrequencyX: 40.0,
        rayFrequencyY: 1.5,
        knotThresholdMin: 0.4,
        knotThresholdMax: 0.8,
        normalStrength: 6.0,
        roughnessMin: 0.4,
        roughnessMax: 0.8,
        poreScale: 0.8,
        poreThresholdEarly: 0.6,
        poreThresholdLate: 0.75,
        poreThresholdRange: 0.2,
        poreStrength: 0.12,
    },
    'White Oak': {
        tileSize: 1.0,
        ringScale: 12.0,
        ringDistortion: 1.2,
        knotIntensity: 0.8,
        latewoodBias: 3.0,
        rayStrength: 0.8,
        poreDensity: 20.0,
        gradientStops: [
            { offset: 0.0, color: '#735940' },
            { offset: 1.0, color: '#DBC7A6' }
        ],
        fbmOctaves: 4,
        fbmAmplitude: 0.6,
        knotFrequency: 1.0,
        distortionFreq: 1.8,
        ringNoiseFreq: 6.0,
        rayFrequencyX: 60.0,
        rayFrequencyY: 2.5,
        knotThresholdMin: 0.3,
        knotThresholdMax: 0.7,
        normalStrength: 10.0,
        roughnessMin: 0.3,
        roughnessMax: 0.7,
        poreScale: 1.0,
        poreThresholdEarly: 0.55,
        poreThresholdLate: 0.7,
        poreThresholdRange: 0.2,
        poreStrength: 0.16,
    },
    'Walnut': {
        tileSize: 1.0,
        ringScale: 8.0,
        ringDistortion: 1.5,
        knotIntensity: 1.0,
        latewoodBias: 1.5,
        rayStrength: 0.3,
        poreDensity: 5.0,
        gradientStops: [
            { offset: 0.0, color: '#40261A' },
            { offset: 1.0, color: '#8C6640' }
        ],
        fbmOctaves: 3,
        fbmAmplitude: 0.7,
        knotFrequency: 1.2,
        distortionFreq: 2.0,
        ringNoiseFreq: 5.0,
        rayFrequencyX: 45.0,
        rayFrequencyY: 2.0,
        knotThresholdMin: 0.5,
        knotThresholdMax: 0.9,
        normalStrength: 8.0,
        roughnessMin: 0.35,
        roughnessMax: 0.65,
        poreScale: 0.6,
        poreThresholdEarly: 0.65,
        poreThresholdLate: 0.75,
        poreThresholdRange: 0.15,
        poreStrength: 0.10,
    }
}

export function useWoodPanelLogic(
    woodParams: Ref<WoodParams> | ComputedRef<WoodParams>,
    emit: (event: 'set-image', imageData: string) => void
): WoodPanelLogicReturn {
    const pendingGeneration = ref(false)
    const localIsGenerating = ref(false)

    const generateWood = async (): Promise<void> => {
        if (localIsGenerating.value) {
            pendingGeneration.value = true
            return
        }

        localIsGenerating.value = true

        try {
            do {
                pendingGeneration.value = false
                const imageData = await generateWoodTexture(woodParams.value, 1024, 1024)
                emit('set-image', imageData)
            } while (pendingGeneration.value)
        } catch (error) {
            console.error('Failed to generate wood texture:', error)
        } finally {
            localIsGenerating.value = false
        }
    }

    let debounceTimer: number | null = null
    const debouncedGenerateWood = (): void => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = window.setTimeout(() => {
            generateWood()
        }, 50)
    }

    const applyPreset = (preset: Partial<WoodParams>): void => {
        Object.assign(woodParams.value, preset)
    }

    // Watch for parameter changes and auto-generate
    watch(woodParams, () => {
        debouncedGenerateWood()
    }, { deep: true })

    return {
        pendingGeneration,
        localIsGenerating,
        generateWood,
        applyPreset,
        woodPresets
    }
}