
import * as THREE from 'three';
import TrackballControls from './js/controls/TrackballControls';

import ContextMenu from './js/context-menu/context-menu';

import InspireTree from 'inspire-tree';
import InspireTreeDOM from 'inspire-tree-dom';
import 'inspire-tree-dom/dist/inspire-tree-dark.css';

import {Orbit, OrbitManager} from './three-orbit';
import PanelManager from './js/panel-manager/PanelManager';

import earthImg from './textures/land_ocean_ice_cloud_2048.jpg';
import Project1Worker from './project1.worker';


var orbits;
var camera, scene, renderer, controls;
var mainbody;
var container;
var tree;
var panelmanager;
var myWorker;

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
        { name: 'Run Task 1', fn: () => {

            if (typeof(Worker) !== 'undefined') {
                // web worker support!

                let worker = new Project1Worker();
                worker.addEventListener('message', function(event) {

                    console.log('Back in main script: worker said: ', event.data);

                    switch (event.data.cmd) {
                        case 'project1task1':
                            let plotEl = document.getElementById('plot-panel');
                            Plotly.newPlot(plotEl, event.data.plot_data, event.data.plot_layout);
                    }
                }, false);

                worker.postMessage({cmd: 'project1task1'});
                // worker.terminate();

            } else {
                alert('Sorry! No Web Worker support...')
            }

        }}
      ]);
    
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



init();
animate();