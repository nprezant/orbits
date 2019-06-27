import './toolbar.less';

export class ToolbarItem{
    constructor(icon, fn) {
        this.icon = icon;
        this.fn = fn;
    }
}

export default class Toolbar{
    constructor(sideClass, toolbarItems) {
        this.toolbar = document.createElement('div');
        document.body.appendChild( this.toolbar );

        this.toolbar.classList.add(sideClass);
        this.addItems(toolbarItems);
    }

    addItems(toolbarItems) {
        for (let item of toolbarItems) {
            this.addItem(item);
        };
    }

    addItem(item) {
        let btn = document.createElement('img');
        btn.item = item;
        btn.addEventListener('click', item.fn, false);
        btn.src = item.icon;
        
        this.toolbar.appendChild(btn);
    }
}