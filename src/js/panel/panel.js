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

        this.DOM.addEventListener('pointerdown', (e)=>{onPointerDown(e, this.DOM)}, false);

    }

    hide() {
        this.DOM.style.display = 'none';
    }

    show() {
        this.DOM.style.display = 'flex';
    }

}

function onPointerDown(e, parentDOM) {

    // get a reference to the target we're dragging
    let target = parentDOM;

    // get pointer coordinates relative to target
    let shiftX = e.clientX - target.getBoundingClientRect().left;
    let shiftY = e.clientY - target.getBoundingClientRect().top;

    // center the target at pageX, pageY coordinates
    function moveAt(target, pageX, pageY) {
        target.style.left = pageX - shiftX + 'px';
        target.style.top = pageY - shiftY + 'px';
    }
    
    function onPointerMove(e) {
        moveAt(target, e.pageX, e.pageY);
    }
    
    // prepare for moving
    target.style.position = 'absolute';
    target.style.zIndex = 1000;

    // move target into the body to make it positioned relative to body
    document.body.append(target);

    // move the target under the cursor
    moveAt(target, e.pageX, e.pageY);

    // listen to move the target when the pointer moves
    document.addEventListener('pointermove', onPointerMove, false);

    // remove the added handlers when target is dropped
    target.onpointerup = function() {
        document.removeEventListener('pointermove', onPointerMove);
        this.onpointerup = null;
    }

    // prevent the default drag handling
    target.ondragstart = function() {return false};
}