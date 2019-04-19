
import * as THREE from 'three';
import * as dat from 'dat.gui';

import THREEx from './js/libs/threex.domevents.js';

import { arange } from './js/helpers/arrays.js';

import crateImg from './textures/crate.gif';
import { DragChecker } from './js/drag-checker/DragChecker.js';
import { StateManager } from './js/state-manager/StateManager.js';

import './droppable.css';

const MU = 398600 // [kg/s2], constant for earth
var orbits;

class OrbitalState {
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
    
    constructor(camera, renderer, panelmanager, treeNode) {
        // domEvents is a THREEx.DomEvents object that
        // manages the events for this scene
        super();
        this.domEvents = new THREEx.DomEvents(camera, renderer.domElement); // init scene threex.js events
        this.dragChecker = new DragChecker(renderer.domElement);
        this.panelmanager = panelmanager;
        this.treeNode = treeNode;

        renderer.domElement.addEventListener('pointerup', () => {
            if (!this.dragChecker.justDragged) {
                this.resetStates()}
            }, false)

        orbits = this;
    }

    newOrbitGUI() {
        // open GUI for user to make a new orbit

        let orbit = new Orbit(this);
        orbit.editPropertiesGUI(this.panelmanager);

    }

    addOrbit(orbit) {
        // essentially just the "add" method, but
        // with events included
        this.addBodyMeshEvents(orbit);
        this.addPathMeshEvents(orbit);
        this.add(orbit);
    }

    addBodyMeshEvents(orbit) {
        this.domEvents.bind(orbit.bodymesh, 'mouseover', this.onOrbitChildHighlight);
        this.domEvents.bind(orbit.bodymesh, 'click', this.onOrbitChildSelect);
        this.domEvents.bind(orbit.bodymesh, 'dblclick', this.onOrbitChildActivate);
    }
    
    addPathMeshEvents(orbit) {
        this.domEvents.bind(orbit.pathmesh, 'mouseover', this.onOrbitChildHighlight);
        this.domEvents.bind(orbit.pathmesh, 'click', this.onOrbitChildSelect);
        this.domEvents.bind(orbit.pathmesh, 'dblclick', this.onOrbitChildActivate);
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
        this.children.forEach(orbit => {
            orbit.pause();
        });
    }

    resumeAll() {
        this.children.forEach(orbit => {
            orbit.resume();
        });
    }

    activateOrbit(orbit) {
        orbit.editPropertiesGUI(this.panelmanager);
    }

    selectOrbit(orbit) {
        this.deSelectOrbits();
        orbit.stateManager.setState('select');
        orbit.stateManager.removeState('hover');
        orbit.viewPropertiesGUI(this.panelmanager);
    }

    highlightOrbit(orbit) {
        // highlights the given orbit and
        // resets the colors for the other orbits
        // only does so if the user is not currently dragging
        // also don't highlight if the orbit is currently selected

        if (orbit.stateManager.state != 'select') {
            if (!this.dragChecker.dragging) {
                this.unhighlightOrbits();
                orbit.stateManager.setState('hover');
            }
        }
    }

    unhighlightOrbits() {
        // set highlight = false for all orbits
        this.children.forEach(o => {
            o.stateManager.removeState('hover');
        });
    }

    deSelectOrbits() {
        // set highlight = false for all orbits
        this.children.forEach(o => {
            o.stateManager.removeState('select');
        });
    }

    resetStates() {
        // sets the state for each orbit to the default
        this.children.forEach(o => {
            o.stateManager.setState('default');
        });
    }

    update() {
        // update all
        this.incrementOrbitTimes();
        this.updateTree();
    }

    incrementOrbitTimes() {
        // increments time for each orbit
        this.children.forEach(orbit => {

            if (orbit.pathMeshNeedsUpdate == true) {
                this.addPathMeshEvents(orbit);
                orbit.pathMeshNeedsUpdate = false;
            }
            if (orbit.bodyMeshNeedsUpdate == true) {
                this.addBodyMeshEvents(orbit);
                orbit.bodyMeshNeedsUpdate = false;
            }

            orbit.incrementTime();
        });
    }

    updateTree() {
        // updates the tree with the orbit list.
        // the tree keeps track the object associated with each node
        // in the node OBJECT attribute
    
        this.children.forEach(orbit => {
            
            // get tree nodes corresponding to this orbit
            let matchingNodes = [];
            this.treeNode.recurseDown(node => {
                if (node.object == orbit) {
                    matchingNodes.push(node);
                }
            })
    
            // if a tree node does not already correspond to the orbit, add it to the tree.
            // otherwise, don't add it again. just update it.
            if (matchingNodes.length == 0) {
                let newTreeNode = this.treeNode.addChild({ text: orbit.name });
                newTreeNode.set('object', orbit);
            } else {
                matchingNodes.forEach(node => {
                    node.set('text', orbit.name);
                });
            }
        });
    }

}

