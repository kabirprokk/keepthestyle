/**
 * KeepTheStyle - Main Application
 * Initializes all modules and starts the application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Make store globally available
    window.store = window.store || new Store();
    
    // Initialize all managers
    const sidebar = new SidebarManager(document.getElementById('left-sidebar'));
    const canvas = new CanvasManager(document.getElementById('canvas-container'));
    const properties = new PropertiesManager(document.getElementById('right-sidebar'));
    const codePanel = new CodePanel(document.getElementById('code-panel'));
    const toolbar = new ToolbarManager(document.getElementById('toolbar'));
    const shortcuts = new KeyboardShortcuts();
    
    // Expose for debugging
    window.keepTheStyle = {
        store: window.store,
        sidebar,
        canvas,
        properties,
        codePanel,
        toolbar,
        shortcuts
    };
    
    console.log('🚀 KeepTheStyle initialized successfully!');
    
    // Add initial demo elements if canvas is empty
    const state = window.store.getState();
    if (state.elements.length === 0) {
        // Add a demo heading
        window.store.addElement({
            tag: 'h1',
            position: { x: 100, y: 100 },
            size: { width: 400, height: 80 },
            styles: {
                fontSize: '32px',
                fontWeight: '700',
                color: '#000000',
                margin: '0'
            },
            content: 'Welcome to KeepTheStyle'
        });
        
        // Add a demo paragraph
        window.store.addElement({
            tag: 'p',
            position: { x: 100, y: 200 },
            size: { width: 500, height: 60 },
            styles: {
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#555555',
                margin: '0'
            },
            content: 'Start building your design by dragging elements from the left sidebar or double-clicking to add them.'
        });
        
        // Add a demo button
        window.store.addElement({
            tag: 'button',
            position: { x: 100, y: 280 },
            size: { width: 150, height: 48 },
            styles: {
                backgroundColor: '#4D6BFF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '0 20px'
            },
            content: 'Get Started'
        });
        
        window.store.saveHistory();
    }
});
