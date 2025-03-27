/**
 * Main JavaScript for Fragment Shader Portfolio
 */

// Global variables
let currentShader;
let animationFrameId;
let startTime;
let mousePosition = { x: 0, y: 0 };
let shaderCanvases = new Map();
let controlsEnabled = true;
let shaderManagers = new Map(); // Map to store shader managers for each context

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initHeroShader();
    initGallery();
    setupNavigation();
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
});

/**
 * Initialize the hero section shader
 */
function initHeroShader() {
    const container = document.getElementById('hero-shader');
    if (!container) return;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    
    // Initialize WebGL
    const gl = WebGLUtils.createContext(canvas);
    if (!gl) {
        showWebGLError(container);
        return;
    }
    
    // Create shader manager for this context
    const shaderManager = new ShaderManager(gl);
    shaderManagers.set('hero', shaderManager);
    
    // Get featured shader
    const featuredShader = Shaders.getFeatured();
    if (!featuredShader) return;
    
    // Create shader program
    const program = shaderManager.createFragmentShaderProgram(
        featuredShader.id,
        featuredShader.fragmentShader
    );
    
    if (!program) {
        showShaderError(container, 'Failed to compile shader program');
        return;
    }
    
    // Create full-screen quad
    const quad = WebGLUtils.createFullScreenQuad(gl);
    
    // Set up mouse tracking
    setupMouseTracking(canvas);
    
    // Start animation
    startTime = performance.now();
    currentShader = featuredShader;
    
    // Store canvas reference
    shaderCanvases.set(featuredShader.id, { 
        canvas, 
        gl, 
        quad, 
        startTime,
        speedFactor: 1.0,
        shaderManagerKey: 'hero'
    });
    
    // Start render loop
    animateHeroShader();
}

/**
 * Initialize the gallery section
 */
function initGallery() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    // Clear existing gallery items
    galleryGrid.innerHTML = '';
    
    // Create gallery items
    Shaders.collection.forEach(shader => {
        const galleryItem = createGalleryItem(shader);
        galleryGrid.appendChild(galleryItem);
        
        // Initialize preview canvas
        initPreviewCanvas(shader, galleryItem.querySelector('.gallery-item-preview'));
    });
}

/**
 * Create a gallery item for a shader
 * @param {Object} shader - The shader definition
 * @returns {HTMLElement} The gallery item element
 */
function createGalleryItem(shader) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.shaderId = shader.id;
    
    // Create HTML structure
    item.innerHTML = `
        <div class="gallery-item-preview"></div>
        <div class="gallery-item-info">
            <h3>${shader.name}</h3>
            <p>${shader.description}</p>
            <div class="gallery-item-tags">
                ${shader.tags.map(tag => `<span class="gallery-item-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
    
    // Add click event to open shader detail
    item.addEventListener('click', () => {
        openShaderDetail(shader.id);
    });
    
    return item;
}

/**
 * Initialize a preview canvas for a gallery item
 * @param {Object} shader - The shader definition
 * @param {HTMLElement} container - The container element
 */
function initPreviewCanvas(shader, container) {
    if (!container) return;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 300;
    canvas.height = container.clientHeight || 200;
    container.appendChild(canvas);
    
    // Initialize WebGL
    const gl = WebGLUtils.createContext(canvas);
    if (!gl) {
        container.innerHTML = '<div class="error-message">WebGL not supported</div>';
        return;
    }
    
    // Create shader manager for this context
    const previewKey = `preview-${shader.id}`;
    const shaderManager = new ShaderManager(gl);
    shaderManagers.set(previewKey, shaderManager);
    
    // Create shader program
    const program = shaderManager.createFragmentShaderProgram(
        previewKey,
        shader.fragmentShader
    );
    
    if (!program) {
        container.innerHTML = '<div class="error-message">Shader compilation failed</div>';
        return;
    }
    
    // Create full-screen quad
    const quad = WebGLUtils.createFullScreenQuad(gl);
    
    // Store canvas reference
    shaderCanvases.set(previewKey, { 
        canvas, 
        gl, 
        quad, 
        startTime: performance.now(),
        speedFactor: 0.5, // Slower for previews
        shaderManagerKey: previewKey
    });
    
    // Render once
    renderShader(
        previewKey, 
        shader, 
        performance.now() - shaderCanvases.get(previewKey).startTime
    );
}

/**
 * Animate the hero shader
 */
function animateHeroShader() {
    if (!currentShader) return;
    
    const canvasInfo = shaderCanvases.get(currentShader.id);
    if (!canvasInfo) return;
    
    const now = performance.now();
    const elapsed = now - canvasInfo.startTime;
    
    // Render the shader
    renderShader(currentShader.id, currentShader, elapsed * canvasInfo.speedFactor);
    
    // Request next frame
    animationFrameId = requestAnimationFrame(animateHeroShader);
}