export class Orbit extends THREE.Group {
    // The ORBIT has several objects to render, and
    // thus extends the GROUP class. Simply add the orbit
    // to the scene to render it.

    constructor(group=null) {
        // optionally specify THREE.Group. This object will be added to that group
        // when it is initialized
        super();
        this._group = group;
        this._initialized = false;
        this._paused = true;
        this.pathMeshNeedsUpdate = false;
        this.deltaT = 20; // time step, seconds
        this.loader = new THREE.TextureLoader();
        this.name = 'Unnamed Orbit';
        this.time_since_perigee = 0;
        this.elements = new ClassicalOrbitalElements(0,0,0,0,0,0);
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
    }

    init_from_pos_vel(pos, vel) {
        // initializes the orbit based on a position and velocity
        // POS, VEL are Vector3 types
        this.elements = pv_to_elements(pos, vel);
        this.time_since_perigee = elements_to_time(this.elements);
        this.makeMeshes();
        this.addToInternalGroup()
        this._initialized = true;
    }

    init_from_elements(theta, h, e, Omega, inclination, omega) {
        // initializes the orbit from the 6 orbital elements
        this.elements = new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega);
        this.time_since_perigee = elements_to_time(this.elements);
        this.makeMeshes();
        this.addToInternalGroup()
        this._initialized = true;
    }

    init_from_elements2(elements) {
        // initializes the orbit from the 6 orbital elements
        this.elements = elements;
        this.time_since_perigee = elements_to_time(this.elements);
        this.makeMeshes();
        this.addToInternalGroup()
        this._initialized = true;
    }

    addToInternalGroup() {
        // adds this object to the internally specified group for rendering
        if (this.group != null) {
            if (!this.group.children.includes(this)) {
                this.group.addOrbit(this);
            }
        }
    }

    get deltaT() {
        return this._deltaT;
    }

    set deltaT(val) {
        this._deltaT = val;
    }

    get group() {
        return this._group;
    }

    get semiMajorAxis() {
        return this.elements.h**2 / (MU * (1 - this.elements.e**2));
    }

    get rPerigee() {
        return this.semiMajorAxis * (1 - this.elements.e);
    }

    get rApogee() {
        return this.semiMajorAxis * (1 + this.elements.e);
    }

    get vPerigee() {
        return this.elements.h / this.rPerigee;
    }

    get vApogee() {
        return this.elements.h / this.rApogee;
    }

    get currentRadius() {
        return this.semiMajorAxis * (1 - this.elements.e**2) / (1 + this.elements.e*Math.cos(this.elements.theta));
    }

    get radialVelocity() {
        return MU/this.elements.h * this.elements.e * Math.sin(this.elements.theta);
    }

    get azimuthalVelocity() {
        return this.elements.h / this.currentRadius();
    }

    get velocity() {
        return Math.sqrt(this.radialVelocity**2 + this.azimuthalVelocity**2);
    }

    get period() {
        return 2*Math.PI / Math.sqrt(MU) * this.semiMajorAxis**(3/2);
    }

    get flightPathAngle() {
        return Math.atan(this.radialVelocity / this.azimuthalVelocity);
    }

    radiusAtTheta(theta) {
        return this.elements.h**2 / MU * 1 / (1 + this.elements.e * Math.cos(theta));
    }

    azimuthatVelocityAtTheta(theta) {
        return MU / this.elements.h * (1 + this.elements.e * Math.cos(theta));
    }

    radialVelocityAtTheta(theta) {
        return MU / this.elements.h * this.elements.e * Math.sin(theta);
    }

    velocityAtTheta(theta) {
        return Math.sqrt(this.radialVelocityAtTheta(theta)**2 + this.azimuthatVelocityAtTheta(theta)**2);
    }

    pause() {
        this._paused = true;
    }

    resume() {
        this._paused = false;
    }

    setDefaultState() {
        // set colors to default
        this.pathmesh.material.color.set(this.stateOptions.defaultOrbitPathColor);
        this.bodymesh.material.color.set(this.stateOptions.defaultOrbitBodyColor);
    }

    setHoverState(self=this) {
        // set hover colors
        self.pathmesh.material.color.set(self.stateOptions.hoveredOrbitPathColor);
        self.bodymesh.material.color.set(self.stateOptions.hoveredOrbitBodyColor);
    }

    setSelectState() {
        // set selected colors
        this.pathmesh.material.color.set(this.stateOptions.selectedOrbitPathColor);
        this.bodymesh.material.color.set(this.stateOptions.selectedOrbitBodyColor);
    }

    getpv() {
        // gets the IJK frame position, velocity vector
        // update the internal saved state to match both pv and elements
        var [pos, vel] = elements_to_pv(this.elements);
        this.state.px = pos.x;
        this.state.py = pos.y;
        this.state.pz = pos.z;
        this.state.vx = vel.x;
        this.state.vy = vel.y;
        this.state.vz = vel.z;
        this.state.theta = this.elements.theta;
        this.state.e = this.elements.e;
        this.state.h = this.elements.h;
        this.state.Omega = this.elements.Omega;
        this.state.inclination = this.elements.inclination;
        this.state.omega = this.elements.omega;
        
        return [pos, vel];
    }

    makeMeshes() {
        // makes the meshes for this orbit and adds them to itself (the group)
        this.makeBody();
        this.makePath();
    }

    registerMeshes() {
        // registers the meshes with the render

    }

    updateAllMeshes() {
        // force update all meshes. Generates meshes if not already generated.
        // ensures the orbital body is added to the internal group
        if (this._initialized) {
            this.updateOrbitBody();
            this.updateOrbitPath();
        } else {
            this.makeMeshes();
        }
        this.addToInternalGroup()
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
        var [pos, vel] = this.getpv();
        this.bodymesh.position.set(pos.x, pos.y, pos.z);
    }

    incrementTime() {
        // increments object around the orbit by one time step
        
        if (this._paused == true) {
            // no need to update
        } else {        
            this.time_since_perigee += this.deltaT;
            var new_elements = elements_at_time(this.elements, this.time_since_perigee);
            if (new_elements.orbitEquals(this.elements)) {
                // orbital path didn't change
            } else {
                // update orbital path
                this.updateOrbitPath();
            }
            this.elements = new_elements;
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
        var [pos, vel] = this.getpv();
        this.bodymesh.position.set(pos.x, pos.y, pos.z);

        // make sure it renders
        this.bodyMeshNeedsUpdate = true;
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
        var pv_points = orbital_path_pv_points(this.elements);
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
        this.pathMeshNeedsUpdate = true;
        this.pathmesh = newPathmesh;
        this.pathmesh.geometry.attributes.position.needsUpdate = true;

        // make sure it renders
        this.add(this.pathmesh);
    }

    viewPropertiesGUI(panelmanager) {

        // make gui
        var gui = new dat.GUI( { autoPlace: false } ); 
        gui.width = 300;
        panelmanager.setDatGUI('prop_viewer', gui.domElement);
        
        // name
        gui.add( this, 'name' );
    
        // position-velocity folder
        var pvFolder = gui.addFolder( 'Position/Velocity' );
        addPVToFolder(this.state, pvFolder, true) // listen
        pvFolder.open();
    
        // elements folder
        var elFolder = gui.addFolder( 'Classical Orbital Elements' );
        addELToFolder(this.state, elFolder, true) // listen
        elFolder.open();

        gui.add(this, 'time_since_perigee').listen()
    
        // object for the button parameters
        var orbit = this;
        let params = {
            Pause: function() {
                orbit.pause();
            },
            Resume: function() {
                orbit.resume();
            },
            Edit: function() {
                orbit.editPropertiesGUI(panelmanager);
            },
        };
        // orbit commands
        gui.add(params, 'Pause');
        gui.add(params, 'Resume');
        gui.add(params, 'Edit');
    }

    editPropertiesGUI( panelmanager, refOrbit=null ) {
        // allows user to edit the property definition of this orbit

        // gets the reference item from the reference item DOM
        function getRefOrbit(refItemDom) {
            let nodeIdStr = refItemDom.getAttribute('data-orbitId');
            let nodeIdInt = parseInt(nodeIdStr, 10);
            return orbits.getObjectById(nodeIdInt);
        }
        
        function generateOrbit() {
                switch (defdropdown.getValue()) {
    
                    case definitionFolders.pv:
                        orbit.elements = pv_to_elements(
                            new THREE.Vector3(
                                currentState.px, 
                                currentState.py, 
                                currentState.pz),
                            new THREE.Vector3(
                                currentState.vx, 
                                currentState.vy, 
                                currentState.vz)
                        );
                        orbit.updateAllMeshes();
                        break;
    
                    case definitionFolders.pvo:
                        refOrbit = getRefOrbit(additionalVars.refDom1);
                        orbit.elements = pv_to_elements(
                            new THREE.Vector3(
                                refOrbit.state.px + offsetState.px, 
                                refOrbit.state.py + offsetState.py,
                                refOrbit.state.pz + offsetState.pz),
                            new THREE.Vector3(
                                refOrbit.state.vx + offsetState.vx, 
                                refOrbit.state.vy + offsetState.vy, 
                                refOrbit.state.vz + offsetState.vz)
                        );
                        orbit.updateAllMeshes();
                        break;
    
                    case definitionFolders.el:
                        orbit.elements.theta = currentState.theta;
                        orbit.elements.h = currentState.h;
                        orbit.elements.e = currentState.e;
                        orbit.elements.Omega = currentState.Omega;
                        orbit.elements.inclination = currentState.inclination;
                        orbit.elements.omega = currentState.omega;
                        orbit.updateAllMeshes();
                        break;
    
                    case definitionFolders.elo:
                        refOrbit = getRefOrbit(additionalVars.refDom1);
                        orbit.elements.theta = refOrbit.state.theta + offsetState.theta,
                        orbit.elements.h = refOrbit.state.h + offsetState.h,
                        orbit.elements.e = refOrbit.state.e + offsetState.e,
                        orbit.elements.Omega = refOrbit.state.Omega + offsetState.Omega,
                        orbit.elements.inclination = refOrbit.state.inclination + offsetState.inclination,
                        orbit.elements.omega = refOrbit.state.omega + offsetState.omega
                        orbit.updateAllMeshes();
                        break;

                    case definitionFolders.circularR:
                        orbit.elements = makeCircularElementsR(additionalVars.Radius);
                        orbit.updateAllMeshes();
                        break;

                    case definitionFolders.circularV:
                        orbit.elements = makeCircularElementsV(additionalVars.AzimuthalVelocity);
                        orbit.updateAllMeshes();
                        break;   

                    case definitionFolders.ellipticalR:
                        orbit.elements = makeEllipticalElementsR(
                            additionalVars.Rp,
                            additionalVars.Ra,
                        );
                        orbit.updateAllMeshes();
                        break;

                    case definitionFolders.hohmnann:
                        orbit.elements = makeHohmannTransfer(
                            getRefOrbit(additionalVars.refDom1),
                            getRefOrbit(additionalVars.refDom2),
                            additionalVars.speedUpAtPerigee
                        );
                        orbit.updateAllMeshes();
                
                    default:
                        break;
                }
        }
    
        var openFolders = [];

        function closeFolders() {
            // ensure all folders given in the scoped OPENFOLDERS variable are not shown
            openFolders.forEach(folder => {
                try {
                    gui.removeFolder(folder)
                } catch {
                    // folder didn't exist yet
                }
            });
            openFolders = [];
        }

        function addFolderItems(defSelected) {
            // add items to folder based on the "definition" input selected

            let folder = gui.addFolder( defSelected );

            switch (defSelected) {
    
                case definitionFolders.pv:
                    addPVToFolder(currentState, folder, false) // don't listen
                    break;

                case definitionFolders.pvo:
                    additionalVars.refDom1 = addReferenceItemToFolder(folder);
                    addPVToFolder(offsetState, folder, false) // don't listen
                    break;
    
                case definitionFolders.el:
                    addELToFolder(currentState, folder, false) // don't listen
                    break;

                case definitionFolders.elo:
                    additionalVars.refDom1 = addReferenceItemToFolder(folder);
                    addELToFolder(offsetState, folder, false) // don't listen
                    break;

                case definitionFolders.circularR:
                    folder.add(additionalVars, 'Radius');
                    break;

                case definitionFolders.circularV:
                    folder.add(additionalVars, 'AzimuthalVelocity');
                    break;

                case definitionFolders.ellipticalR:
                    folder.add(additionalVars, 'Rp');
                    folder.add(additionalVars, 'Ra');
                    break;

                case definitionFolders.hohmnann:
                    additionalVars.refDom1 = addReferenceItemToFolder(folder);
                    additionalVars.refDom2 = addReferenceItemToFolder(folder);
                    folder.add(additionalVars, 'speedUpAtPerigee');
                    break;
                
                default:
                    break;
            }

            return folder;

        }

        function addReferenceItemToFolder(folder) {
            // adds a droppable Orbit reference item to the folder.

            let params = {
                Reference: '{Drop Item Here}'
            }

            let basedOnItem = folder.add( params, 'Reference' );
            basedOnItem.__input.value = '';

            let dropElement = makeElementDroppable(basedOnItem);

            return dropElement
        }

        // create GUI and add to DOM
        let gui = new dat.GUI( { autoPlace: false } );
        gui.width = 300;
        panelmanager.setDatGUI('prop_editor', gui.domElement);
    
        // note THIS orbit for all the little parameter objects
        var orbit = this;

        // temporary orbital state and for defining new orbits off of
        var currentState;
        var offsetState;
        var additionalVars = {
            AzimuthalVelocity: 0,
            Radius: 0,
            Ra: 0,
            Rp: 0,
            refDom1: null,
            refDom2: null,
            speedUpAtPerigee: true,
        }
    
        // folder names: one of these folders is allowed at a time
        let definitionFolders = {
            default: 'Choose Orbit Definition',
            pv: 'Position/Velocity',
            pvo: 'Position/Velocity - Offset', 
            el: 'Classical Orbital Elements',
            elo: 'Classical Orbital Elements - Offset',
            circularR: 'Circular Orbit (Radius)',
            circularV: 'Circular Orbit (Velocity)',
            ellipticalR: 'Ellipal Orbit (Radii)',
            hohmnann: 'Hohmann Transfer Ellipse',
        };
    
        // convert folder names to a list for the dropdown gui
        let definitionList = Object.keys(definitionFolders).map(function(key){
            return definitionFolders[key];
        });
    
        let params = {
            Name: this.name,
            Definition: definitionFolders.default,
            Generate: generateOrbit,
            Pause: function() {
                orbit.pause();
            },
            Resume: function() {
                orbit.resume();
            },
            // BasedOnOrbit: function() {
            //     // select orbit ID based on div attribute
            //     // let baseOrbit = null;
            //     // baseOrbit.stateManager.setState('select');
            // },
            // Reference: '{Drop Item Here}'
        }

         // name
         gui.add( this, 'name' );

        // definition type drop-down
        let defdropdown = gui.add( params, 'Definition', definitionList);

        // init offset state variable
        offsetState = new OrbitalState();
        
        // manage folder switching with definition drop down list
        defdropdown.onChange(function(defSelected) {
            currentState = orbit.state.clone();
            updateGUIControllers(gui);
            if (defSelected == 'Choose Orbit Definition') {
                closeFolders();
            } else {
                closeFolders(openFolders);
                let folder = addFolderItems(defSelected)
                folder.add( params, 'Generate' ); // for generating the orbit
                folder.open();
                openFolders.push(folder);
            }
        });

    }
}

