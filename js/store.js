/**
 * KeepTheStyle - Application State Management
 * Central store for all application data
 */

class Store {
    constructor() {
        this.state = {
            elements: [],
            selectedElements: [],
            clipboard: null,
            history: [],
            historyIndex: -1,
            maxHistory: 50,
            zoom: 1,
            gridVisible: true,
            guidelinesVisible: true,
            rulersVisible: true,
            snapEnabled: true,
            pageSize: { width: 1920, height: 1080 },
            darkMode: false,
            activeTab: 'html',
            projectName: 'Untitled Project',
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            selectedTool: 'select'
        };

        this.listeners = [];
        this.init();
    }

    init() {
        // Load from localStorage if available
        this.loadFromStorage();
        
        // Auto-save every 5 seconds
        setInterval(() => this.saveToStorage(), 5000);
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Notify all listeners of state change
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Get current state
    getState() {
        return this.state;
    }

    // Update state
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        // Save to history if significant change
        if (this.shouldSaveHistory(oldState, this.state)) {
            this.saveHistory();
        }
        
        this.notify();
    }

    // Check if state change should be saved to history
    shouldSaveHistory(oldState, newState) {
        // Compare elements array for changes
        if (oldState.elements !== newState.elements) {
            return true;
        }
        // Add more conditions as needed
        return false;
    }

    // History management
    saveHistory() {
        // Remove any future history if we're not at the end
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
        }
        
        // Add current state to history
        const snapshot = JSON.stringify(this.state.elements);
        this.state.history.push(snapshot);
        this.state.historyIndex = this.state.history.length - 1;
        
        // Limit history size
        if (this.state.history.length > this.state.maxHistory) {
            this.state.history.shift();
            this.state.historyIndex--;
        }
    }

    undo() {
        if (this.state.historyIndex > 0) {
            this.state.historyIndex--;
            const snapshot = this.state.history[this.state.historyIndex];
            this.state.elements = JSON.parse(snapshot);
            this.notify();
            return true;
        }
        return false;
    }

    redo() {
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.historyIndex++;
            const snapshot = this.state.history[this.state.historyIndex];
            this.state.elements = JSON.parse(snapshot);
            this.notify();
            return true;
        }
        return false;
    }

    // Element operations
    addElement(element) {
        this.state.elements.push({
            ...element,
            id: this.generateId(),
            position: { x: 100, y: 100 },
            size: { width: 200, height: 150 },
            styles: {},
            children: []
        });
        this.notify();
        return element;
    }

    deleteElement(id) {
        this.state.elements = this.state.elements.filter(el => el.id !== id);
        this.state.selectedElements = this.state.selectedElements.filter(sid => sid !== id);
        this.notify();
    }

    updateElement(id, updates) {
        const element = this.state.elements.find(el => el.id === id);
        if (element) {
            Object.assign(element, updates);
            this.notify();
        }
    }

    selectElement(id) {
        if (!this.state.selectedElements.includes(id)) {
            this.state.selectedElements.push(id);
            this.notify();
        }
    }

    deselectElement(id) {
        this.state.selectedElements = this.state.selectedElements.filter(sid => sid !== id);
        this.notify();
    }

    clearSelection() {
        this.state.selectedElements = [];
        this.notify();
    }

    duplicateElement(id) {
        const element = this.state.elements.find(el => el.id === id);
        if (element) {
            const newElement = {
                ...element,
                id: this.generateId(),
                position: {
                    x: element.position.x + 20,
                    y: element.position.y + 20
                }
            };
            this.state.elements.push(newElement);
            this.state.selectedElements = [newElement.id];
            this.notify();
        }
    }

    generateId() {
        return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Local Storage
    saveToStorage() {
        try {
            const data = {
                elements: this.state.elements,
                projectName: this.state.projectName,
                pageSize: this.state.pageSize
            };
            localStorage.setItem('keepthestyle_project', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('keepthestyle_project');
            if (data) {
                const parsed = JSON.parse(data);
                this.state.elements = parsed.elements || [];
                this.state.projectName = parsed.projectName || 'Untitled Project';
                this.state.pageSize = parsed.pageSize || { width: 1920, height: 1080 };
                this.saveHistory();
            }
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
    }

    // Export/Import
    exportProject() {
        return {
            elements: this.state.elements,
            projectName: this.state.projectName,
            pageSize: this.state.pageSize,
            version: '1.0.0'
        };
    }

    importProject(data) {
        try {
            this.state.elements = data.elements || [];
            this.state.projectName = data.projectName || 'Imported Project';
            this.state.pageSize = data.pageSize || { width: 1920, height: 1080 };
            this.saveHistory();
            this.notify();
            return true;
        } catch (e) {
            console.error('Failed to import project:', e);
            return false;
        }
    }
}

// Create singleton instance
const store = new Store();
