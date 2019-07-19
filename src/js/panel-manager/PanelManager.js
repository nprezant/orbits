import './PanelManager.css';
import Panel from '../panel/panel';

class PanelManager {
    // manages panels within a window
    // has an allowed list of panel types.
    // only one of each panel is allowed.
    
    constructor(containerClass, paneldict) {

        this.container = document.getElementsByClassName(containerClass)[0];
        this.panels = paneldict;

        for (const [codename, prettyname] of Object.entries(paneldict)) {

            // make a panel for each dictionary entry
            let panel = new Panel({name: prettyname});
            panel.DOM.classList.add(codename);

            this.container.appendChild(panel.DOM);
            this.panels[codename] = panel;

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
            this.panels[codename].DOM.appendChild(datDOM);
            this.showpanel(codename);
        }
    }

    removeDatGUI(codename) {
        // removes the dat gui from the CODENAME panel
        this.hidepanel(codename);
        this.removeClassedNodes(this.panels[codename].DOM, 'panel-dat');
    }

    removeClassedNodes(parent, cls) {
        // removes any DOM elements with class CLS under PARENT dom element
        for (let el of parent.getElementsByClassName(cls)) {
            el.remove();
        };
    }

    showpanel(codename) {
        // shows the panel with this CODENAME
        this.panels[codename].show();
    }

    hidepanel(codename) {
        // hides the panel with this CODENAME
        this.panels[codename].hide();
    }

    destroyPanel(codename) {
        // destroys the panel in the NAME position
        // removes DOM element from window
        // THIS CANNOT BE UNDONE
        this.panels[codename].remove();
    }
}



export default PanelManager;