function updateGUIControllers(gui) {
    // Iterate over all controllers
    for (var i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
    }
}

function addGroupChildSafely(group, child) {
    // add child only if it hasn't already been added
    if (group.children.includes(child)) {
        // child is already there
    } else {
        // child is not in the array yet; add it
        group.add(child);
    }
}

class ClassicalOrbitalElements {
    constructor(theta, h, e, Omega, inclination, omega) {
        // holds the 6 orbital elements
        // true anomoly, specific angular momentum,
        // eccentricity, right ascension of the ascending node,
        // inclination angle, and argument of perigee
        this.theta = theta;
        this.h = h;
        this.e = e;
        this.Omega = Omega;
        this.inclination = inclination;
        this.omega = omega;
    }
    clone() {
        // returns a cloned copy of this set of orbital elements
        return new ClassicalOrbitalElements(
            this.theta,
            this.h,
            this.e,
            this.Omega,
            this.inclination,
            this.omega
        );
    }
    equals(other) {
        // tests whether these orbital elements are equal to OTHER elements
        var is_equal = true;
        if (this.theta != other.theta) {
            is_equal = false;
        } else {
            is_equal = this.orbitEquals(other);
        }
        return is_equal;
    }
    orbitEquals(other) {
        // tests whether this orbit is the same as the OTHER orbit (only difference is theta)
        var is_equal = true;
        if (this.h != other.h) {
            is_equal = false;
        } else if (this.e != other.e) {
            is_equal = false;
        } else if (this.Omega != other.Omega) {
            is_equal = false;
        } else if (this.inclination != other.inclination) {
            is_equal = false;
        } else if (this.h != other.h) {
            is_equal = false;
        }
        return is_equal;
    }
}

