
import * as THREE from 'three';
import TrackballControls from './js/controls/TrackballControls';

import Toolbar, { ToolbarItem } from './js/toolbar/toolbar';
import addOrbitIcon from './icons/toolbar/add_orbit.png';
import pauseTimeIcon from './icons/toolbar/pause_time.png';
import resumeTimeIcon from './icons/toolbar/resume_time.png';
import addManyOrbitsIcon from './icons/toolbar/add_many_orbits.png';

import InspireTree from 'inspire-tree';
import InspireTreeDOM from 'inspire-tree-dom';
import 'inspire-tree-dom/dist/inspire-tree-dark.css';

import {ThreeOrbit, OrbitManager} from './three-orbit';
import PanelManager from './js/panel-manager/PanelManager';

import earthImg from './textures/land_ocean_ice_cloud_2048.jpg';
import { OrbitController } from './OrbitController';
import SearchBar, { SearchItem } from './js/search-bar/search-bar';

import Project1Runner from './js/mae472-project/project1.runner';
import OrbitDemos from './js/orbits/demos';

var orbitManager;
var camera, scene, renderer, controls;
var mainbody;
var container;
var tree;
var orbitController;

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
            prop_editor: 'Property Editor',
            plotter: 'Plotter',
        }
    );
    orbitController = new OrbitController(orbitManager, panelManager);

    // event listeners
    window.addEventListener( 'resize', onWindowResize, false );

    // MAE project 1
    let project1Runner = new Project1Runner(orbitController);

    // Orbital demos
    let orbitDemos = new OrbitDemos(orbitController);

    // toolbar
    let toolbar = new Toolbar('toolbar-left', [
        new ToolbarItem(resumeTimeIcon, ()=>{orbitManager.resumeAll()}),
        new ToolbarItem(pauseTimeIcon, ()=>{orbitManager.pauseAll()}),
        new ToolbarItem(addOrbitIcon, ()=>{orbitController.newOrbit()}),
        new ToolbarItem(addManyOrbitsIcon, ()=>{orbitDemos.addCircularOrbits()}),
    ]);

    // searchbar
    let searchBar = new SearchBar([
        new SearchItem('Pause Time', ()=>{orbitManager.pauseAll()}),
        new SearchItem('Resume Time', ()=>{orbitManager.resumeAll()}),
        new SearchItem('New Orbit', ()=>{orbitController.newOrbit()}),
        new SearchItem('Small Demo Orbits', ()=>{orbitDemos.addDemoOrbits()}),
        new SearchItem('Circular Demo Orbits', ()=>{orbitDemos.addCircularOrbits()}),
        new SearchItem('Elliptical Demo Orbits', ()=>{orbitDemos.addEllipticalOrbits()}),
        new SearchItem('Compare Hohman Transfers', ()=>{project1Task1()}),
        new SearchItem('Moon Orbit', ()=>{orbitDemos.addMoonOrbit()}),
        new SearchItem('Demo Chase Maneuver', ()=>{orbitDemos.addChaseManeuver()}),
        new SearchItem('Demo Chase Maneuver (Notes)', ()=>{orbitDemos.addNotesLambert()}),
        new SearchItem('Task 1 Plot 1', ()=>{project1Runner.runTask1Plot1()}),
        new SearchItem('Task 1 Plot 2', ()=>{project1Runner.runTask1Plot2()}),
        new SearchItem('Task 1 Plot 3', ()=>{project1Runner.runTask1Plot3()}),
        new SearchItem('Task 2 Plot 1', ()=>{project1Runner.runTask2Plot1()}),
        new SearchItem('Task 2 Plot 2', ()=>{project1Runner.runTask2Plot2()}),
        new SearchItem('Task 3 Plot', ()=>{project1Runner.runTask3Plot()}),
        new SearchItem('Task 3 Table', ()=>{project1Runner.runTask3Table()}),
        new SearchItem('Hello', ()=>{alert('Hello')}),
    ]);
    
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

init();
animate();