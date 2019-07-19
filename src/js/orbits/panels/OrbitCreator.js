import Panel from "../../panel/panel";
import * as dat from 'dat.gui';
import { editOrbitProperties } from "../../../OrbitController";
import { ThreeOrbit } from "../../../three-orbit";

export default class OrbitCreator {
    // Launches a panel where the user can view a list of the orbits

    constructor() {
        let panel = new Panel({name: 'Orbit Creator'});

        document.body.appendChild(panel.DOM);

        let gui = new dat.GUI( { autoPlace: false } ); 
        gui.width = 300;

        panel.DOM.appendChild(gui.domElement);

        let orbit3 = new ThreeOrbit({render: false});
        editOrbitProperties(gui, orbit3);
    }
}