function vec3_mag(vec3) {
    // computes magnitude of a THREE.Vector3 object
    return Math.sqrt(vec3.dot(vec3));
}

function pv_to_elements(rvec, vvec) {
    // find orbital elements from the position and velocity vectors
    // given in a geocentric equatorial frame
    //
    // RVEC and VVEC are given as Vector3 objects

    // step 1: compute distance
    var r = vec3_mag(rvec);

    // step 2: compute speed
    var v = vec3_mag(vvec);

    // step 3: compute radial velocity
    var vr = rvec.dot(vvec.clone().divideScalar(r));

    // step 4: compute specific angular momentum
    var hvec = rvec.clone().cross(vvec);

    // step 5: compute magnitude of h
    var h = vec3_mag(hvec);

    // step 6: compute inclination
    var inclination = Math.acos(hvec.z/h);

    // step 7: compute node line vector
    var Nvec = new THREE.Vector3(0,0,1).cross(hvec);

    // step 7.a: if node line vector is (0,0,0) => it should be (1,0,0) (orbit in equitorial plane)
    if (Nvec.equals(new THREE.Vector3(0,0,0))) {
        Nvec = new THREE.Vector3(1,0,0);
    }

    // step 8: compute magnitude of node line vector
    var N = vec3_mag(Nvec);

    // step 9: compute RA of the ascending node
    if (Nvec.y >= 0) {
        var Omega = Math.acos(Nvec.x/N);
    } else {
        var Omega = 2*Math.PI - Math.acos(Nvec.x/N);
    }

    // step 10: compute eccentricity vector
    var evec = rvec.clone().multiplyScalar(v**2 - MU/r).sub(vvec.clone().multiplyScalar(r*vr)).multiplyScalar(1/MU);

    // step 11: compute eccentricity
    var e = vec3_mag(evec);

    // step 12: compute argument of perigee
    if (evec.z >= 0) {
        var omega = Math.acos(Nvec.dot(evec)/(N*e));
    } else {
        var omega = 2*Math.PI - Math.acos(Nvec.dot(evec)/(N*e));
    }

    // step 13: compute true anomoly
    if (vr >= 0) {
        var theta = Math.acos(evec.dot(rvec)/(e*r));
    } else {
        var theta = 2*Math.PI - Math.acos(evec.dot(rvec)/(e*r));
    }
 
    // return the 6 classical orbital elements
    return new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega);

}

