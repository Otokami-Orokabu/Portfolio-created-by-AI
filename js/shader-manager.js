/**
 * Shader Manager
 * Handles loading, compiling, and managing shaders
 */

class ShaderManager {
    /**
     * Create a new ShaderManager
     * @param {WebGLRenderingContext} gl - The WebGL context
     */
    constructor(gl) {
        this.gl = gl;
        this.programs = new Map();
        this.currentProgram = null;
        
        // Default vertex shader for fragment shader effects
        this.defaultVertexShader = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            
            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;
    }
    
    /**
     * Loads a shader from a URL
     * @param {string} url - The URL of the shader file
     * @returns {Promise<string>} A promise that resolves with the shader source
     */
    async loadShaderSource(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load shader from ${url}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Error loading shader:', error);
            throw error;
        }
    }
    
    /**
     * Creates a shader program from vertex and fragment shader sources
     * @param {string} name - The name of the program
     * @param {string} vertexSource - The vertex shader source
     * @param {string} fragmentSource - The fragment shader source
     * @returns {WebGLProgram} The compiled and linked program
     */
    createProgram(name, vertexSource, fragmentSource) {
        const gl = this.gl;
        
        // Compile shaders
        const vertexShader = WebGLUtils.createShader(gl, vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = WebGLUtils.createShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
        
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        
        // Create program
        const program = WebGLUtils.createProgram(gl, vertexShader, fragmentShader);
        
        if (!program) {
            return null;
        }
        
        // Store program
        this.programs.set(name, {
            program,
            attributes: {},
            uniforms: {},
            vertexSource,
            fragmentSource
        });
        
        return program;
    }
    
    /**
     * Creates a shader program for a fragment shader effect
     * @param {string} name - The name of the program
     * @param {string} fragmentSource - The fragment shader source
     * @returns {WebGLProgram} The compiled and linked program
     */
    createFragmentShaderProgram(name, fragmentSource) {
        return this.createProgram(name, this.defaultVertexShader, fragmentSource);
    }
    
    /**
     * Gets a program by name
     * @param {string} name - The name of the program
     * @returns {Object} The program object
     */
    getProgram(name) {
        return this.programs.get(name);
    }
    
    /**
     * Uses a program
     * @param {string} name - The name of the program
     * @returns {boolean} True if the program was successfully used
     */
    useProgram(name) {
        const programInfo = this.programs.get(name);
        
        if (!programInfo) {
            console.error(`Program '${name}' not found`);
            return false;
        }
        
        this.gl.useProgram(programInfo.program);
        this.currentProgram = name;
        
        return true;
    }
    
    /**
     * Gets the current program
     * @returns {Object} The current program object
     */
    getCurrentProgram() {
        if (!this.currentProgram) {
            return null;
        }
        
        return this.programs.get(this.currentProgram);
    }
    
    /**
     * Gets an attribute location and caches it
     * @param {string} programName - The name of the program
     * @param {string} attributeName - The name of the attribute
     * @returns {number} The attribute location
     */
    getAttribLocation(programName, attributeName) {
        const programInfo = this.programs.get(programName);
        
        if (!programInfo) {
            console.error(`Program '${programName}' not found`);
            return -1;
        }
        
        if (programInfo.attributes[attributeName] === undefined) {
            programInfo.attributes[attributeName] = WebGLUtils.getAttribLocation(
                this.gl, 
                programInfo.program, 
                attributeName
            );
        }
        
        return programInfo.attributes[attributeName];
    }
    
    /**
     * Gets a uniform location and caches it
     * @param {string} programName - The name of the program
     * @param {string} uniformName - The name of the uniform
     * @returns {WebGLUniformLocation} The uniform location
     */
    getUniformLocation(programName, uniformName) {
        const programInfo = this.programs.get(programName);
        
        if (!programInfo) {
            console.error(`Program '${programName}' not found`);
            return null;
        }
        
        if (programInfo.uniforms[uniformName] === undefined) {
            programInfo.uniforms[uniformName] = WebGLUtils.getUniformLocation(
                this.gl, 
                programInfo.program, 
                uniformName
            );
        }
        
        return programInfo.uniforms[uniformName];
    }
    
    /**
     * Sets up attribute pointers for a quad
     * @param {string} programName - The name of the program
     * @param {Object} quad - The quad object from WebGLUtils.createFullScreenQuad
     */
    setupQuadAttributes(programName, quad) {
        const gl = this.gl;
        
        // Position attribute
        const positionLocation = this.getAttribLocation(programName, 'a_position');
        if (positionLocation !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, quad.position.buffer);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(
                positionLocation,
                quad.position.size,
                quad.position.type,
                quad.position.normalized,
                quad.position.stride,
                quad.position.offset
            );
        }
        
        // Texture coordinate attribute
        const texCoordLocation = this.getAttribLocation(programName, 'a_texCoord');
        if (texCoordLocation !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, quad.texCoord.buffer);
            gl.enableVertexAttribArray(texCoordLocation);
            gl.vertexAttribPointer(
                texCoordLocation,
                quad.texCoord.size,
                quad.texCoord.type,
                quad.texCoord.normalized,
                quad.texCoord.stride,
                quad.texCoord.offset
            );
        }
    }
    
    /**
     * Sets a uniform value
     * @param {string} programName - The name of the program
     * @param {string} uniformName - The name of the uniform
     * @param {string} type - The type of uniform (e.g., '1f', '2f', '3f', '4f', '1i', 'matrix4fv')
     * @param {any} value - The value to set
     */
    setUniform(programName, uniformName, type, value) {
        const gl = this.gl;
        const location = this.getUniformLocation(programName, uniformName);
        
        if (location === null) {
            return;
        }
        
        switch (type) {
            case '1f':
                gl.uniform1f(location, value);
                break;
            case '2f':
                gl.uniform2f(location, value[0], value[1]);
                break;
            case '3f':
                gl.uniform3f(location, value[0], value[1], value[2]);
                break;
            case '4f':
                gl.uniform4f(location, value[0], value[1], value[2], value[3]);
                break;
            case '1i':
                gl.uniform1i(location, value);
                break;
            case '2i':
                gl.uniform2i(location, value[0], value[1]);
                break;
            case '3i':
                gl.uniform3i(location, value[0], value[1], value[2]);
                break;
            case '4i':
                gl.uniform4i(location, value[0], value[1], value[2], value[3]);
                break;
            case '1fv':
                gl.uniform1fv(location, value);
                break;
            case '2fv':
                gl.uniform2fv(location, value);
                break;
            case '3fv':
                gl.uniform3fv(location, value);
                break;
            case '4fv':
                gl.uniform4fv(location, value);
                break;
            case 'matrix2fv':
                gl.uniformMatrix2fv(location, false, value);
                break;
            case 'matrix3fv':
                gl.uniformMatrix3fv(location, false, value);
                break;
            case 'matrix4fv':
                gl.uniformMatrix4fv(location, false, value);
                break;
            default:
                console.error(`Unknown uniform type: ${type}`);
        }
    }
    
    /**
     * Deletes a program
     * @param {string} name - The name of the program
     */
    deleteProgram(name) {
        const programInfo = this.programs.get(name);
        
        if (!programInfo) {
            return;
        }
        
        this.gl.deleteProgram(programInfo.program);
        this.programs.delete(name);
        
        if (this.currentProgram === name) {
            this.currentProgram = null;
        }
    }
    
    /**
     * Deletes all programs
     */
    deleteAllPrograms() {
        for (const [name] of this.programs) {
            this.deleteProgram(name);
        }
    }
}
