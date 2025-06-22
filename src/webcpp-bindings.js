// This file would typically be a wrapper around a Node.js C++ Addon
// (e.g., built with N-API or node-addon-api) that directly interfaces with WebCpp.
// For demonstration, we'll simulate the C++ calls with console logs.

/**
 * Represents a native WebCpp Window object.
 */
class WebCppWindow {
    constructor(title) {
        console.log(`[WebCpp Native] Initializing Window: "${title}"`);
        this.title = title;
        this.children = [];
    }

    add(component) {
        console.log(`[WebCpp Native] Adding ${component.toString()} to Window: "${this.title}"`);
        this.children.push(component);
        // In a real scenario, this would call WebCpp's native add method
    }

    toString() {
        return `WebCppWindow(${this.title})`;
    }
}

/**
 * Represents a native WebCpp Button object.
 */
class WebCppButton {
    constructor(label) {
        console.log(`[WebCpp Native] Initializing Button: "${label}"`);
        this.label = label;
    }
    toString() { return `WebCppButton(${this.label})`; }
}

/**
 * Represents a native WebCpp Label object.
 */
class WebCppLabel {
    constructor(text) {
        console.log(`[WebCpp Native] Initializing Label: "${text}"`);
        this.text = text;
    }
    toString() { return `WebCppLabel(${this.text})`; }
}

/**
 * Represents a native WebCpp IconGrid for app icons.
 */
class WebCppIconGrid {
    constructor() {
        console.log(`[WebCpp Native] Initializing IconGrid`);
        this.children = [];
    }
    add(component) {
        console.log(`[WebCpp Native] Adding ${component.toString()} to IconGrid`);
        this.children.push(component);
    }
    toString() { return `WebCppIconGrid`; }
}

/**
 * Represents a native WebCpp Dock for persistent app icons.
 */
class WebCppDock {
    constructor() {
        console.log(`[WebCpp Native] Initializing Dock`);
        this.children = [];
    }
    add(component) {
        console.log(`[WebCpp Native] Adding ${component.toString()} to Dock`);
        this.children.push(component);
    }
    toString() { return `WebCppDock`; }
}

/**
 * Represents a single native WebCpp AppIcon.
 */
class WebCppAppIcon {
    constructor(label, iconPath) {
        console.log(`[WebCpp Native] Initializing AppIcon: "${label}" with icon "${iconPath}"`);
        this.label = label;
        this.iconPath = iconPath;
    }
    toString() { return `WebCppAppIcon(${this.label})`; }
}

// Export functions that Lambda's interpreter will call
export const WebCpp = {
    createWindow: (title) => new WebCppWindow(title),
    createButton: (label) => new WebCppButton(label),
    createLabel: (text) => new WebCppLabel(text),
    createIconGrid: () => new WebCppIconGrid(),
    createDock: () => new WebCppDock(),
    createAppIcon: (label, iconPath) => new WebCppAppIcon(label, iconPath),
};