function R1(a) {
    // R1 roation matrix
    var m = new THREE.Matrix3();
    m.set(
        1, 0, 0,
        0, Math.cos(a), Math.sin(a),
        0, -Math.sin(a), Math.cos(a)
    );
    return m;
}

function R3(a) {
    // R3 roation matrix
    var m = new THREE.Matrix3();
    m.set(
        Math.cos(a), Math.sin(a), 0,
        -Math.sin(a), Math.cos(a), 0,
        0, 0, 1
    );
    return m;
}

function elements_to_pv(el) {
    // find position and velocity vectors from orbital elements
    // given in a geocentric equatorial frame
    //
    // EL given as ClassicalOrbitalElements
    //
    // returns [rvec, vvec]

    var e = el.e;
    var h = el.h;
    var theta = el.theta;
    var omega = el.omega;
    var Omega = el.Omega;
    var inclination = el.inclination;

    // step 1: find position vector in perifocal frame
    var rvecp = new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0).multiplyScalar(h**2/MU * 1/(1+e*Math.cos(theta)));

    // step 2: find velocity vector in perifocal frame
    var vvecp = new THREE.Vector3(-Math.sin(theta), e+Math.cos(theta), 0).multiplyScalar(MU/h);

    // step 3: compute tansformation matrix
    var QXx = R3(omega).multiply(R1(inclination)).multiply(R3(Omega));
    var QxX = QXx.clone().transpose();

    // step 4: transform to geocentric frame
     var rvec = rvecp.applyMatrix3(QxX);
     var vvec = vvecp.applyMatrix3(QxX);

     // return transformed vectors
     return [rvec, vvec];
}

