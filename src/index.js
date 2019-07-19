
import OrbitalSystem from './js/orbits/system';
import UIControls from './js/orbits/UIControls';

var system;

function init() {

    // make the orbital system
    system = new OrbitalSystem();

    // make the user interface
    let controls = new UIControls(system);
    
}

function animate() {

    requestAnimationFrame( animate );

    // update orbital system
    system.update();

}

init();
animate();