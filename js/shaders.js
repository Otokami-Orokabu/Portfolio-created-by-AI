/**
 * Shader Definitions
 * Collection of fragment shaders for the portfolio
 */

const Shaders = {
    // Collection of shader definitions
    collection: [
        {
            id: 'gradient-wave',
            name: 'Gradient Wave',
            description: 'カラフルなグラデーションの波のアニメーション',
            tags: ['gradient', 'animation', 'wave'],
            thumbnail: null, // Will be generated
            fragmentShader: `
                precision highp float;
                
                uniform vec2 u_resolution;
                uniform float u_time;
                
                varying vec2 v_texCoord;
                
                void main() {
                    vec2 uv = v_texCoord;
                    uv.y = 1.0 - uv.y; // Flip Y for standard coordinate system
                    
                    // Create animated waves
                    float frequency = 10.0;
                    float amplitude = 0.1;
                    float wave1 = sin(uv.x * frequency + u_time) * amplitude;
                    float wave2 = sin(uv.y * frequency + u_time * 0.7) * amplitude;
                    
                    // Create gradient based on position and time
                    vec3 color1 = vec3(0.2, 0.7, 0.9); // Blue
                    vec3 color2 = vec3(0.9, 0.2, 0.5); // Pink
                    
                    // Mix colors based on position and waves
                    vec3 color = mix(
                        color1,
                        color2,
                        sin(uv.x * 3.14159 + wave1 + wave2 + u_time * 0.5) * 0.5 + 0.5
                    );
                    
                    // Add some brightness variation
                    color += 0.1 * sin(u_time + uv.y * 20.0);
                    
                    // Output final color
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            uniforms: {
                u_time: { type: '1f', value: 0 },
                u_resolution: { type: '2f', value: [0, 0] },
                u_mouse: { type: '2f', value: [0, 0] }
            },
            controls: [
                {
                    name: 'speed',
                    label: 'Speed',
                    type: 'range',
                    min: 0.1,
                    max: 2.0,
                    step: 0.1,
                    default: 1.0,
                    uniform: null // Will be set at runtime
                }
            ]
        },
        {
            id: 'fractal-julia',
            name: 'Julia Fractal',
            description: 'インタラクティブなジュリア集合フラクタル',
            tags: ['fractal', 'mathematics', 'complex'],
            thumbnail: null,
            fragmentShader: `
                precision highp float;
                
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;
                
                varying vec2 v_texCoord;
                
                #define MAX_ITERATIONS 100
                
                vec2 complexMul(vec2 a, vec2 b) {
                    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
                }
                
                vec3 hsv2rgb(vec3 c) {
                    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
                }
                
                void main() {
                    vec2 uv = v_texCoord;
                    uv.y = 1.0 - uv.y;
                    
                    // Scale and center coordinates
                    vec2 c = (uv * 2.0 - 1.0) * 1.5;
                    
                    // Calculate Julia set parameter based on time or mouse
                    float t = u_time * 0.1;
                    vec2 juliaParam;
                    
                    // Use mouse position if available, otherwise animate
                    if (u_mouse.x > 0.0 || u_mouse.y > 0.0) {
                        juliaParam = (u_mouse * 2.0 - 1.0) * 0.8;
                    } else {
                        juliaParam = vec2(
                            0.7 * sin(t),
                            0.3 * cos(t)
                        );
                    }
                    
                    // Julia set iteration
                    vec2 z = c;
                    float smoothColor = 0.0;
                    
                    // In WebGL 1.0, loop variables must be initialized in the declaration
                    for (int i = 0; i < MAX_ITERATIONS; i++) {
                        z = complexMul(z, z) + juliaParam;
                        
                        if (dot(z, z) > 4.0) {
                            // Smooth coloring formula
                            smoothColor = float(i) - log(log(dot(z, z))) / log(2.0);
                            break;
                        }
                    }
                    
                    // Check if we're inside the set based on smoothColor
                    // If we reached MAX_ITERATIONS without breaking, smoothColor will be 0.0
                    if (smoothColor == 0.0) {
                        // Inside the set
                        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                    } else {
                        // Outside the set - color based on iteration count
                        float hue = smoothColor / 100.0 + t * 0.5;
                        vec3 color = hsv2rgb(vec3(hue, 0.8, 1.0));
                        
                        gl_FragColor = vec4(color, 1.0);
                    }
                }
            `,
            uniforms: {
                u_time: { type: '1f', value: 0 },
                u_resolution: { type: '2f', value: [0, 0] },
                u_mouse: { type: '2f', value: [0, 0] }
            },
            controls: [
                {
                    name: 'iterations',
                    label: 'Iterations',
                    type: 'range',
                    min: 10,
                    max: 200,
                    step: 10,
                    default: 100,
                    uniform: null
                },
                {
                    name: 'zoom',
                    label: 'Zoom',
                    type: 'range',
                    min: 0.5,
                    max: 3.0,
                    step: 0.1,
                    default: 1.5,
                    uniform: null
                }
            ]
        },
        {
            id: 'noise-flow',
            name: 'Noise Flow',
            description: 'パーリンノイズを使用した流体のようなアニメーション',
            tags: ['noise', 'flow', 'animation'],
            thumbnail: null,
            fragmentShader: `
                precision highp float;
                
                uniform vec2 u_resolution;
                uniform float u_time;
                
                varying vec2 v_texCoord;
                
                // Simplex noise function
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                
                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy));
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod(i, 289.0);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                        + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                        dot(x12.zw,x12.zw)), 0.0);
                    m = m*m;
                    m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }
                
                void main() {
                    vec2 uv = v_texCoord;
                    uv.y = 1.0 - uv.y;
                    
                    // Scale for noise
                    float scale = 3.0;
                    float timeScale = 0.2;
                    
                    // Generate flow field using noise
                    float noise1 = snoise(uv * scale + u_time * timeScale);
                    float noise2 = snoise(uv * scale * 2.0 + vec2(0.5, 0.0) + u_time * timeScale * 1.5);
                    float noise3 = snoise(uv * scale * 4.0 + vec2(0.0, 0.5) + u_time * timeScale * 2.0);
                    
                    // Create color from noise
                    vec3 color1 = vec3(0.1, 0.5, 0.9); // Blue
                    vec3 color2 = vec3(0.1, 0.9, 0.5); // Green
                    vec3 color3 = vec3(0.9, 0.1, 0.3); // Red
                    
                    // Mix colors based on noise values
                    vec3 color = mix(
                        mix(color1, color2, noise1 * 0.5 + 0.5),
                        color3,
                        noise2 * 0.5 + 0.5
                    );
                    
                    // Add some variation with the third noise
                    color += color * (noise3 * 0.2);
                    
                    // Output final color
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            uniforms: {
                u_time: { type: '1f', value: 0 },
                u_resolution: { type: '2f', value: [0, 0] }
            },
            controls: [
                {
                    name: 'scale',
                    label: 'Scale',
                    type: 'range',
                    min: 1.0,
                    max: 10.0,
                    step: 0.5,
                    default: 3.0,
                    uniform: null
                },
                {
                    name: 'speed',
                    label: 'Speed',
                    type: 'range',
                    min: 0.1,
                    max: 1.0,
                    step: 0.05,
                    default: 0.2,
                    uniform: null
                }
            ]
        }
    ],
    
    // Get a shader by ID
    getById: function(id) {
        return this.collection.find(shader => shader.id === id);
    },
    
    // Get featured shader (first in collection by default)
    getFeatured: function() {
        return this.collection[0];
    }
};