function orbital_path_pv_points(elements) {
    // makes a list of position, velocity points along this orbital path
    // points is a list of [[pos,vel], ...]
    // retreive just points with:
    //      points.map(function(v,i) {return v[0]; });

    var el = elements.clone();
    var thetas = arange(0, 2*Math.PI, 0.1);
    var points = [];

    thetas.forEach(theta => {
        el.theta = theta;
        var [pos, vel] = elements_to_pv(el);
        points.push([pos, vel]);
    });

    return points;
}

function pv_at_time(elements, time) {
    // finds the orbital position and velocity at a given time (seconds)

    el_at_time = elements_at_time(elements, time);
    return elements_to_pv(el_at_time);
}

function elements_at_time(elements, time) {
    // finds the orbital elements at a given time (seconds)

    // find mean anomoly
    var Me = MU**2/elements.h**3 * (1-elements.e**2)**(3/2) * time;

    // find eccentricic anomoly
    function Efunc(E) {
        return E - elements.e*Math.sin(E) - Me;
    }
    function Eprimefunc(E) {
        return 1 - elements.e*Math.cos(E);
    }
    if (Me <= Math.PI) {
        var guess = Me + elements.e/2
    } else {
        var guess = Me - elements.e/2
    }
    var E = newtons_method(Efunc, Eprimefunc, guess);

    // define orbital elements for this time
    var theta = 2*Math.atan(Math.sqrt((1+elements.e)/(1-elements.e))*Math.tan(E/2));
    var new_el = elements.clone();
    new_el.theta = theta;

    return new_el;    
}

