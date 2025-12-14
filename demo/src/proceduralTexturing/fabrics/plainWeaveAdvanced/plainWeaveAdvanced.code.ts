import { PLAIN_WEAVE_NOISE_WGSL } from "../plainWeave/plainWeave.noise.code";

export const plainWeaveAdvancedShaderWGSL = /* wgsl */`
struct Uniforms {
    viewMatrix : mat4x4<f32>,
    tileSize : f32,
    
    warpDensity : f32,
    weftDensity : f32,
    
    threadThickness : f32,
    threadTwist : f32,
    fiberDetail : f32,
    fuzziness : f32,
    
    weaveTightness : f32,
    threadUnevenness : f32,
    weaveImperfection : f32,
    
    warpColor : vec4<f32>, // Using vec4 for alignment, alpha ignored
    weftColor : vec4<f32>,
    
    fbmOctaves : f32,
    fbmAmplitude : f32,
    noiseFrequency : f32,
    colorVariation : f32,
    
    warpSheen : f32,
    weftSheen : f32,
    roughnessMin : f32,
    roughnessMax : f32,
    normalStrength : f32,
    
    threadHeightScale : f32,
    threadShadowStrength : f32,
    padding1: f32,
    padding2: f32,
};

@group(0) @binding(0) var<uniform> u : Uniforms;
// Removed gradient texture bindings

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>,
};

${PLAIN_WEAVE_NOISE_WGSL}

// -----------------------------------------------------------
// 核心逻辑：平纹织物生成 (Advanced)
// -----------------------------------------------------------

fn threadProfile(t: f32, thickness: f32, tightness: f32) -> f32 {
    let centered = (t - 0.5) * 2.0 / thickness;
    if (abs(centered) > 1.0) { return 0.0; }
    let base = cos(centered * 1.5707963);
    return pow(base, 0.5 + tightness); 
}

fn threadTwistPattern(pos: vec2<f32>, direction: vec2<f32>, twist: f32, scale: f32) -> f32 {
    let alongThread = dot(pos, direction);
    let twistPhase = sin(alongThread * scale * 2.0 + twist * 20.0);
    return twistPhase * 0.5 + 0.5;
}

fn fiberDetail(pos: vec2<f32>, direction: vec2<f32>, detail: f32, scale: f32, period: f32) -> f32 {
    let perpDir = vec2<f32>(-direction.y, direction.x);
    let fiberPos = vec2<f32>(dot(pos, direction), dot(pos, perpDir) * 10.0); 
    let noise1 = periodicNoise2D(fiberPos * 10.0 * scale, period * 10.0 * scale);
    return noise1 * detail;
}

fn fuzzEffect(pos: vec2<f32>, fuzz: f32, scale: f32, period: f32) -> f32 {
    if (fuzz < 0.01) { return 0.0; }
    let fuzzNoise = periodicNoise2D(pos * 80.0 * scale, period * 80.0 * scale);
    return smoothstep(0.6, 1.0, fuzzNoise) * fuzz;
}

struct WeaveData {
    density : f32,
    height : f32,
    sheen : f32,
    isWarp : bool,
}

fn getPlainWeaveDetail(uv: vec2<f32>) -> WeaveData {
    let scale = u.tileSize;
    let pos = uv * scale;
    
    let warpDensity = u.warpDensity;
    let weftDensity = u.weftDensity;
    
    let u_coord = pos.x * warpDensity;
    let v_coord = pos.y * weftDensity;
    
    let i = floor(u_coord);
    let j = floor(v_coord);
    
    let u_local = fract(u_coord);
    let v_local = fract(v_coord);
    
    // Imperfections
    let imperfection = periodicNoise2D(vec2<f32>(i, j), scale * max(warpDensity, weftDensity)) * u.weaveImperfection * 0.2;
    
    // Thread centers
    let warpCenter = 0.5 + imperfection;
    let weftCenter = 0.5 + imperfection;
    
    let dist_warp = abs(u_local - warpCenter);
    let dist_weft = abs(v_local - weftCenter);
    
    // Unevenness
    let warpThickVar = 1.0 + periodicNoise2D(vec2<f32>(i * 0.5, 0.0), scale * warpDensity * 0.5) * u.threadUnevenness * 0.3;
    let weftThickVar = 1.0 + periodicNoise2D(vec2<f32>(0.0, j * 0.5), scale * weftDensity * 0.5) * u.threadUnevenness * 0.3;
    
    let warpThick = u.threadThickness * warpThickVar;
    let weftThick = u.threadThickness * weftThickVar;
    
    // Profiles
    let warpP = threadProfile(u_local - imperfection, warpThick, u.weaveTightness);
    let weftP = threadProfile(v_local - imperfection, weftThick, u.weaveTightness);
    
    // Undulation
    let warpSign = select(-1.0, 1.0, (i % 2.0) < 0.5);
    let warpPath = sin(v_coord * 3.14159265) * warpSign;
    
    let weftSign = select(1.0, -1.0, (j % 2.0) < 0.5);
    let weftPath = sin(u_coord * 3.14159265) * weftSign;
    
    // Combine
    let amp = u.threadHeightScale * 0.5;
    let warpH = warpPath * amp + warpP * u.threadHeightScale;
    let weftH = weftPath * amp + weftP * u.threadHeightScale;
    
    var h = 0.0;
    var isWarp = true;
    
    let noWarp = warpP < 0.01;
    let noWeft = weftP < 0.01;
    
    if (noWarp && noWeft) {
        h = 0.0;
    } else if (noWarp) {
        h = weftH;
        isWarp = false;
    } else if (noWeft) {
        h = warpH;
        isWarp = true;
    } else {
        if (warpH > weftH) {
            h = warpH;
            isWarp = true;
        } else {
            h = weftH;
            isWarp = false;
        }
    }
    
    // Shading & Details
    var density = h;
    
    // Twist
    var twistVal = 0.0;
    if (isWarp) {
        twistVal = threadTwistPattern(pos, vec2<f32>(0.0, 1.0), u.threadTwist, warpDensity);
    } else {
        twistVal = threadTwistPattern(pos, vec2<f32>(1.0, 0.0), u.threadTwist, weftDensity);
    }
    
    // Fiber
    var fiberVal = 0.0;
    if (isWarp) {
        fiberVal = fiberDetail(pos, vec2<f32>(0.0, 1.0), u.fiberDetail, warpDensity, scale * warpDensity);
    } else {
        fiberVal = fiberDetail(pos, vec2<f32>(1.0, 0.0), u.fiberDetail, weftDensity, scale * weftDensity);
    }
    
    // Fuzz
    let fuzzVal = fuzzEffect(pos, u.fuzziness, max(warpDensity, weftDensity), scale * max(warpDensity, weftDensity));
    
    let depth = 1.0 - h;
    let shadow = depth * u.threadShadowStrength * 0.5;
    
    density = density * (0.9 + twistVal * 0.2);
    density = density + fiberVal * 0.1;
    density = density + fuzzVal * 0.1;
    density = density - shadow;
    
    // Color variation noise
    let colorNoise = periodicFbm(vec3<f32>(pos * u.noiseFrequency, 0.0), i32(u.fbmOctaves), scale * u.noiseFrequency, u.fbmAmplitude);
    density = density + colorNoise * u.colorVariation;
    
    density = clamp(density, 0.0, 1.0);
    
    let sheen = select(u.weftSheen, u.warpSheen, isWarp);
    
    return WeaveData(density, h, sheen, isWarp);
}

@vertex
fn vs_main(@location(0) position : vec3<f32>, @location(1) uv : vec2<f32>) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(position, 1.0);
    output.uv = uv;
    return output;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
    let data = getPlainWeaveDetail(in.uv);
    let density = data.density;
    let height = data.height;
    let sheen = data.sheen;
    let isWarp = data.isWarp;
    
    // Base Color Selection
    let baseColor = select(u.weftColor.rgb, u.warpColor.rgb, isWarp);
    
    // Apply density as scalar lighting/shading
    let albedo = baseColor * density;
    
    let roughness = mix(u.roughnessMin, u.roughnessMax, 1.0 - sheen * 0.8);
    
    let dHdUV = vec2<f32>(dpdx(height), dpdy(height));
    let normal = normalize(vec3<f32>(-dHdUV.x * u.normalStrength, -dHdUV.y * u.normalStrength, 1.0));
    
    let lightDir = normalize(vec3<f32>(0.5, 0.5, 1.0));
    let diff = max(dot(normal, lightDir), 0.0);
    
    let viewDir = vec3<f32>(0.0, 0.0, 1.0);
    let halfDir = normalize(lightDir + viewDir);
    let spec = pow(max(dot(normal, halfDir), 0.0), 32.0 * (1.0 - roughness)) * sheen;
    
    let finalColor = albedo * (0.3 + 0.7 * diff) + vec3<f32>(spec * 0.6);
    
    return vec4<f32>(finalColor, 1.0);
}
`;