/**
 * Render a shader
 * @param {string} id - The shader ID or preview ID
 * @param {Object} shader - The shader definition
 * @param {number} elapsed - Elapsed time in milliseconds
 */
function renderShader(id, shader, elapsed) {
    const canvasInfo = shaderCanvases.get(id);
    if (!canvasInfo) return;
    
    const { canvas, gl, quad, shaderManagerKey } = canvasInfo;
    const shaderManager = shaderManagers.get(shaderManagerKey);
    
    if (!shaderManager) {
        console.error(`Shader manager for ${id} not found`);
        return;
    }
    
    // Resize canvas if needed
    WebGLUtils.resizeCanvasToDisplaySize(canvas);
    
    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Clear canvas
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use shader program
    const programName = id;
    shaderManager.useProgram(programName);
    
    // Set up attributes
    shaderManager.setupQuadAttributes(programName, quad);
    
    // Set uniforms
    shaderManager.setUniform(programName, 'u_time', '1f', elapsed * 0.001);
    shaderManager.setUniform(programName, 'u_resolution', '2f', [canvas.width, canvas.height]);
    
    // Set mouse position if available
    if (shader.uniforms && shader.uniforms.u_mouse) {
        shaderManager.setUniform(programName, 'u_mouse', '2f', [mousePosition.x, mousePosition.y]);
    }
    
    // Draw the quad
    gl.drawArrays(quad.drawMode, 0, quad.vertexCount);
}

/**
 * Set up mouse tracking for interactive shaders
 * @param {HTMLCanvasElement} canvas - The canvas element
 */
function setupMouseTracking(canvas) {
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        mousePosition.x = (event.clientX - rect.left) / rect.width;
        mousePosition.y = (event.clientY - rect.top) / rect.height;
    });
    
    canvas.addEventListener('mouseleave', () => {
        mousePosition.x = 0.5;
        mousePosition.y = 0.5;
    });
    
    // For touch devices
    canvas.addEventListener('touchmove', (event) => {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        mousePosition.x = (touch.clientX - rect.left) / rect.width;
        mousePosition.y = (touch.clientY - rect.top) / rect.height;
    });
    
    canvas.addEventListener('touchend', () => {
        mousePosition.x = 0.5;
        mousePosition.y = 0.5;
    });
}

/**
 * Open a shader detail view
 * @param {string} shaderId - The shader ID
 */
