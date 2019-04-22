
import * as THREE from 'three';
import TrackballControls from './js/controls/TrackballControls';

import ContextMenu from './js/context-menu/context-menu';

import InspireTree from 'inspire-tree';
import InspireTreeDOM from 'inspire-tree-dom';
import 'inspire-tree-dom/dist/inspire-tree-dark.css';

import {ThreeOrbit, OrbitManager} from './three-orbit';
import PanelManager from './js/panel-manager/PanelManager';

import earthImg from './textures/land_ocean_ice_cloud_2048.jpg';
import Project1Worker from './project1.worker';
import { OrbitController } from './OrbitController';
import { makeCircularElementsR, makeEllipticalElementsR, makeHohmannTransfer, hohmannTransferDeltaV } from './orbit';
import { arange } from './js/helpers/arrays';


var orbitManager;
var camera, scene, renderer, controls;
var mainbody;
var container;
var tree;
// var panelManager;
var orbitController

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

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
    controls.maxDistance = 2000000;
    
    // make model tree
    tree = createTree();

    // main orbit node folder
    let orbitNode = tree.addNode({ text: 'Orbits' });

    // init orbits
    orbitManager = new OrbitManager(camera, renderer, orbitNode);
    scene.add(orbitManager);

    // CONTROLLER
    let panelManager = new PanelManager(
        'panel-holder',
        {
            prop_viewer: 'Property Viewer',
            prop_editor: 'Property Editor'
        }
    );
    orbitController = new OrbitController(orbitManager, panelManager);

    // event listeners
    window.addEventListener( 'resize', onWindowResize, false );

    // context menu
    var menu = new ContextMenu('canvas', [
        { name: 'Pause Time', fn: () => { orbitManager.pauseAll() }},
        { name: 'Resume Time', fn: () => { orbitManager.resumeAll() }},
        { name: 'New Orbit', fn: () => {orbitController.newOrbit() }},
        { name: 'Make Demo Orbits', fn: () => {addDemoOrbits() }},
        { name: 'Run Task 1', fn: () => {runTask1() }},
        { name: 'Make Circular Orbits', fn: () => {addCircularOrbits() }},
        { name: 'Make Elliptical Orbits', fn: () => {addEllipticalOrbits() }},
        { name: 'TEST', fn: () => {project1Task1() }}
      ]);
    
}

function runTask1() {
    if (typeof(Worker) !== 'undefined') {
        // web worker support!

        let worker = new Project1Worker();
        worker.addEventListener('message', function(event) {

            console.log('Back in main script: worker said: ', event.data);

            if (event.data.cmd == 'project1task1plot1') {
                let plotEl = document.getElementById('plot-panel');
                Plotly.newPlot(plotEl, event.data.plot_data, event.data.plot_layout);
                // orbitController.panelManager.setDatGUI('prop_viewer', plotEl);
            }

        }, false);

        worker.postMessage({cmd: 'project1task1plot1'});
        // worker.terminate();

    } else {
        alert('Sorry! No Web Worker support...')
    }

}

function addCircularOrbits() {
    let smallCircularOrbit = new ThreeOrbit({elements: makeCircularElementsR(80000), name: 'Circular Orbit 1' })
    let largeCircularOrbit = new ThreeOrbit({elements: makeCircularElementsR(200000), name: 'Circular Orbit 2' })
    orbitController.addExistingOrbit(smallCircularOrbit);
    orbitController.addExistingOrbit(largeCircularOrbit);
}

function addEllipticalOrbits() {
    let smallEllipticalOrbit = new ThreeOrbit({elements: makeEllipticalElementsR(80000, 120000), name: 'Elliptical Orbit 1' })
    let largeEllipticalOrbit = new ThreeOrbit({elements: makeEllipticalElementsR(100000, 200000), name: 'Elliptical Orbit 1' })
    orbitController.addExistingOrbit(smallEllipticalOrbit);
    orbitController.addExistingOrbit(largeEllipticalOrbit);
}

