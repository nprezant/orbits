import './panel.less';

export default class Panel {
    // creates a panel that can be dragged around the screen and closed

    constructor({name='Panel'}={}) {

        // main panel div
        this.DOM = document.createElement('div');
        this.DOM.classList.add('panel');

        // panel header
        let header = document.createElement('div');
        header.classList.add('panel-header');
        this.DOM.appendChild(header);

        // title of panel
        let title = document.createElement('div');
        title.classList.add('panel-title');
        title.innerText = name;
        header.append(title);

        // close button
        let btn = document.createElement('button');
        btn.classList.add('x-button');
        btn.addEventListener('pointerup', () => this.hide(), false)
        header.append(btn);

    }

    hide() {
        this.DOM.style.display = 'none';
    }

    show() {
        this.DOM.style.display = 'flex';
    }

}