function openShaderDetail(shaderId) {
    const shader = Shaders.getById(shaderId);
    if (!shader) return;
    
    // Create shader detail page
    const main = document.querySelector('main');
    const currentContent = main.innerHTML;
    
    // Store current content for back navigation
    main.dataset.previousContent = currentContent;
    
    // Create shader detail content
    main.innerHTML = `
        <section class="shader-detail">
            <div class="container">
                <div class="shader-detail-header">
                    <button class="btn-back">← 戻る</button>
                    <h2>${shader.name}</h2>
                </div>
                
                <div class="shader-detail-container">
                    <div class="shader-canvas-container" id="detail-shader-container"></div>
                    
                    <div class="shader-controls">
                        <h3>パラメータ</h3>
                        <div id="shader-controls-container">
                            ${shader.controls.map(control => `
                                <div class="shader-control">
                                    <label for="control-${control.name}">${control.label}</label>
                                    <input 
                                        type="${control.type}" 
                                        id="control-${control.name}" 
                                        min="${control.min}" 
                                        max="${control.max}" 
                                        step="${control.step}" 
                                        value="${control.default}"
                                    >
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="shader-info">
                    <h3>説明</h3>
                    <p>${shader.description}</p>
                    
                    <div class="shader-tags">
                        ${shader.tags.map(tag => `<span class="gallery-item-tag">${tag}</span>`).join('')}
                    </div>
                </div>
                
                <div class="shader-code">
                    <h3>Fragment Shader コード</h3>
                    <pre>${escapeHtml(shader.fragmentShader)}</pre>
                </div>
            </div>
        </section>
    `;
    
    // Set up back button
    const backButton = document.querySelector('.btn-back');
    backButton.addEventListener('click', () => {
        // Cancel current animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Clean up WebGL resources
        const detailKey = `detail-${shader.id}`;
        const shaderManager = shaderManagers.get(detailKey);
        if (shaderManager) {
            shaderManager.deleteAllPrograms();
            shaderManagers.delete(detailKey);
        }
        
        // Remove canvas reference
        shaderCanvases.delete(detailKey);
        
        // Restore previous content
        main.innerHTML = main.dataset.previousContent;
        
        // Re-initialize gallery
        initGallery();
        
        // Re-initialize hero shader
        initHeroShader();
        
        // Update navigation
        setupNavigation();
    });
    
    // Initialize detail shader
    initDetailShader(shader);
    
    // Set up controls
    setupShaderControls(shader);
    
    // Scroll to top
    window.scrollTo(0, 0);
}

/**
 * Initialize the detail view shader
 * @param {Object} shader - The shader definition
 */
function initDetailShader(shader) {
    // Cancel current animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    const container = document.getElementById('detail-shader-container');
    if (!container) return;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    
    // Initialize WebGL
    const gl = WebGLUtils.createContext(canvas);
    if (!gl) {
        showWebGLError(container);
        return;
    }
    
    // Create shader manager for this context
    const detailKey = `detail-${shader.id}`;
    const shaderManager = new ShaderManager(gl);
    shaderManagers.set(detailKey, shaderManager);
    
    // Create shader program
    const program = shaderManager.createFragmentShaderProgram(
        detailKey,
        shader.fragmentShader
    );
    
    if (!program) {
        showShaderError(container, 'Failed to compile shader program');
        return;
    }
    
    // Create full-screen quad
    const quad = WebGLUtils.createFullScreenQuad(gl);
    
    // Set up mouse tracking
    setupMouseTracking(canvas);
    
    // Start animation
    const startTime = performance.now();
    currentShader = shader;
    
    // Store canvas reference
    shaderCanvases.set(detailKey, { 
        canvas, 
        gl, 
        quad, 
        startTime,
        speedFactor: 1.0,
        shaderManagerKey: detailKey
    });
    
    // Start render loop
    animateDetailShader(shader);
}

/**
 * Animate the detail shader
 * @param {Object} shader - The shader definition
 */
function animateDetailShader(shader) {
    const detailKey = `detail-${shader.id}`;
    const canvasInfo = shaderCanvases.get(detailKey);
    if (!canvasInfo) return;
    
    const now = performance.now();
    const elapsed = now - canvasInfo.startTime;
    
    // Render the shader
    renderShader(detailKey, shader, elapsed * canvasInfo.speedFactor);
    
    // Request next frame
    animationFrameId = requestAnimationFrame(() => animateDetailShader(shader));
}

/**
 * Set up shader controls
 * @param {Object} shader - The shader definition
 */
function setupShaderControls(shader) {
    shader.controls.forEach(control => {
        const input = document.getElementById(`control-${control.name}`);
        if (!input) return;
        
        input.addEventListener('input', () => {
            if (!controlsEnabled) return;
            
            const value = parseFloat(input.value);
            const detailKey = `detail-${shader.id}`;
            const shaderManager = shaderManagers.get(detailKey);
            
            if (!shaderManager) {
                console.error(`Shader manager for ${detailKey} not found`);
                return;
            }
            
            // Handle specific controls
            switch (control.name) {
                case 'speed':
                    const canvasInfo = shaderCanvases.get(detailKey);
                    if (canvasInfo) {
                        canvasInfo.speedFactor = value;
                    }
                    break;
                    
                case 'scale':
                    // Update uniform in the shader
                    shaderManager.setUniform(detailKey, 'u_scale', '1f', value);
                    break;
                    
                // Add more control handlers as needed
                
                default:
                    // Generic uniform update
                    if (control.uniform) {
                        shaderManager.setUniform(
                            detailKey, 
                            control.uniform, 
                            control.uniformType || '1f', 
                            value
                        );
                    }
            }
        });
    });
}

/**
 * Set up navigation
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Scroll to section
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 70, // Adjust for header height
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Handle window resize
 */
function handleResize() {
    // Update all canvases
    shaderCanvases.forEach((canvasInfo, id) => {
        const { canvas } = canvasInfo;
        
        // Get container
        let container;
        if (id.startsWith('preview-')) {
            const shaderId = id.replace('preview-', '');
            const galleryItem = document.querySelector(`.gallery-item[data-shader-id="${shaderId}"]`);
            if (galleryItem) {
                container = galleryItem.querySelector('.gallery-item-preview');
            }
        } else if (id.startsWith('detail-')) {
            container = document.getElementById('detail-shader-container');
        } else {
            container = document.getElementById('hero-shader');
        }
        
        // Resize canvas
        if (container && canvas) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }
    });
}

/**
 * Show WebGL error message
 * @param {HTMLElement} container - The container element
 */
function showWebGLError(container) {
    container.innerHTML = `
        <div class="error-message">
            <h3>WebGL not supported</h3>
            <p>Your browser does not support WebGL, which is required to view these shaders.</p>
            <p>Please try using a modern browser like Chrome, Firefox, or Edge.</p>
        </div>
    `;
}

/**
 * Show shader error message
 * @param {HTMLElement} container - The container element
 * @param {string} message - The error message
 */
function showShaderError(container, message) {
    container.innerHTML = `
        <div class="error-message">
            <h3>Shader Error</h3>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Escape HTML special characters
 * @param {string} html - The HTML string to escape
 * @returns {string} The escaped HTML string
 */
function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}