function addDemoOrbits() {

    let rvec = new THREE.Vector3(2615, 15881, 3980);
    let vvec1 = new THREE.Vector3(-2.767, -0.7905, 4.98);
    let vvec2 = new THREE.Vector3(-2.767, -1.7905, 3.98);
    let vvec3 = new THREE.Vector3(-1.767, -1.7905, 4.98);
    let vvec4 = new THREE.Vector3(-3.000, -0.9005, 4.98);
    
    var orbit3 = new ThreeOrbit({pv: [rvec, vvec1], name: 'Frank', paused: false});
    orbitManager.addOrbit(orbit3);
    
    var orbit3 = new ThreeOrbit({pv: [rvec, vvec2], name: 'My boy Dedede', paused: false});
    orbitManager.addOrbit(orbit3);

    var orbit3 = new ThreeOrbit({pv: [rvec, vvec3], name: 'Helen', paused: false});
    orbitManager.addOrbit(orbit3);

    var orbit3 = new ThreeOrbit({pv: [rvec, vvec4], name: 'Mountain', paused: false});
    orbitManager.addOrbit(orbit3);

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
    tree.on('node.selected', onNodeSelect);

    return tree;
}

function onNodeSelect(node) {
    if (node.object instanceof ThreeOrbit) {
        node.object.parent.selectOrbit(node.object);
        orbitController.viewProperties(node.object);
    };
}


function onNodeDoubleClick(event, node) {
    if (node.object instanceof ThreeOrbit) {
        orbitController.editProperties(node.object);
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
    orbitManager.update();    
}

function project1Task1() {

    let rA = 40000;
    let rAprime = rA * 5;
    let xrange = arange(5.5, 10, 5); // rBrARange
    let yrange = arange(1.5, 10, 8); // rBprimeRARange

    xrange = [5.5];
    yrange = [1.5];

    let count = 0;

    for (const rBprimeRA of yrange) {
        
        let constYColumn = [];

        for (const rBrA of xrange) {

            let r0degA = rA;
            let r180degA = rAprime;

            let r0degB = rBprimeRA * rA;
            let r180degB = rBrA * rA;

            let startOrbit = new ThreeOrbit({elements:makeEllipticalElementsR(r0degA, r180degA), name: 'Start Orbit ' + count});
            let endOrbit = new ThreeOrbit({elements:makeEllipticalElementsR(r0degB, r180degB), name: 'End Orbit ' + count});

            let startTheta = 0;
            let endTheta = startTheta + Math.PI; // 180 degrees
            let transferOrbit1 = new ThreeOrbit({elements:makeHohmannTransfer(startOrbit.orbit, endOrbit.orbit, startTheta), name: 'Transfer Orbit1 ' + count});
            let transferOrbit2 = new ThreeOrbit({elements:makeHohmannTransfer(startOrbit.orbit, endOrbit.orbit, endTheta), name: 'Transfer Orbit2 ' + count});

            let deltaV1 = (
                Math.abs( endOrbit.orbit.velocityAtTheta(endTheta) - transferOrbit1.orbit.velocityAtTheta(endTheta) )
                + Math.abs( transferOrbit1.orbit.velocityAtTheta(startTheta) - startOrbit.orbit.velocityAtTheta(startTheta) )
            );
            
            let deltaV2 = (
                Math.abs( endOrbit.orbit.velocityAtTheta(startTheta) - transferOrbit2.orbit.velocityAtTheta(startTheta) )
                + Math.abs( transferOrbit2.orbit.velocityAtTheta(endTheta) - startOrbit.orbit.velocityAtTheta(endTheta) )
            );

            // let dv = hohmannTransferDeltaV(startOrbit, endOrbit, 0);
            // let dvPrime = hohmannTransferDeltaV(startOrbit, endOrbit, Math.PI);
            let dvRatio = deltaV2/deltaV1;

            orbitManager.addOrbit(startOrbit);
            orbitManager.addOrbit(endOrbit);
            orbitManager.addOrbit(transferOrbit1);
            orbitManager.addOrbit(transferOrbit2);

            count++;

        }

    }
}

init();
animate();