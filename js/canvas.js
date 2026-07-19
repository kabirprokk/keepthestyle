/**
 * KeepTheStyle - Canvas Management
 * Handles rendering and interaction on the canvas
 */

class CanvasManager {
    constructor(container) {
        this.container = container;
        this.page = container.querySelector('.canvas-page');
        this.wrapper = container.querySelector('.canvas-wrapper');
        this.store = window.store;
        
        // State
        this.zoom = 1;
        this.isDragging = false;
        this.dragTarget = null;
        this.dragOffset = { x: 0, y: 0 };
        this.selectedElements = [];
        
        // Bind events
        this.bindEvents();
        this.render();
        
        // Subscribe to store changes
        this.store.subscribe(() => this.render());
    }

    bindEvents() {
        // Mouse events for dragging
        this.page.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        // Zoom controls
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.title;
                if (action === 'Zoom In') this.zoomIn();
                else if (action === 'Zoom Out') this.zoomOut();
                else if (action === 'Fit Screen') this.fitScreen();
            });
        });
    }

    render() {
        const state = this.store.getState();
        const elements = state.elements;
        const selectedIds = state.selectedElements;
        
        // Clear page
        this.page.innerHTML = '';
        
        // Render each element
        elements.forEach(element => {
            const el = this.createElement(element);
            this.page.appendChild(el);
            
            // Apply selection state
            if (selectedIds.includes(element.id)) {
                el.classList.add('selected');
                this.addSelectionHandles(el);
            }
        });
        
        // Update page size
        this.updatePageSize(state.pageSize);
        
        // Update zoom display
        document.querySelector('.zoom-level').textContent = `${Math.round(this.zoom * 100)}%`;
    }

    createElement(data) {
        const el = document.createElement(data.tag || 'div');
        el.dataset.id = data.id;
        el.dataset.tag = data.tag || 'div';
        
        // Apply position
        if (data.position) {
            el.style.left = `${data.position.x}px`;
            el.style.top = `${data.position.y}px`;
        }
        
        // Apply size
        if (data.size) {
            el.style.width = `${data.size.width}px`;
            el.style.height = `${data.size.height}px`;
        }
        
        // Apply styles
        if (data.styles) {
            Object.entries(data.styles).forEach(([prop, value]) => {
                el.style[prop] = value;
            });
        }
        
        // Set content
        if (data.content) {
            el.textContent = data.content;
        }
        
        // Set attributes
        if (data.attributes) {
            Object.entries(data.attributes).forEach(([attr, value]) => {
                el.setAttribute(attr, value);
            });
        }
        
        // Make draggable
        el.style.position = 'absolute';
        el.style.cursor = 'move';
        el.style.userSelect = 'none';
        
        return el;
    }

    addSelectionHandles(el) {
        // Add resize handles (simplified)
        const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
        handles.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.style.position = 'absolute';
            handle.style.width = '8px';
            handle.style.height = '8px';
            handle.style.backgroundColor = '#4D6BFF';
            handle.style.border = '2px solid white';
            handle.style.borderRadius = '50%';
            handle.style.zIndex = '1000';
            
            // Position handles
            switch(pos) {
                case 'nw': 
                    handle.style.top = '-4px'; 
                    handle.style.left = '-4px'; 
                    handle.style.cursor = 'nw-resize';
                    break;
                case 'ne': 
                    handle.style.top = '-4px'; 
                    handle.style.right = '-4px'; 
                    handle.style.cursor = 'ne-resize';
                    break;
                case 'sw': 
                    handle.style.bottom = '-4px'; 
                    handle.style.left = '-4px'; 
                    handle.style.cursor = 'sw-resize';
                    break;
                case 'se': 
                    handle.style.bottom = '-4px'; 
                    handle.style.right = '-4px'; 
                    handle.style.cursor = 'se-resize';
                    break;
                case 'n': 
                    handle.style.top = '-4px'; 
                    handle.style.left = '50%'; 
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.cursor = 'n-resize';
                    break;
                case 's': 
                    handle.style.bottom = '-4px'; 
                    handle.style.left = '50%'; 
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.cursor = 's-resize';
                    break;
                case 'e': 
                    handle.style.right = '-4px'; 
                    handle.style.top = '50%'; 
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.cursor = 'e-resize';
                    break;
                case 'w': 
                    handle.style.left = '-4px'; 
                    handle.style.top = '50%'; 
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.cursor = 'w-resize';
                    break;
            }
            
            el.appendChild(handle);
        });
        
        // Add rotation handle
        const rotHandle = document.createElement('div');
        rotHandle.className = 'rotation-handle';
        rotHandle.style.position = 'absolute';
        rotHandle.style.top = '-30px';
        rotHandle.style.left = '50%';
        rotHandle.style.transform = 'translateX(-50%)';
        rotHandle.style.width = '16px';
        rotHandle.style.height = '16px';
        rotHandle.style.backgroundColor = '#4D6BFF';
        rotHandle.style.border = '2px solid white';
        rotHandle.style.borderRadius = '50%';
        rotHandle.style.cursor = 'grab';
        rotHandle.style.zIndex = '1000';
        rotHandle.textContent = '↻';
        rotHandle.style.display = 'flex';
        rotHandle.style.alignItems = 'center';
        rotHandle.style.justifyContent = 'center';
        rotHandle.style.fontSize = '10px';
        rotHandle.style.color = 'white';
        
        el.appendChild(rotHandle);
    }

    onMouseDown(e) {
        const target = e.target.closest('[data-id]');
        if (!target) {
            this.store.clearSelection();
            return;
        }
        
        const id = target.dataset.id;
        const state = this.store.getState();
        
        // Check if shift is held for multi-select
        if (e.shiftKey) {
            if (state.selectedElements.includes(id)) {
                this.store.deselectElement(id);
            } else {
                this.store.selectElement(id);
            }
        } else {
            this.store.selectElement(id);
        }
        
        // Start drag
        this.isDragging = true;
        this.dragTarget = target;
        const rect = target.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        e.preventDefault();
    }

    onMouseMove(e) {
        if (!this.isDragging || !this.dragTarget) return;
        
        const state = this.store.getState();
        const id = this.dragTarget.dataset.id;
        const element = state.elements.find(el => el.id === id);
        if (!element) return;
        
        // Calculate new position
        const rect = this.page.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.dragOffset.x) / this.zoom;
        const y = (e.clientY - rect.top - this.dragOffset.y) / this.zoom;
        
        // Update element position
        this.store.updateElement(id, {
            position: { x, y }
        });
    }

    onMouseUp(e) {
        this.isDragging = false;
        this.dragTarget = null;
    }

    onKeyDown(e) {
        // Delete key
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const state = this.store.getState();
            state.selectedElements.forEach(id => {
                this.store.deleteElement(id);
            });
            e.preventDefault();
