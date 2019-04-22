
import * as THREE from 'three';
import THREEx from './js/libs/threex.domevents';

import crateImg from './textures/crate.gif';
import { DragChecker } from './js/drag-checker/DragChecker';
import { StateManager } from './js/state-manager/StateManager';

import './droppable.css';
import { Orbit, orbital_path_pv_points } from './orbit';

var orbits;

export class OrbitalState {
    // saves orbit state information at a given moment
    // includes: position/velocity, classical orbital elements
    // inits to 0 so that dat.gui can read it in

    constructor() {

        // position/velocity
        this.px = 0;
        this.py = 0;
        this.pz = 0;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;

        // classical orbital elements
        this.theta = 0;
        this.e = 0;
        this.h = 0;
        this.Omega = 0;
        this.inclination = 0;
        this.omega = 0;

        // misc
        this.timeSincePerigee = 0;

    }

    clone() {
        // returns a copy of this object

        let newState = new OrbitalState();

        // position/veloctiy
        newState.px = this.px;
        newState.py = this.py;
        newState.pz = this.pz;
        newState.vx = this.vx;
        newState.vy = this.vy;
        newState.vz = this.vz;

        // classical orbital elements
        newState.theta = this.theta;
        newState.e = this.e;
        newState.h = this.h;
        newState.Omega = this.Omega;
        newState.inclination = this.inclination;
        newState.omega = this.omega;

        // misc
        newState.timeSincePerigee = this.timeSincePerigee;

        return newState;
    }

}

export class OrbitManager extends THREE.Group {
    // The OrbitManager contains each of the orbits 
    // within it, and ensures they each have the proper events
    
    constructor(camera, renderer, treeNode) {
        // domEvents is a THREEx.DomEvents object that
        // manages the events for this scene
        super();
        this.domEvents = new THREEx.DomEvents(camera, renderer.domElement); // init scene threex.js events
        this.dragChecker = new DragChecker(renderer.domElement);
        this.treeNode = treeNode;
        this.controller = null;

        renderer.domElement.addEventListener('pointerup', () => {
            if (!this.dragChecker.justDragged) {
                this.resetStates()}
            }, false)

        orbits = this;
    }

    addOrbit(orbit3) {
        this.add(orbit3);
    }

    addAllMeshEvents(orbit3) {
        this.addBodyMeshEvents(orbit3);
        this.addPathMeshEvents(orbit3);
    }

    addBodyMeshEvents(orbit3) {
        this.domEvents.bind(orbit3.bodymesh, 'mouseover', this.onOrbitChildHighlight);
        this.domEvents.bind(orbit3.bodymesh, 'click', this.onOrbitChildSelect);
        this.domEvents.bind(orbit3.bodymesh, 'dblclick', this.onOrbitChildActivate);
    }
    
    addPathMeshEvents(orbit3) {
        this.domEvents.bind(orbit3.pathmesh, 'mouseover', this.onOrbitChildHighlight);
        this.domEvents.bind(orbit3.pathmesh, 'click', this.onOrbitChildSelect);
        this.domEvents.bind(orbit3.pathmesh, 'dblclick', this.onOrbitChildActivate);
    }

    onOrbitChildHighlight(event) {
        if (event.target.parent != undefined) { // necessary because the old tube geometry events/objects don't get totally removed
            orbits.highlightOrbit(event.target.parent);
        } else {
        }
    }
    onOrbitChildSelect(event) {
        if (event.target.parent != undefined) {
            orbits.selectOrbit(event.target.parent);
        }
    }
    onOrbitChildActivate(event) {
        if (event.target.parent != undefined) {
            orbits.activateOrbit(event.target.parent);
        }
    }

    pauseAll() {
        this.children.forEach(orbit3 => {
            orbit3.pause();
        });
    }

    resumeAll() {
        this.children.forEach(orbit3 => {
            orbit3.resume();
        });
    }

    activateOrbit(orbit) {
        // orbit.editPropertiesGUI(this.panelmanager);
    }

    selectOrbit(orbit3) {
        this.deSelectOrbits();
        orbit3.stateManager.setState('select');
        orbit3.stateManager.removeState('hover');
        // orbit.viewPropertiesGUI(this.panelmanager);
    }

    highlightOrbit(orbit3) {
        // highlights the given orbit and
        // resets the colors for the other orbits
        // only does so if the user is not currently dragging
        // also don't highlight if the orbit is currently selected

        if (orbit3.stateManager.state != 'select') {
            if (!this.dragChecker.dragging) {
                this.unhighlightOrbits();
                orbit3.stateManager.setState('hover');
            }
        }
    }

    unhighlightOrbits() {
        // set highlight = false for all orbits
        this.children.forEach(orbit3 => {
            orbit3.stateManager.removeState('hover');
        });
    }

