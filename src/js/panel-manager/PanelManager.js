import './PanelManager.css';

class PanelManager {
    // manages panels within a window
    // has an allowed list of panel types.
    // only one of each panel is allowed.
    
    constructor(containerClass, paneldict) {

        this.container = document.getElementsByClassName(containerClass)[0];
        this.panels = paneldict;

        for (const [codename, prettyname] of Object.entries(paneldict)) {

            // main panel div
            let panel = document.createElement('div');
            panel.classList.add('panel', codename);
            this.container.appendChild(panel);
            this.panels[codename] = panel;

            // panel header
            let header = document.createElement('div');
            header.classList.add('panel-header');
            panel.appendChild(header);

            // title of panel
            let title = document.createElement('div');
            title.classList.add('panel-title');
            title.innerText = prettyname;
            header.append(title);

            // close button
            let btn = document.createElement('button');
            btn.classList.add('x-button');
            btn.addEventListener('pointerup', () => this.hidepanel(codename), false)
            header.append(btn);

            this.hidepanel(codename);

        }
    }

    setDatGUI(codename, datDOM) {
        // adds dom ELEMENT to the CODENAME panel
        // if this panel already exists, it is replaced
        try {
            this.removeDatGUI(codename);
        } catch {
            // 
        } finally {
            datDOM.classList.add('panel-dat');
            this.removeClassedNodes(datDOM, 'close-button');
            this.panels[codename].appendChild(datDOM);
            this.showpanel(codename);
        }
    }

    removeDatGUI(codename) {
        // removes the dat gui from the CODENAME panel
        this.hidepanel(codename);
        this.removeClassedNodes(this.panels[codename], 'panel-dat');
    }

    removeClassedNodes(parent, cls) {
        // removes any DOM elements with class CLS under PARENT dom element
        for (let el of parent.getElementsByClassName(cls)) {
            el.remove();
        };
    }

    showpanel(codename) {
        // shows the panel with this CODENAME
        this.panels[codename].style.display = 'flex';
    }

    hidepanel(codename) {
        // hides the panel with this CODENAME
        this.panels[codename].style.display = 'none';
    }

    destroyPanel(codename) {
        // destroys the panel in the NAME position
        // removes DOM element from window
        // THIS CANNOT BE UNDONE
        this.panels[codename].remove();
    }
}



export default PanelManager;