// This file would typically be a wrapper around a Node.js C++ Addon
// (e.g., built with N-API or node-addon-api) that directly interfaces with WebCpp.
// For demonstration, we'll simulate the C++ calls with console logs and an HTML renderer.
let rootWindow = null; // We'll store the main window here to render it later.

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
    
    renderToHTML() {
        const childrenHTML = this.children.map(child => child.renderToHTML()).join('');
        return `<div class="phone-screen">
            <div class="status-bar">OpenAce</div>
            ${childrenHTML}
        </div>`;
    }
}

/**
 * Represents a native WebCpp Button object.
 */
class WebCppButton {
    constructor(label) {
        console.log(`[WebCpp Native] Initializing Button: "${label}"`);
        this.label = label;
        this.eventHandlers = {}; // Store event handlers
    }
    toString() { return `WebCppButton(${this.label})`; }

    setEventHandler(eventName, callback) {
        console.log(`[WebCpp Native] Registering '${eventName}' handler for Button: "${this.label}"`);
        this.eventHandlers[eventName] = callback;
    }

    renderToHTML() {
        // For preview, we just log to console. In a real WebCpp, this would trigger the Lambda callback.
        return `<button class="ui-button" onclick="console.log('Simulated click for button: ${this.label}');">${this.label}</button>`;
    }
}

/**
 * Represents a native WebCpp Label object.
 */
class WebCppLabel {
    constructor(text, classes = []) {
        console.log(`[WebCpp Native] Initializing Label: "${text}"`);
        this.text = text;
        this.classes = classes;
    }
    toString() { return `WebCppLabel(${this.text})`; }

    renderToHTML() {
        const classList = ['ui-label', ...this.classes].join(' ');
        return `<p class="${classList}">${this.text}</p>`;
    }
}

/**
 * Represents a native WebCpp BackgroundImage.
 */
class WebCppBackgroundImage {
    constructor(imagePath) {
        console.log(`[WebCpp Native] Initializing BackgroundImage with path: "${imagePath}"`);
        this.imagePath = imagePath;
    }

    toString() {
        return `WebCppBackgroundImage(${this.imagePath})`;
    }

    renderToHTML() {
        return `<div class="background-image" style="background-image: url('${this.imagePath}');"></div>`;
    }
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

    renderToHTML() {
        const childrenHTML = this.children.map(child => child.renderToHTML()).join('');
        return `<div class="icon-grid">${childrenHTML}</div>`;
    }
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

    renderToHTML() {
        const childrenHTML = this.children.map(child => child.renderToHTML()).join('');
        return `<div class="dock">${childrenHTML}</div>`;
    }
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

    renderToHTML() {
        // Use a placeholder SVG for the icon image
        const placeholderIcon = `<svg width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="20" fill="#ddd"/><text x="50" y="60" font-size="40" text-anchor="middle" fill="#555">${this.label.charAt(0)}</text></svg>`;
        return `<div class="app-icon">
            ${placeholderIcon}
            <span>${this.label}</span>
        </div>`;
    }
}

// Export functions that Lambda's interpreter will call
export const WebCpp = {
    createWindow: (title) => {
        rootWindow = new WebCppWindow(title);
        return rootWindow;
    },
    createButton: (label) => new WebCppButton(label),
        createLabel: (text, classes) => new WebCppLabel(text, classes),
    createIconGrid: () => new WebCppIconGrid(),
    createDock: () => new WebCppDock(),
    createAppIcon: (label, iconPath) => new WebCppAppIcon(label, iconPath),
    createBackgroundImage: (imagePath) => new WebCppBackgroundImage(imagePath),
};

/**
 * Resets the preview state, called before each run.
 */
export function resetPreview() {
    rootWindow = null;
}

/**
 * Generates a full HTML document to preview the UI.
 */
export function renderPreview() {
    if (!rootWindow) {
        return null;
    }

    const bodyContent = rootWindow.renderToHTML();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lambda App Preview</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .phone-screen { width: 375px; height: 667px; background-color: #1c1c1e; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 10px solid #333; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .background-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; z-index: 0; }
        .status-bar { background-color: transparent; color: white; text-align: center; padding: 5px; font-size: 14px; z-index: 1; position: relative; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
        .icon-grid { display: flex; flex-wrap: wrap; justify-content: flex-start; align-content: flex-start; padding: 20px; gap: 20px; flex-grow: 1; z-index: 1; position: relative; }
        .dock { display: flex; justify-content: space-around; align-items: center; padding: 10px; background-color: rgba(200, 200, 200, 0.5); backdrop-filter: blur(10px); border-top: 1px solid #ddd; position: absolute; bottom: 0; width: 100%; z-index: 1; }
        .app-icon { display: flex; flex-direction: column; align-items: center; width: 60px; text-align: center; }
        .app-icon svg { border-radius: 12px; }
        .app-icon span { font-size: 12px; color: #fff; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-shadow: 1px 1px 2px rgba(0,0,0,0.7); }
        .ui-button { padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; background-color: #eee; font-size: 14px; cursor: pointer; }
        .ui-label { font-size: 16px; color: #333; padding: 10px; }
        /* Weather App Specific Styles */
        .weather-location { font-size: 24px; color: white; text-align: center; margin-top: 40px; font-weight: 500; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }
        .weather-temp { font-size: 96px; color: white; text-align: center; font-weight: 200; margin-top: 0; letter-spacing: -5px; text-shadow: 1px 1px 5px rgba(0,0,0,0.5); }
        .weather-condition { font-size: 20px; color: rgba(255,255,255,0.8); text-align: center; margin-top: -10px; font-weight: 500; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }
    </style>
</head>
<body>
    ${bodyContent}
</body>
</html>
    `;
}