    deSelectOrbits() {
        // set highlight = false for all orbits
        this.children.forEach(orbit3 => {
            orbit3.stateManager.removeState('select');
        });
    }

    resetStates() {
        // sets the state for each orbit to the default
        this.children.forEach(orbit3 => {
            try {
                orbit3.stateManager.setState('default');
            } catch {
                //
            }
        });
    }

    update() {
        // update all
        this.incrementOrbitTimes();
        this.updateTree();
    }

    incrementOrbitTimes() {
        // increments time for each orbit
        this.children.forEach(orbit3 => {

            if (orbit3.isRendering) {

                if (orbit3.pathMeshEventsNeedUpdate == true) {
                    this.addPathMeshEvents(orbit3);
                    orbit3.pathMeshEventsNeedUpdate = false;
                }
                if (orbit3.bodyMeshEventsNeedUpdate == true) {
                    this.addBodyMeshEvents(orbit3);
                    orbit3.bodyMeshEventsNeedUpdate = false;
                }

                orbit3.incrementTime();

            }

        });
    }

    updateTree() {
        // updates the tree with the orbit list.
        // the tree keeps track the object associated with each node
        // in the node OBJECT attribute
    
        this.children.forEach(orbit3 => {
            
            // get tree nodes corresponding to this orbit
            let matchingNodes = [];
            this.treeNode.recurseDown(node => {
                if (node.object == orbit3) {
                    matchingNodes.push(node);
                }
            })
    
            // if a tree node does not already correspond to the orbit, add it to the tree.
            // otherwise, don't add it again. just update it.
            if (matchingNodes.length == 0) {
                let newTreeNode = this.treeNode.addChild({ text: orbit3.name });
                newTreeNode.set('object', orbit3);
            } else {
                matchingNodes.forEach(node => {
                    node.set('text', orbit3.name);
                });
            }
        });
    }

}

export class ThreeOrbit extends THREE.Group {
    // The ORBIT has several objects to render, and
    // thus extends the GROUP class. Simply add the orbit
    // to the scene to render it.

    constructor({name='New Orbit', elements=undefined, pv=undefined, render=true, paused=true, deltaT=20} = {}) {
        // optionally specify THREE.Group. This object will be added to that group
        // when it is initialized
        super();
        this.name = name;

        if (elements !== undefined) {
            this.orbit = new Orbit({elements: elements});
        } else if (pv !== undefined) {
            this.orbit = new Orbit({pv: pv});
        } else {
            this.orbit = null;
        }

        this._paused = paused;
        this.deltaT = deltaT; // time step, seconds

        this.timeSincePerigee = 0;
        this.pathMeshEventsNeedUpdate = false;
        this.bodyMeshEventsNeedUpdate = false;
        
        this.loader = new THREE.TextureLoader();
        this.bodymesh = null;
        this.pathmesh = null;
        this.state = new OrbitalState();
        this.miscViewState = {
            
        }
        this.stateManager = new StateManager({
            'default': () => {this.setDefaultState(this)},
            'hover': () => {this.setHoverState(this)},
            'select': () => {this.setSelectState(this)}
        });
        this.stateOptions = {
            selectedOrbitPathColor: '#42f492',
            selectedOrbitBodyColor: '#42f492',
            hoveredOrbitPathColor: '#f00',
            hoveredOrbitBodyColor: '#f00',
            defaultOrbitPathColor: 0xf7a922,
            defaultOrbitBodyColor: 0xffffff
        }

        if (render == true) {
            this.startRendering();
        }
    }

    pause() {
        this._paused = true;
    }

    resume() {
        this._paused = false;
    }

    startRendering() {
        this.bodyMeshEventsNeedUpdate = true;
        this.pathMeshEventsNeedUpdate = true;
        this.timeSincePerigee = this.orbit.timeSincePerigee;
        this.updateAllMeshes();
        this._rendering = true;
    }

    stopRendering() {
        this._rendering = false;
    }

    get isRendering() {
        return this._rendering;
    }

    setDefaultState() {
        // set colors to default
        if (this.isRendering) {
            this.pathmesh.material.color.set(this.stateOptions.defaultOrbitPathColor);
            this.bodymesh.material.color.set(this.stateOptions.defaultOrbitBodyColor);
        }
    }

    setHoverState(self=this) {
        // set hover colors
        if (this.isRendering) {
            self.pathmesh.material.color.set(self.stateOptions.hoveredOrbitPathColor);
            self.bodymesh.material.color.set(self.stateOptions.hoveredOrbitBodyColor);
        }
    }

    setSelectState() {
        // set selected colors
        if (this.isRendering) {
            this.pathmesh.material.color.set(this.stateOptions.selectedOrbitPathColor);
            this.bodymesh.material.color.set(this.stateOptions.selectedOrbitBodyColor);
        }
    }