function newtons_method(f, fprime, guess, max_iter=100, threshold=0.0001) {
    // use newtons method to solve an equation.
    // f: function
    // fprime: function derivative
    // guess: initial value guess
    // optional max_iter: maximum iterations allowed. Warning will
    //      be thrown if this limit is reached
    // optional threshold: Once x-f/f' is less than threshold, the
    //      solution is considered converged and the value is returned

    var val = null;
    var valprime = null;

    var x = guess;
    for (var i = 1; i < max_iter; i++) {
        val = f(x);
        valprime = fprime(x);
        x = x - val/valprime;
        if (x <= threshold) {
            break;
        }
    }
    return x;
}

function elements_to_time(elements) {
    // find the time since perigee given classical orbital element set

    let period = 2*Math.PI/MU**2 * (elements.h/Math.sqrt(1-elements.e**2))**3;
    let E = 2*Math.atan(Math.sqrt((1-elements.e)/(1+elements.e))*Math.tan(elements.theta/2));
    let t = (E-elements.e*Math.sin(E)) * period / (2*Math.PI);
    return t
}

function makeCircularElementsR(radius) {
    // makes classical orbital elements for a circular orbit, given the RADIUS
    let v = Math.sqrt(MU/radius);
    let theta = 0;
    let h = v * radius;
    let e = 0;
    let Omega = 0;
    let inclination = 0;
    let omega = 0;
    return new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega);
}

function makeCircularElementsV(velocity) {
    // makes classical orbital elements for a circular orbit, given the VELOCITY
    let r = MU / velocity**2;
    let theta = 0;
    let h = r*velocity;
    let e = 0;
    let Omega = 0;
    let inclination = 0;
    let omega = 0;
    return new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega);
}

export function makeEllipticalElementsR(rp, ra) {
    // makes classical orbital elements for an elliptical orbit, given RA and RP
    if (rp > ra) {
        // throw Error('Perigee must be less than Apogee')
        let temp_ra = ra;
        ra = rp;
        rp = temp_ra;
    };
    let theta = 0;
    let h = Math.sqrt(2*MU) * Math.sqrt((ra*rp)/(ra+rp));
    let e = (ra-rp)/(ra+rp);
    let Omega = 0;
    let inclination = 0;
    let omega = 0;
    return new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega);
}

function makeHohmannTransfer(orbit1, orbit2, speedUpAtPerigee=true) {
    // comes up with the classical orbital elements for the hohmann transfer ellipse
    // between two orbits.
    // orbits MUST share an apse line.
    // speedUpAtPerigee = true is recommended.
    // for hohmann transfer, it is more efficient to go from perigee of the inner
    // ellipse to apogee of the outer ellipse

    let rp1 = orbit1.rPerigee;
    let ra1 = orbit1.rApogee;
    
    let rp2 = orbit2.rPerigee;
    let ra2 = orbit2.rApogee;

    let rp;
    let ra;

    if (rp1 <= rp2) { // orbit1 is the inner ellipse
        if (speedUpAtPerigee) { // inner perigee to outer apogee (more efficient)
            rp = rp1;
            ra = ra2;
        } else { // inner apogee to outer perigee
            rp = ra1;
            ra = rp2;
        }
    } else { // orbit2 is the inner ellipse
        if (speedUpAtPerigee) {
            rp = rp2;
            ra = ra1;
        } else {
            rp = ra2;
            ra = rp1;
        }
    }

    return makeEllipticalElementsR(rp, ra);
}

