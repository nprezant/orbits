import * as THREE from 'three';
import TrackballControls from '../controls/TrackballControls';

import InspireTree from 'inspire-tree';
import InspireTreeDOM from 'inspire-tree-dom';
import 'inspire-tree-dom/dist/inspire-tree-dark.css';

import {ThreeOrbit, OrbitManager} from '../../three-orbit';
import PanelManager from '../panel-manager/PanelManager';

import earthImg from '../../textures/land_ocean_ice_cloud_2048.jpg';
import { OrbitController } from '../../OrbitController';

var system;

export default class OrbitalSystem {
    // Manages entire orbital system
    // includes main central body and orbital bodies

    constructor() {
        
        this.mainbody;
        this.orbitManager;
        this.camera;
        this.scene;
        this.renderer;
        this.controls;
        this.mainbody;
        this.container;
        this.tree;
        this.orbitController;

        this.container = document.createElement( 'div' );
        document.body.appendChild( this.container );

        // scene
        this.scene = new THREE.Scene();

        // camera
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1500000 );
        this.camera.position.x = 25000;
        this.camera.position.z = 15000;
        
        // lights
        let ambientLight = new THREE.AmbientLight( 0xffffff );
        this.scene.add(ambientLight);

        // earth material
        this.loader = new THREE.TextureLoader();
        this.texture = this.loader.load( earthImg );
        this.material = new THREE.MeshBasicMaterial( { 
            map: this.texture 
        } );

        // earth geometry
        this.geometry = new THREE.SphereBufferGeometry( 6378, 20, 20 );

        // earth mesh
        this.mainbody = new THREE.Mesh( this.geometry, this.material );
        this.mainbody.rotation.x = Math.PI/2;
        this.mainbody.rotation.y = 0;
        this.mainbody.rotation.z = 0;
        this.scene.add( this.mainbody );

        // renderer
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.container.appendChild( this.renderer.domElement );

        // controls
        this.controls = new TrackballControls( this.camera, this.renderer.domElement );
        this.controls.minDistance = 7000;
        this.controls.maxDistance = 2000000;
        
        // make model tree
        this.tree = createTree();

        // main orbit node folder
        let orbitNode = this.tree.addNode({ text: 'Orbits' });

        // init orbits
        this.orbitManager = new OrbitManager(this.camera, this.renderer, orbitNode);
        this.scene.add(this.orbitManager);

        // CONTROLLER
        let panelManager = new PanelManager(
            'panel-holder',
            {
                prop_viewer: 'Property Viewer',
                prop_editor: 'Property Editor',
                plotter: 'Plotter',
            }
        );
        this.orbitController = new OrbitController(this.orbitManager, panelManager);

        // event listeners
        window.addEventListener( 'resize', onWindowResize, false );

        system = this;
        
    }

    update() {
        this.mainbody.rotation.y += 0.0005;

        this.orbitManager.update();
    
        // necessary for trackball controls
        this.controls.update();
    
        this.renderer.render( this.scene, this.camera );
    }
}

function createTree() {

    let tree = new InspireTree({});

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
        system.orbitController.viewProperties(node.object);
    };
}


function onNodeDoubleClick(event, node) {
    if (node.object instanceof ThreeOrbit) {
        system.orbitController.editProperties(node.object);
    }
}


function onWindowResize() {
    system.camera.aspect = window.innerWidth / window.innerHeight;
    system.camera.updateProjectionMatrix();
    system.renderer.setSize( window.innerWidth, window.innerHeight );
}