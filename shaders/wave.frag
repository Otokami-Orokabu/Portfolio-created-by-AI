precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    uv.y = 1.0 - uv.y; // Flip Y for standard coordinate system
    
    // Create animated waves
    float frequency = 20.0;
    float amplitude = 0.05;
    
    // Use mouse position to modify wave parameters if available
    if (u_mouse.x > 0.0 || u_mouse.y > 0.0) {
        frequency = 10.0 + u_mouse.x * 30.0;
        amplitude = u_mouse.y * 0.1;
    }
    
    // Generate waves
    float wave1 = sin(uv.x * frequency + u_time) * amplitude;
    float wave2 = sin(uv.y * frequency * 0.8 + u_time * 1.3) * amplitude;
    
    // Distort UV coordinates with waves
    vec2 distortedUV = uv;
    distortedUV.x += wave1;
    distortedUV.y += wave2;
    
    // Create color gradient
    vec3 color1 = vec3(0.0, 0.5, 0.9); // Blue
    vec3 color2 = vec3(0.9, 0.1, 0.5); // Pink
    vec3 color3 = vec3(0.1, 0.9, 0.5); // Green
    
    // Mix colors based on position and time
    vec3 color = mix(
        mix(color1, color2, distortedUV.x),
        color3,
        sin(distortedUV.y * 3.14159 + u_time * 0.2) * 0.5 + 0.5
    );
    
    // Add some brightness variation
    color += 0.05 * sin(u_time * 2.0 + uv.x * 10.0);
    
    // Output final color
    gl_FragColor = vec4(color, 1.0);
}