export function hohmannTransferDeltaV(orbit1, orbit2, speedUpAtPerigee=true) {
    // finds the delta V required in a hohmann transfer
    
    let deltaV;
    let transferOrbit = new Orbit();
    transferOrbit.init_from_elements2( makeHohmannTransfer(orbit1, orbit2, speedUpAtPerigee) );

    let rp1 = orbit1.rPerigee;
    let rp2 = orbit2.rPerigee;

    if (rp1 <= rp2) { // orbit1 is the inner ellipse
        if (speedUpAtPerigee) { // inner perigee to outer apogee (more efficient)
            deltaV = Math.abs(orbit2.velocityAtTheta(Math.PI) - transferOrbit.velocityAtTheta(Math.PI)) + Math.abs(transferOrbit.velocityAtTheta(0) - orbit1.velocityAtTheta(0));
        } else { // inner apogee to outer perigee
            deltaV = Math.abs(orbit2.velocityAtTheta(0) - transferOrbit.velocityAtTheta(0)) + Math.abs(transferOrbit.velocityAtTheta(Math.PI) - orbit1.velocityAtTheta(Math.PI));
        }
    } else { // orbit2 is the inner ellipse
        if (speedUpAtPerigee) {
            deltaV = Math.abs(orbit1.velocityAtTheta(Math.PI) - transferOrbit.velocityAtTheta(Math.PI)) + Math.abs(transferOrbit.velocityAtTheta(0) - orbit2.velocityAtTheta(0));
        } else {
            deltaV = Math.abs(orbit1.velocityAtTheta(0) - transferOrbit.velocityAtTheta(0)) + Math.abs(transferOrbit.velocityAtTheta(Math.PI) - orbit2.velocityAtTheta(Math.PI));
        }
    }

    return deltaV;

}

function makeElementDroppable(baseElement, placeholderText='{Drop Item Here}') {
    // makes an element droppable and able to input an orbit node
    // Not programmed to work with any other types drop types
    // Returns the masking drop element

    let dropInput = document.createElement('div');
    dropInput.innerText = placeholderText;
    dropInput.classList.add('dropInput', 'dropInput-empty');
    dropInput.addEventListener('dragover', onDroppableOrbitDragOver, false );
    dropInput.addEventListener('dragleave', onDroppableOrbitDragLeave, false );
    dropInput.addEventListener('drop', onDroppableOrbitDrop, false );
    baseElement.domElement.appendChild(dropInput);

    return dropInput;

}

function onDroppableOrbitDragOver(event) {

    if ([...event.dataTransfer.types].includes('treeid')) {
        if ([...event.dataTransfer.types].includes('nodeid')) {
            // enable drop
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            event.target.classList.add('dropInput-dropping');
        }
    }

}

function onDroppableOrbitDragLeave(event) {
    event.target.classList.remove('dropInput-dropping');
}

function onDroppableOrbitDrop(event) {
    // event.preventDefault();

    // InspireTreeDOM passestwo pieces of data:

    // The tree ID, in case you have multiple trees...
    let treeId = event.dataTransfer.getData('treeId');

    // ... and a node ID. This node ID belongs to the node being dragged/dropped
    let nodeId = event.dataTransfer.getData('nodeId');

    // get the root tree
    let tree = orbits.treeNode.tree();

    // get the node (using its ID) from the tree
    var node = tree.node(nodeId);

    // set the DOM element inner text to the node text
    event.target.innerText = node.text;

    // set a tag attribute to be equal to the node ID (or the orbit ID?)
    event.target.setAttribute('data-orbitId', node.object.id);

    // format as a dropped boi
    event.target.classList.remove('dropInput-dropping');
    event.target.classList.remove('dropInput-empty');
    event.target.classList.add('dropInput-dropped');

}

function addPVToFolder(stateVar, folder, listen=false) {
    // adds the position and velocity data to a dat.gui folder

    if (listen) {
        folder.add( stateVar, 'px' ).listen();
        folder.add( stateVar, 'py' ).listen();
        folder.add( stateVar, 'pz' ).listen();
        folder.add( stateVar, 'vx' ).listen();
        folder.add( stateVar, 'vy' ).listen();
        folder.add( stateVar, 'vz' ).listen();
    } else {
        folder.add( stateVar, 'px' );
        folder.add( stateVar, 'py' );
        folder.add( stateVar, 'pz' );
        folder.add( stateVar, 'vx' );
        folder.add( stateVar, 'vy' );
        folder.add( stateVar, 'vz' );
    }

}

function addELToFolder(stateVar, folder, listen=false) {
    // adds the classical orbital element data to a dat.gui folder

    if (listen) {
        folder.add( stateVar, 'theta' ).listen();
        folder.add( stateVar, 'e' ).listen();
        folder.add( stateVar, 'h' ).listen();
        folder.add( stateVar, 'Omega' ).listen();
        folder.add( stateVar, 'inclination' ).listen();
        folder.add( stateVar, 'omega' ).listen();
    } else {
        folder.add( stateVar, 'theta' );
        folder.add( stateVar, 'e' );
        folder.add( stateVar, 'h' );
        folder.add( stateVar, 'Omega' );
        folder.add( stateVar, 'inclination' );
        folder.add( stateVar, 'omega' );
    }

}