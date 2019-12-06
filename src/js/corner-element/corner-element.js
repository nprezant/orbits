import './corner-element.less';

export default class CornerElement {

    constructor(corner) {
        // corner can me 'ne', 'nw', 'se', 'sw'

        // main div
        this.DOM = document.createElement('div');
        this.DOM.classList.add('corner');
        this.DOM.classList.add('corner-' + corner);
        
        document.body.append(this.DOM);
    }
}
