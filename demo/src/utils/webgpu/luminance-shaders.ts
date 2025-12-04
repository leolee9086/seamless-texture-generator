/**
 * Luminance-based Adjustment WebGPU Compute Shaders
 * Implements Shadows, Midtones, and Highlights adjustments
 */

/**
 * Luminance Adjustment Compute Shader Template
 */
export const luminanceComputeShaderTemplate = (workgroupSizeX: number, workgroupSizeY: number) => `
struct ZoneParams {
    brightness: f32,
    contrast: f32,
    saturation: f32,
    red: f32,
    green: f32,
    blue: f32,
    padding1: f32,
    padding2: f32,
}

struct LuminanceParams {
    shadows: ZoneParams,
    midtones: ZoneParams,
    highlights: ZoneParams,
    
    // Range controls
    shadowEnd: f32,      // Point where shadows fade out (e.g., 0.33)
    highlightStart: f32, // Point where highlights fade in (e.g., 0.66)
    softness: f32,       // Softness of the transition (0.0 - 1.0)
    padding: f32,
}

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params: LuminanceParams;

// Helper: Calculate Luminance
fn getLuminance(color: vec3<f32>) -> f32 {
    return dot(color, vec3<f32>(0.2126, 0.7152, 0.0722));
}

// Helper: RGB to HSL (for Saturation adjustment)
fn rgbToHsl(rgb: vec3<f32>) -> vec3<f32> {
    let r = rgb.r;
    let g = rgb.g;
    let b = rgb.b;
    let maxVal = max(max(r, g), b);
    let minVal = min(min(r, g), b);
    let l = (maxVal + minVal) * 0.5;
    
    var h = 0.0;
    var s = 0.0;
    
    if (maxVal != minVal) {
        let d = maxVal - minVal;
        s = select(d / (2.0 - maxVal - minVal), d / (maxVal + minVal), l > 0.5);
        if (maxVal == r) {
            h = (g - b) / d + select(6.0, 0.0, g >= b);
        } else if (maxVal == g) {
            h = (b - r) / d + 2.0;
        } else {
            h = (r - g) / d + 4.0;
        }
        h = h / 6.0;
    }
    return vec3<f32>(h, s, l);
}

// Helper: HSL to RGB
fn hue2rgb(p: f32, q: f32, t: f32) -> f32 {
    var tAdjusted = t;
    if (tAdjusted < 0.0) { tAdjusted = tAdjusted + 1.0; }
    if (tAdjusted > 1.0) { tAdjusted = tAdjusted - 1.0; }
    if (tAdjusted < 1.0/6.0) { return p + (q - p) * 6.0 * tAdjusted; }
    if (tAdjusted < 1.0/2.0) { return q; }
    if (tAdjusted < 2.0/3.0) { return p + (q - p) * (2.0/3.0 - tAdjusted) * 6.0; }
    return p;
}

fn hslToRgb(hsl: vec3<f32>) -> vec3<f32> {
    let h = hsl.x;
    let s = hsl.y;
    let l = hsl.z;
    var r = 0.0; var g = 0.0; var b = 0.0;
    if (s == 0.0) {
        r = l; g = l; b = l;
    } else {
        let q = select(l * (1.0 + s), l + s - l * s, l < 0.5);
        let p = 2.0 * l - q;
        r = hue2rgb(p, q, h + 1.0/3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0/3.0);
    }
    return vec3<f32>(r, g, b);
}

// Apply adjustments to a color
fn applyAdjustments(color: vec3<f32>, p: ZoneParams) -> vec3<f32> {
    var res = color;
    
    // 1. Brightness
    res = res + p.brightness;
    
    // 2. Contrast
    res = (res - 0.5) * (1.0 + p.contrast) + 0.5;
    
    // 3. Color Tint (RGB Offset)
    res = res + vec3<f32>(p.red, p.green, p.blue);
    
    // 4. Saturation
    let hsl = rgbToHsl(res);
    let newS = clamp(hsl.y * (1.0 + p.saturation), 0.0, 1.0);
    res = hslToRgb(vec3<f32>(hsl.x, newS, hsl.z));
    
    return clamp(res, vec3<f32>(0.0), vec3<f32>(1.0));
}

@compute @workgroup_size(${workgroupSizeX}, ${workgroupSizeY})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(inputTexture);
    let coords = vec2<u32>(global_id.xy);

    if (coords.x >= dims.x || coords.y >= dims.y) {
        return;
    }

    let originalColor = textureLoad(inputTexture, vec2<i32>(coords), 0);
    let rgb = originalColor.rgb;
    let l = getLuminance(rgb);
    
    // Calculate weights
    // Softness controls the transition width
    let soft = max(0.01, params.softness);
    
    // Shadow weight: 1.0 at 0, 0.0 at shadowEnd
    let w_shadow = 1.0 - smoothstep(params.shadowEnd - soft, params.shadowEnd + soft, l);
    
    // Highlight weight: 0.0 at highlightStart, 1.0 at 1.0
    let w_highlight = smoothstep(params.highlightStart - soft, params.highlightStart + soft, l);
    
    // Midtone weight: Remainder
    let w_midtone = max(0.0, 1.0 - w_shadow - w_highlight);
    
    // Normalize weights to sum to 1.0 (optional, but good for consistency)
    let total_w = w_shadow + w_midtone + w_highlight;
    let nw_shadow = w_shadow / total_w;
    let nw_midtone = w_midtone / total_w;
    let nw_highlight = w_highlight / total_w;
    
    // Apply adjustments for each zone
    let adj_shadow = applyAdjustments(rgb, params.shadows);
    let adj_midtone = applyAdjustments(rgb, params.midtones);
    let adj_highlight = applyAdjustments(rgb, params.highlights);
    
    // Blend results
    let finalRGB = adj_shadow * nw_shadow + adj_midtone * nw_midtone + adj_highlight * nw_highlight;
    
    textureStore(outputTexture, coords, vec4<f32>(finalRGB, originalColor.a));
}
`;