    updateAllMeshes() {
        this.updateOrbitBody();
        this.updateOrbitPath();
    }

    updateOrbitPath() {
        // Re-draws the orbital path (expensive)
        this.makePath()
    }

    incrementBodyRotation() {
        // rotates the orbital body
        this.bodymesh.rotation.x += 0.001;
        this.bodymesh.rotation.y += 0.005;
        this.bodymesh.rotation.z += 0.008;
    }

    updateOrbitBody() {
        // re-calculates orbit and orbit position with current orbital elements
        if (this.bodymesh == null) {
            this.makeBody()
        } else {
            var [pos, vel] = this.getPV();
            this.bodymesh.position.set(pos.x, pos.y, pos.z);
        }
    }

    getPV() {
        let [pos, vel] = this.orbit.getpv();
        this.state.px = pos.x;
        this.state.py = pos.y;
        this.state.pz = pos.z;
        this.state.vx = vel.x;
        this.state.vy = vel.y;
        this.state.vz = vel.z;
        this.state.theta = this.orbit.elements.theta;
        this.state.e = this.orbit.elements.e;
        this.state.h = this.orbit.elements.h;
        this.state.Omega = this.orbit.elements.Omega;
        this.state.inclination = this.orbit.elements.inclination;
        this.state.omega = this.orbit.elements.omega;
        return [pos, vel];
    }

    incrementTime() {
        // increments object around the orbit by one time step
        
        if (this._paused == true) {
            // no need to update
        } else {        
            this.timeSincePerigee += this.deltaT;
            this.orbit.timeSincePerigee = this.timeSincePerigee;
        }
        this.updateOrbitBody();
        this.incrementBodyRotation();
    }

    makeBody() {
        // makes the orbital body and adds it to the scene

        // try to remove the body from the scene if it's already there
        if (this.bodymesh != null) {
            this.parent.domEvents.unbind(this.bodymesh, 'mouseover', this.parent.onOrbitChildHighlight);
            this.parent.domEvents.unbind(this.bodymesh, 'click', this.parent.onOrbitChildSelect);
            this.parent.domEvents.unbind(this.bodymesh, 'dblclick', this.parent.onOrbitChildActivate);
            this.bodymesh.geometry.dispose();
            this.bodymesh.material.dispose();
            this.remove(this.bodymesh);
            delete this.bodymesh;
        }

        // body material, init to invisible
        var texture = this.loader.load( crateImg );
        var material = new THREE.MeshBasicMaterial( { 
            map: texture,
            color: this.stateOptions.defaultOrbitBodyColor
        } );

        // body geometry
        var geometry = new THREE.BoxBufferGeometry( 500, 500, 500 );

        // body mesh
        this.bodymesh = new THREE.Mesh( geometry, material );

        // position of body
        var [pos, vel] = this.getPV();
        this.bodymesh.position.set(pos.x, pos.y, pos.z);

        // make sure it renders
        this.bodyMeshEventsNeedUpdate = true;
        this.add(this.bodymesh);
    }

    makePath() {
        // makes the orbital path and adds it to the scene

        // try to remove the path from the scene if it's already there
        if (this.pathmesh != null) {
            this.parent.domEvents.unbind(this.pathmesh, 'mouseover', this.parent.onOrbitChildHighlight);
            this.parent.domEvents.unbind(this.pathmesh, 'click', this.parent.onOrbitChildSelect);
            this.parent.domEvents.unbind(this.pathmesh, 'dblclick', this.parent.onOrbitChildActivate);
            this.pathmesh.geometry.dispose();
            this.pathmesh.material.dispose();
            this.remove(this.pathmesh);
            delete this.pathmesh;
        }
        
        // get orbital path points
        var pv_points = orbital_path_pv_points(this.orbit.elements);
        var positions = pv_points.map(function(v,i) {return v[0]; });

        // orbital path spline. Can't update .points once TubeBuffer is created
        var spline = new THREE.CatmullRomCurve3( positions );
        spline.curveType = 'catmullrom';
        spline.closed = true;

        var splineGeometry = new THREE.TubeBufferGeometry( spline, 100, 10, 10, true );
        var material = new THREE.MeshLambertMaterial( {
            color: this.stateOptions.defaultOrbitPathColor, 
            wireframe: false 
        } );
        let newPathmesh = new THREE.Mesh( splineGeometry, material );
        
        // flag this as a new pathmesh so the OrbitManager can take care of its updates
        this.pathMeshEventsNeedUpdate = true;
        this.pathmesh = newPathmesh;
        this.pathmesh.geometry.attributes.position.needsUpdate = true;

        // make sure it renders
        this.pathMeshEventsNeedUpdate = true;
        this.add(this.pathmesh);
    }
}
