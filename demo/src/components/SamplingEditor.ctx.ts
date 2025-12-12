import { watch, nextTick } from 'vue'
import { useSamplingPoints } from './imports'
import { useSamplingEditorState } from './SamplingEditor.state'
import { useSamplingEditorView } from './SamplingEditor.view'
import { useSamplingEditorActions } from './SamplingEditor.actions'
import { SamplingEditorProps, SamplingEditorEmit } from './SamplingEditor.types'

export function useSamplingEditorLogic(
    props: SamplingEditorProps,
    emit: SamplingEditorEmit
) {
    // 1. Core State
    const state = useSamplingEditorState()

    // 2. Sampling Points Logic
    const pointsLogic = useSamplingPoints(state.imageObj)

    // 3. View & Interaction Logic
    const view = useSamplingEditorView(
        state.containerRef,
        state.stageRef,
        state.imageObj,
        state.groupConfig,
        state.stageConfig,
        pointsLogic.lineConfig,
        pointsLogic.rotationLineConfig,
        pointsLogic.rotationHandleConfig,
        pointsLogic.handlePointDragMove,
        pointsLogic.resetPoints
    )

    // 4. Actions (Confirm/Cancel)
    const actions = useSamplingEditorActions(
        state.imageObj,
        pointsLogic.points,
        emit,
        state.isProcessing
    )

    // 5. Lifecycle / Watchers
    watch(() => props.visible, (newVal) => {
        if (newVal) {
            nextTick(() => {
                view.updateStageSize()
                if (props.originalImage) {
                    view.loadImage(props.originalImage)
                }
            })
        }
    })

    watch(() => props.originalImage, (newVal) => {
        if (props.visible && newVal) {
            view.loadImage(newVal)
        }
    })

    return {
        ...state,
        ...pointsLogic,
        ...view,
        ...actions
    }
}
