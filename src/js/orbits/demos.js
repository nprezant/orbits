import * as THREE from 'three';
import { ThreeOrbit } from "../../three-orbit";
import { makeEllipticalElementsR, makeCircularElementsR } from "../../orbit";
import { lambertOrbitElements } from "../../lambert";

// Collection of functions that makes orbit demos

export default class OrbitDemos {

    constructor(orbitController) {
        this.orbitController = orbitController;
    }

    addMoonOrbit() {
        this.orbitController.addExistingOrbit(new ThreeOrbit({elements: makeEllipticalElementsR(363104, 405696), name: 'MOON'}))
    }


    addCircularOrbits() {
        let smallCircularOrbit = new ThreeOrbit({elements: makeCircularElementsR(80000), name: 'Circular Orbit 1' })
        let largeCircularOrbit = new ThreeOrbit({elements: makeCircularElementsR(200000), name: 'Circular Orbit 2' })
        this.orbitController.addExistingOrbit(smallCircularOrbit);
        this.orbitController.addExistingOrbit(largeCircularOrbit);
    }

    addEllipticalOrbits() {
        let smallEllipticalOrbit = new ThreeOrbit({elements: makeEllipticalElementsR(80000, 120000), name: 'Elliptical Orbit 1' })
        let largeEllipticalOrbit = new ThreeOrbit({elements: makeEllipticalElementsR(100000, 200000), name: 'Elliptical Orbit 1' })
        this.orbitController.addExistingOrbit(smallEllipticalOrbit);
        this.orbitController.addExistingOrbit(largeEllipticalOrbit);
    }

    addDemoOrbits() {

        let rvec = new THREE.Vector3(2615, 15881, 3980);
        let vvec1 = new THREE.Vector3(-2.767, -0.7905, 4.98);
        let vvec2 = new THREE.Vector3(-2.767, -1.7905, 3.98);
        let vvec3 = new THREE.Vector3(-1.767, -1.7905, 4.98);
        let vvec4 = new THREE.Vector3(-3.000, -0.9005, 4.98);
        
        var orbit3 = new ThreeOrbit({pv: [rvec, vvec1], name: 'Frank', paused: false});
        this.orbitController.orbitManager.addOrbit(orbit3);
        
        var orbit3 = new ThreeOrbit({pv: [rvec, vvec2], name: 'My boy Dedede', paused: false});
        this.orbitController.orbitManager.addOrbit(orbit3);

        var orbit3 = new ThreeOrbit({pv: [rvec, vvec3], name: 'Helen', paused: false});
        this.orbitController.orbitManager.addOrbit(orbit3);

        var orbit3 = new ThreeOrbit({pv: [rvec, vvec4], name: 'Mountain', paused: false});
        this.orbitController.orbitManager.addOrbit(orbit3);

    }

    addChaseManeuver() {

        let satellite1Elements = makeEllipticalElementsR(8100, 18900);
        satellite1Elements.theta = 45 * Math.PI / 180;

        let satellite2Elements = satellite1Elements.clone();
        satellite2Elements.theta = 150 * Math.PI / 180;

        let satellite1 = new ThreeOrbit({elements: satellite1Elements, name: 'Satellite 1' });
        let satellite2 = new ThreeOrbit({elements: satellite2Elements, name: 'Satellite 2' });

        let satellite2Time2Orbit = satellite2.orbit.clone();
        satellite2Time2Orbit.timeSincePerigee = satellite2Time2Orbit.timeSincePerigee + 1*60*60; // 1 hour later
        let satellite2Time2 = new ThreeOrbit({elements: satellite2Time2Orbit.elements, name: 'Satellite 2' });

        let chase = new ThreeOrbit({ elements: lambertOrbitElements(satellite1.orbit.rvec, satellite2Time2.orbit.rvec, 60*60), name: 'Chase Orbit' });

        this.orbitController.orbitManager.addOrbit(satellite1);
        this.orbitController.orbitManager.addOrbit(satellite2);
        this.orbitController.orbitManager.addOrbit(satellite2Time2);
        this.orbitController.orbitManager.addOrbit(chase);

    }

    addNotesLambert() {
        let chase = new ThreeOrbit({ elements: lambertOrbitElements(new THREE.Vector3(-3600, 3600, 5100), new THREE.Vector3(-5500, -6240, -520), 20*60) });
        this.orbitController.orbitManager.addOrbit(chase);
    }
}