export const warpShader = /* wgsl */`
struct Uniforms {
    strength: f32,
    mode: u32, // 0: Absolute, 1: Relative
    midPoint: f32, 
}

@group(0) @binding(0) var sourceSampler: sampler;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
@group(0) @binding(2) var mapTexture: texture_2d<f32>;
@group(0) @binding(3) var<uniform> uniforms: Uniforms;

@vertex
fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 4>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, 1.0)
    );
    return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
}

@fragment
fn fs_main(@builtin(position) GlobalInvocationID : vec4<f32>) -> @location(0) vec4<f32> {
    let dims = textureDimensions(sourceTexture);
    let coords = vec2<i32>(GlobalInvocationID.xy);
    
    // 1. Calculate Base UV
    let baseUV = vec2<f32>(coords) / vec2<f32>(dims);
    
    // 2. Sample Map Texture (Warp Vector)
    // Note: Assuming mapTexture is linear sampled for smoothness
    let vector = textureSample(mapTexture, sourceSampler, baseUV).rg;
    
    var finalUV = vec2<f32>(0.0);

    if (uniforms.mode == 0u) {
        // Mode 0: Absolute UV Mapping
        // R -> U, G -> V
        // Lerp between original UV and New UV based on strength
        finalUV = mix(baseUV, vector, uniforms.strength);
    } else {
        // Mode 1: Relative Vector Warp
        // (Vector - MidPoint) * Strength + OriginalUV
        let offset = (vector - vec2<f32>(uniforms.midPoint)) * uniforms.strength;
        finalUV = baseUV + offset;
    }

    // 3. Sample Source Texture with New UV
    // Clamp to edge or Repeat depends on sampler, usually Repeat for textures
    return textureSample(sourceTexture, sourceSampler, finalUV);
}
`;
