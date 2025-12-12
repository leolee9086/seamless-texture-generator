/**
 * Luminance Adjustment Utilities
 * Provides functions for managing luminance-based adjustments (Shadows, Midtones, Highlights)
 */

import type { LuminanceAdjustmentParams, ZoneAdjustment } from './imports';
import { processLuminanceAdjustment } from './imports';
import { 验证错误消息 } from './luminanceAdjustment.templates';
import { DEFAULT_LUMINANCE_PARAMS, LUMINANCE_PRESETS, getLuminancePreset } from './luminanceAdjustment.presets';
import { applyLuminanceAdjustmentToImageData } from './luminanceAdjustment.gpu.utils';

// Re-export for backward compatibility
export { DEFAULT_LUMINANCE_PARAMS, LUMINANCE_PRESETS, getLuminancePreset, applyLuminanceAdjustmentToImageData };

// Validate parameters
export function validateLuminanceParams(params: LuminanceAdjustmentParams): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Validate zone parameters
    for (const zone of ['shadows', 'midtones', 'highlights'] as const) {
        const zoneParams = params[zone] as ZoneAdjustment;

        if (zoneParams.brightness < -1.0 || zoneParams.brightness > 1.0) {
            errors.push(验证错误消息.zone参数.brightness超出范围(zone));
        }

        if (zoneParams.contrast < -1.0 || zoneParams.contrast > 1.0) {
            errors.push(验证错误消息.zone参数.contrast超出范围(zone));
        }

        if (zoneParams.saturation < -1.0 || zoneParams.saturation > 1.0) {
            errors.push(验证错误消息.zone参数.saturation超出范围(zone));
        }

        if (zoneParams.red < -1.0 || zoneParams.red > 1.0) {
            errors.push(验证错误消息.zone参数.red超出范围(zone));
        }

        if (zoneParams.green < -1.0 || zoneParams.green > 1.0) {
            errors.push(验证错误消息.zone参数.green超出范围(zone));
        }

        if (zoneParams.blue < -1.0 || zoneParams.blue > 1.0) {
            errors.push(验证错误消息.zone参数.blue超出范围(zone));
        }
    }

    // Validate range parameters
    if (params.shadowEnd < 0.0 || params.shadowEnd > 1.0) {
        errors.push(验证错误消息.范围参数.shadowEnd超出范围);
    }

    if (params.highlightStart < 0.0 || params.highlightStart > 1.0) {
        errors.push(验证错误消息.范围参数.highlightStart超出范围);
    }

    if (params.shadowEnd >= params.highlightStart) {
        errors.push(验证错误消息.范围参数.shadowEnd必须小于highlightStart);
    }

    if (params.softness < 0.0 || params.softness > 1.0) {
        errors.push(验证错误消息.范围参数.softness超出范围);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Create control event for luminance adjustment
export function createLuminanceAdjustmentEvent(params: LuminanceAdjustmentParams): {
    type: 'update-data';
    detail: {
        action: 'luminance-adjustment';
        data: LuminanceAdjustmentParams;
    };
} {
    return {
        type: 'update-data' as const,
        detail: {
            action: 'luminance-adjustment',
            data: params
        }
    };
}

// Apply luminance adjustment to image using WebGPU
export async function applyLuminanceAdjustment(
    device: GPUDevice,
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    params: LuminanceAdjustmentParams
): Promise<void> {
    await processLuminanceAdjustment(device, inputTexture, outputTexture, params);
}