export const luminanceComputeShader = luminanceComputeShaderTemplate(16, 16);

export function createLuminanceComputeShader(device: GPUDevice): GPUShaderModule {
    return device.createShaderModule({
        code: luminanceComputeShader,
        label: 'Luminance Adjustment Compute Shader'
    });
}

// Types for TypeScript usage
export interface ZoneAdjustment {
    brightness: number; // -1.0 to 1.0
    contrast: number;   // -1.0 to 1.0 (mapped to factor)
    saturation: number; // -1.0 to 1.0 (mapped to factor)
    red: number;        // -1.0 to 1.0
    green: number;      // -1.0 to 1.0
    blue: number;       // -1.0 to 1.0
}

export interface LuminanceAdjustmentParams {
    shadows: ZoneAdjustment;
    midtones: ZoneAdjustment;
    highlights: ZoneAdjustment;
    shadowEnd: number;      // 0.0 to 1.0, default 0.33
    highlightStart: number; // 0.0 to 1.0, default 0.66
    softness: number;       // 0.0 to 1.0, default 0.1
}

export function createLuminanceParamsBuffer(params: LuminanceAdjustmentParams): Float32Array {
    // 3 zones * 8 floats + 4 floats = 28 floats -> 112 bytes
    // Aligned to 16 bytes? Yes, 112 is divisible by 16 (7 * 16).
    const data = new Float32Array(32); // Use 32 floats (128 bytes) to be safe and aligned

    let offset = 0;

    // Shadows
    data[offset++] = params.shadows.brightness;
    data[offset++] = params.shadows.contrast;
    data[offset++] = params.shadows.saturation;
    data[offset++] = params.shadows.red;
    data[offset++] = params.shadows.green;
    data[offset++] = params.shadows.blue;
    data[offset++] = 0; // padding
    data[offset++] = 0; // padding

    // Midtones
    data[offset++] = params.midtones.brightness;
    data[offset++] = params.midtones.contrast;
    data[offset++] = params.midtones.saturation;
    data[offset++] = params.midtones.red;
    data[offset++] = params.midtones.green;
    data[offset++] = params.midtones.blue;
    data[offset++] = 0; // padding
    data[offset++] = 0; // padding

    // Highlights
    data[offset++] = params.highlights.brightness;
    data[offset++] = params.highlights.contrast;
    data[offset++] = params.highlights.saturation;
    data[offset++] = params.highlights.red;
    data[offset++] = params.highlights.green;
    data[offset++] = params.highlights.blue;
    data[offset++] = 0; // padding
    data[offset++] = 0; // padding

    // Ranges
    data[offset++] = params.shadowEnd;
    data[offset++] = params.highlightStart;
    data[offset++] = params.softness;
    data[offset++] = 0; // padding

    return data;
}
