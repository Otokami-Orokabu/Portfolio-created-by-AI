/**
 * WebGL Utilities
 * Helper functions for working with WebGL
 */

const WebGLUtils = {
    /**
     * Creates and compiles a shader
     * @param {WebGLRenderingContext} gl - The WebGL context
     * @param {string} source - The GLSL source code for the shader
     * @param {number} type - The type of shader (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
     * @returns {WebGLShader} The compiled shader
     */
    createShader: function(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        // Check if compilation was successful
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    },
    
    /**
     * Creates a program from vertex and fragment shaders
     * @param {WebGLRenderingContext} gl - The WebGL context
     * @param {WebGLShader} vertexShader - The vertex shader
     * @param {WebGLShader} fragmentShader - The fragment shader
     * @returns {WebGLProgram} The compiled and linked program
     */
    createProgram: function(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        // Check if linking was successful
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        
        return program;
    },
    
    /**
     * Creates a WebGL context from a canvas element
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {Object} options - WebGL context options
     * @returns {WebGLRenderingContext} The WebGL context
     */
    createContext: function(canvas, options = {}) {
        let gl = null;
        
        try {
            // Try to get WebGL2 context first
            gl = canvas.getContext('webgl2', options);
            if (gl) {
                gl.webglVersion = 2;
                return gl;
            }
            
            // Fall back to WebGL1
            gl = canvas.getContext('webgl', options) || 
                 canvas.getContext('experimental-webgl', options);
            
            if (gl) {
                gl.webglVersion = 1;
                return gl;
            }
            
            throw new Error('WebGL not supported');
        } catch (e) {
            console.error('Error creating WebGL context:', e);
            return null;
        }
    },
    
    /**
     * Resizes the canvas to match its display size
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @returns {boolean} True if the canvas was resized
     */
    resizeCanvasToDisplaySize: function(canvas) {
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        const needResize = canvas.width !== displayWidth || 
                          canvas.height !== displayHeight;
        
        if (needResize) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
        
        return needResize;
    },
    
    /**
     * Creates a buffer and loads data into it
     * @param {WebGLRenderingContext} gl - The WebGL context
     * @param {number} target - The buffer target (e.g., gl.ARRAY_BUFFER)
     * @param {ArrayBuffer} data - The data to load into the buffer
     * @param {number} usage - The buffer usage (e.g., gl.STATIC_DRAW)
     * @returns {WebGLBuffer} The created buffer
     */
    createBuffer: function(gl, target, data, usage) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage);
        return buffer;
    },
    
    /**
     * Creates a texture and sets parameters
     * @param {WebGLRenderingContext} gl - The WebGL context
     * @param {Object} options - Texture options
     * @returns {WebGLTexture} The created texture
     */
    createTexture: function(gl, options = {}) {
        const {
            minFilter = gl.LINEAR,
            magFilter = gl.LINEAR,
            wrapS = gl.CLAMP_TO_EDGE,
            wrapT = gl.CLAMP_TO_EDGE,
            format = gl.RGBA,
            internalFormat = format,
            type = gl.UNSIGNED_BYTE,
            image = null,
            width = 1,
            height = 1,
            data = null
        } = options;
        
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
        
        // Upload texture data
        if (image) {
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, image);
            if (minFilter === gl.LINEAR_MIPMAP_LINEAR || 
                minFilter === gl.LINEAR_MIPMAP_NEAREST || 
                minFilter === gl.NEAREST_MIPMAP_LINEAR || 
                minFilter === gl.NEAREST_MIPMAP_NEAREST) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
        } else if (data) {
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);
        } else {
            // Create empty texture
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
        }
        
        return texture;
    },
    
    /**
     * Gets the location of an attribute in a program
     * @param {WebGLRenderingContext} gl - The WebGL context
     * @param {WebGLProgram} program - The WebGL program
     * @param {string} name - The attribute name
     * @returns {number} The attribute location
     */
    getAttribLocation: function(gl, program, name) {
        const location = gl.getAttribLocation(program, name);
        if (location === -1) {
            console.warn(`Attribute '${name}' not found in shader program.`);
        }
        return location;
    },
    
    /**
     * Gets the location of a uniform in a program
     * @param {WebGLRenderingContext} gl - The WebGL context
     * @param {WebGLProgram} program - The WebGL program
     * @param {string} name - The uniform name
     * @returns {WebGLUniformLocation} The uniform location
     */
    getUniformLocation: function(gl, program, name) {
        const location = gl.getUniformLocation(program, name);
        if (location === null) {
            console.warn(`Uniform '${name}' not found in shader program.`);
        }
        return location;
    },
    
    /**
     * Creates a full-screen quad (2 triangles)
     * @param {WebGLRenderingContext} gl - The WebGL context
     * @returns {Object} Object containing buffer and attribute information
     */
    createFullScreenQuad: function(gl) {
        // Create a buffer for positions
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        
        const positionBuffer = this.createBuffer(
            gl, 
            gl.ARRAY_BUFFER, 
            positions, 
            gl.STATIC_DRAW
        );
        
        // Create a buffer for texture coordinates
        const texCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]);
        
        const texCoordBuffer = this.createBuffer(
            gl, 
            gl.ARRAY_BUFFER, 
            texCoords, 
            gl.STATIC_DRAW
        );
        
        return {
            position: {
                buffer: positionBuffer,
                size: 2,
                type: gl.FLOAT,
                normalized: false,
                stride: 0,
                offset: 0
            },
            texCoord: {
                buffer: texCoordBuffer,
                size: 2,
                type: gl.FLOAT,
                normalized: false,
                stride: 0,
                offset: 0
            },
            vertexCount: 4,
            drawMode: gl.TRIANGLE_STRIP
        };
    }
};
