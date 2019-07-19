import Panel from "../../panel/panel";

export default class OrbitPanel {
    // Launches a panel where the user can view a list of the orbits

    constructor() {
        let panel = new Panel({name: 'Orbit Panel'});

        document.body.appendChild(panel.DOM);
    }
}