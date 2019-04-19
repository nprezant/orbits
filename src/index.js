
import * as THREE from 'three';
import * as dat from 'dat.gui';
import TrackballControls from './js/controls/TrackballControls.js';

import ContextMenu from './js/context-menu/context-menu.js';

import InspireTree from 'inspire-tree';
import InspireTreeDOM from 'inspire-tree-dom';
import 'inspire-tree-dom/dist/inspire-tree-dark.css';

import {Orbit, OrbitManager, makeEllipticalElementsR, hohmannTransferDeltaV} from './orbit.js';
import PanelManager from './js/panel-manager/PanelManager.js';

import earthImg from './textures/land_ocean_ice_cloud_2048.jpg';
import { arange } from './js/helpers/arrays.js';


var orbits;
var camera, scene, renderer, controls;
var mainbody;
var container;
var tree;
var panelmanager;

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    panelmanager = new PanelManager(
        'panel-holder',
        {
            prop_viewer: 'Property Viewer',
            prop_editor: 'Property Editor'
        }
    );

    // scene
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1500000 );
    camera.position.x = 25000;
    camera.position.z = 15000;
    
    // lights
    var ambientLight = new THREE.AmbientLight( 0xffffff );
    scene.add(ambientLight);

    // earth material
    var loader = new THREE.TextureLoader();
    var texture = loader.load( earthImg );
    var material = new THREE.MeshBasicMaterial( { 
        map: texture 
    } );

    // earth geometry
    var geometry = new THREE.SphereBufferGeometry( 6378, 20, 20 );

    // earth mesh
    mainbody = new THREE.Mesh( geometry, material );
    mainbody.rotation.x = Math.PI/2;
    mainbody.rotation.y = 0;
    mainbody.rotation.z = 0;
    scene.add( mainbody );

    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.appendChild( renderer.domElement );

    // controls
    controls = new TrackballControls( camera, renderer.domElement );
    controls.minDistance = 7000;
    controls.maxDistance = 200000;
    
    // make model tree
    tree = createTree();

    // main orbit node folder
    let orbitNode = tree.addNode({ text: 'Orbits' });

    // init orbits
    orbits = new OrbitManager(camera, renderer, panelmanager, orbitNode);
    scene.add(orbits);
    // addDemoOrbits();

    // event listeners
    window.addEventListener( 'resize', onWindowResize, false );

    // context menu
    var menu = new ContextMenu('canvas', [
        { name: 'Pause Time', fn: () => { orbits.pauseAll() }},
        { name: 'Resume Time', fn: () => { orbits.resumeAll() }},
        { name: 'New Orbit', fn: () => {orbits.newOrbitGUI() }},
        { name: 'Make Demo Orbits', fn: () => {addDemoOrbits() }},
        { name: 'Run Task 1', fn: () => {project1Task1() }},
      ]);

    // menu.on('itemselected', () => { console.log('item selected') });
    
}

function addDemoOrbits() {

    let rvec = new THREE.Vector3(2615, 15881, 3980);
    let vvec1 = new THREE.Vector3(-2.767, -0.7905, 4.98);
    let vvec2 = new THREE.Vector3(-2.767, -1.7905, 3.98);
    let vvec3 = new THREE.Vector3(-1.767, -1.7905, 4.98);
    let vvec4 = new THREE.Vector3(-3.000, -0.9005, 4.98);
    
    var orbit = new Orbit();
    orbit.name = 'Frank';
    orbit.init_from_pos_vel(rvec, vvec1);
    orbits.addOrbit(orbit);
    
    var orbit = new Orbit();
    orbit.name = 'My boy Dedede';
    orbit.init_from_pos_vel(rvec, vvec2);
    orbits.addOrbit(orbit);

    var orbit = new Orbit();
    orbit.name = 'Helen';
    orbit.init_from_pos_vel(rvec, vvec3);
    orbits.addOrbit(orbit);

    var orbit = new Orbit();
    orbit.name = 'Mountain';
    orbit.init_from_pos_vel(rvec, vvec4);
    orbits.addOrbit(orbit);

    orbits.resumeAll();

}

function createTree() {

    tree = new InspireTree({});

    new InspireTreeDOM(tree, {
        target: '.tree',
        dragAndDrop: {
            enabled: true
        }
    })
    
    // double click events
    tree.on('node.dblclick', onNodeDoubleClick);

    // select events
    tree.on('node.selected', function(node) {
        if (node.object instanceof Orbit) {
            node.object.parent.selectOrbit(node.object);
        };
    });

    // updateTree();

    return tree;
}



function onNodeDoubleClick(event, node) {
    try {
        node.object.editPropertiesGUI(panelmanager);
    } catch {
        // probably doesn't have the method defined
    }
}




function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

    requestAnimationFrame( animate );

    mainbody.rotation.y += 0.0005;

    updateOrbits();
    // updateTree();

    // necessary for trackball controls
    controls.update();

    renderer.render( scene, camera );

}

function updateOrbits() {
    // update the orbit positions by one timestep
    orbits.update();    
}

function project1Task1() {

    let rA = 40000;
    let rAprime = rA * 5;
    let rBrARange = arange(5.5, 10, 0.1);
    let rBprimeRARange = arange(1.5, 10, 0.1);

    let deltaV = [];
    let deltaVprime = [];

    for (const rBrA of rBrARange) {
        for (const rBprimeRA of rBprimeRARange) {

            let rp1 = rA;
            let ra1 = rAprime;
            let rp2 = rBprimeRA * rA;
            let ra2 = rBrA * rA;

            let orbit1 = new Orbit();
            orbit1.init_from_elements2(makeEllipticalElementsR(rp1, ra1));
            
            let orbit2 = new Orbit();
            orbit2.init_from_elements2(makeEllipticalElementsR(rp2, ra2));

            deltaV.push(hohmannTransferDeltaV(orbit1, orbit2, true));
            deltaVprime.push(hohmannTransferDeltaV(orbit1, orbit2, false));
        }
    }

    let deltaVRatio = deltaVprime.map( (dVprime, i) => { return dVprime/deltaV[i] } );
    


}



init();
animate();