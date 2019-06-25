import './toolbar.less';

export default class Toolbar{
    constructor({element, sideClass, buttons}) {
        // button is a list of dictionaries, e.g. [ {fn: ()=>{}, icon: 'src/icon.png'} ]
        this.element = element;
        this.element.classList.add(sideClass);
        this.addButtons(buttons);
    }

    addButtons(buttons) {
        buttons.forEach(button => {
            this.addButton(button);
        });
    }

    addButton(button) {
        let btn = document.createElement('img');
        btn.options = button;
        btn.addEventListener('click', button.fn, false);
        btn.addEventListener('pointerover', this.onPointerOver, false);
        btn.addEventListener('pointerout', this.onPointerOut, false);
        btn.src = button.icon;
        
        this.element.appendChild(btn);
    }

    onPointerOver(event) {
        let btn = event.target;
        btn.src = btn.options.icon_hover;
    }

    onPointerOut(event) {
        let btn = event.target;
        btn.src = btn.options.icon;
    }
}