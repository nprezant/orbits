import * as dat from 'dat.gui';
import * as THREE from 'three';
import { ThreeOrbit, OrbitalState } from './three-orbit';
import { 
    Orbit,
    ClassicalOrbitalElements,
    makeCircularElementsR,
    makeCircularElementsV,
    makeEllipticalElementsR,
    makeHohmannTransfer
} from './orbit';

var gOrbitManager;
var gOrbitController;

export class OrbitController {

    constructor(orbitManager, panelManager) {
        this.orbitManager = orbitManager;
        this.orbitManager.controller = this; // for event handling
        this.panelManager = panelManager;

        gOrbitManager = orbitManager;
        gOrbitController = this;
    }

    viewProperties(orbit3) {
        let gui = new dat.GUI( { autoPlace: false } ); 
        gui.width = 300;
        this.panelManager.setDatGUI('prop_viewer', gui.domElement);
        viewOrbitProperties(gui, orbit3)
    }

    editProperties(orbit3) {
        let gui = new dat.GUI( { autoPlace: false } ); 
        gui.width = 300;
        this.panelManager.setDatGUI('prop_editor', gui.domElement);
        editOrbitProperties(gui, orbit3)
    }

    newOrbit() {
        let gui = new dat.GUI( { autoPlace: false } ); 
        gui.width = 300;
        this.panelManager.setDatGUI('prop_editor', gui.domElement);

        let orbit3 = new ThreeOrbit({render: false});
        editOrbitProperties(gui, orbit3);
        this.orbitManager.addOrbit(orbit3);
    }

    addExistingOrbit(orbit3) {
        this.orbitManager.addOrbit(orbit3);
    }

}

export function viewOrbitProperties(gui, orbit3) {
    
    // name
    gui.add( orbit3, 'name' );

    // position-velocity folder
    var pvFolder = gui.addFolder( 'Position/Velocity' );
    addPVToFolder(orbit3.state, pvFolder, true) // listen
    pvFolder.open();

    // elements folder
    var elFolder = gui.addFolder( 'Classical Orbital Elements' );
    addELToFolder(orbit3.state, elFolder, true) // listen
    elFolder.open();

    gui.add(orbit3, 'timeSincePerigee').listen()

    let params = {
        Pause: () => {
            orbit3.pause();
        },
        Resume: () => {
            orbit3.resume();
        },
        Edit: () => {
            gOrbitController.editProperties(orbit3);
        },
    };
    // orbit commands
    gui.add(params, 'Pause');
    gui.add(params, 'Resume');
    gui.add(params, 'Edit');
}

export function editOrbitProperties( gui, orbit3 ) {

    // options for defining an ellipse: one of these folders is allowed at a time
    let definitionFolders = [
        {
            name: 'Choose Orbit Definition',
            makeFolderFn: () => {},
            generateFn: () => {}
        }, {
            name: 'Position/Velocity',
            makeFolderFn: makePVFolder,
            generateFn: generatePVOrbit
        }, {
            name: 'Position/Velocity - Offset', 
            makeFolderFn: makeOffsetPVFolder,
            generateFn: generateOffsetPVOrbit
        }, {
            name: 'Classical Orbital Elements',
            makeFolderFn: makeELFolder,
            generateFn: generateELOrbit
        }, {
            name: 'Classical Orbital Elements - Offset',
            makeFolderFn: makeOffsetELFolder,
            generateFn: generateOffsetELOrbit
        }, {
            name: 'Circular Orbit (Radius)',
            makeFolderFn: makeCircularRFolder,
            generateFn: generateCircularROrbit
        }, {
            name: 'Circular Orbit (Velocity)',
            makeFolderFn: makeCircularVFolder,
            generateFn: generateCircularVOrbit
        }, {
            name: 'Elliptical Orbit (Radii)',
            makeFolderFn: makeEllipticalRFolder,
            generateFn: generateEllipticalROrbit
        }, {
            name: 'Hohmann Transfer Ellipse',
            makeFolderFn: makeHohmnannFolder,
            generateFn: generateHohmnannOrbit
        }
    ];

    // convert folder names to a list for the dropdown gui
    let definitionList = Object.keys(definitionFolders).map(function(key){
        return definitionFolders[key]['name'];
    });

    let params = {
        Name: orbit3.name,
        Definition: definitionFolders[0].name,
        currentState: null,
        offsetState: new OrbitalState(),
        additionalVars: {
            AzimuthalVelocity: 0,
            Radius: 0,
            Ra: 0,
            Rp: 0,
            refDom1: null,
            refDom2: null,
            startTheta: 0,
        },
        // Generate: generateOrbit,
        Pause: function() {
            orbit3.pause();
        },
        Resume: function() {
            orbit3.resume();
        },
    }

    // name
    gui.add( params, 'Name' );

    // definition type drop-down
    let defdropdown = gui.add( params, 'Definition', definitionList);

    // keeping track of open folders
    var openFolders = [];
    
    // manage folder switching with definition drop down list
    defdropdown.onChange(function(selectedDefinition) {
        params.currentState = orbit3.state.clone();

        let selectedItem = getFolderOption(definitionFolders, selectedDefinition);
        console.log('You selected: ' + selectedItem.name);

        closeFolders(gui, openFolders);
        let folder = gui.addFolder( selectedDefinition );
        selectedItem.makeFolderFn(folder, params);

        selectedItem.generateFnWithInputs = () => {
            selectedItem.generateFn(orbit3, params)
            orbit3.pathMeshEventsNeedUpdate = true;
            orbit3.bodyMeshEventsNeedUpdate = true;
            orbit3.startRendering();
        }
        folder.add( selectedItem, 'generateFnWithInputs' );
        folder.open();
        openFolders.push(folder);
    });

}

// gets the dictionary containing the options for the folder selected
function getFolderOption(optionsList, name) {
    for (const option of optionsList) {
        if (option.name == name) {
            return option;
        }
    }

    // otherwise
    return null;

}

 // gets the reference item from the reference item DOM
 function getRefOrbit(refItemDom) {
    let nodeIdStr = refItemDom.getAttribute('data-orbitId');
    let nodeIdInt = parseInt(nodeIdStr, 10);
    return gOrbitManager.getObjectById(nodeIdInt);
}

function closeFolders(gui, openFolders) {
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

// function generateOrbit() {
//         switch (defdropdown.getValue()) {

function generatePVOrbit(orbit3, params) {
    let currentState = params.currentState;
    let pos = new THREE.Vector3(currentState.px, currentState.py, currentState.pz);
    let vel = new THREE.Vector3(currentState.vx, currentState.vy, currentState.vz);
    orbit3.orbit = new Orbit({pv: [pos, vel]});
}

function generateOffsetPVOrbit(orbit3, params) {
    refOrbit = getRefOrbit(params.additionalVars.refDom1);
    let pos = new THREE.Vector3(
        refOrbit.state.px + params.offsetState.px, 
        refOrbit.state.py + params.offsetState.py,
        refOrbit.state.pz + params.offsetState.pz)
    let vel = new THREE.Vector3(
        refOrbit.state.vx + params.offsetState.vx, 
        refOrbit.state.vy + params.offsetState.vy, 
        refOrbit.state.vz + params.offsetState.vz)
    orbit3.orbit = new Orbit({pv: [pos, vel]});
}

function generateELOrbit(orbit3, params) {
    let currentState = params.currentState;
    let theta = currentState.theta;
    let h = currentState.h;
    let e = currentState.e;
    let Omega = currentState.Omega;
    let inclination = currentState.inclination;
    let omega = currentState.omega;
    orbit3.orbit = new Orbit({elements: new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega) });
}

function generateOffsetELOrbit(orbit3, params) {
    let offsetState = params.offsetState;
    let refOrbit = getRefOrbit(params.additionalVars.refDom1);
    let theta = refOrbit.state.theta + offsetState.theta;
    let h = refOrbit.state.h + offsetState.h;
    let e = refOrbit.state.e + offsetState.e;
    let Omega = refOrbit.state.Omega + offsetState.Omega;
    let inclination = refOrbit.state.inclination + offsetState.inclination;
    let omega = refOrbit.state.omega + offsetState.omega;
    orbit3.orbit = new Orbit({elements: new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega) });
}

function generateCircularROrbit(orbit3, params) {
    let el  = makeCircularElementsR(params.additionalVars.Radius);
    orbit3.orbit = new Orbit({elements: el });
}

function generateCircularVOrbit(orbit3, params) {
    orbit3.orbit = new Orbit({ elements: makeCircularElementsV(params.additionalVars.AzimuthalVelocity) });
}

function generateEllipticalROrbit(orbit3, params) {
    orbit3.orbit = new Orbit({ elements: makeEllipticalElementsR(
        params.additionalVars.Rp,
        params.additionalVars.Ra,
    ) });
}

function generateHohmnannOrbit(orbit3, params) {
    orbit3.orbit = new Orbit({ elements: makeHohmannTransfer(
        getRefOrbit(params.additionalVars.refDom1).orbit,
        getRefOrbit(params.additionalVars.refDom2).orbit,
        params.additionalVars.startTheta
    ) });
}

function makePVFolder(folder, params) {
    addPVToFolder(params.currentState, folder, false) // don't listen
}

function makeOffsetPVFolder(folder, params) {
    params.additionalVars.refDom1 = addReferenceItemToFolder(folder);
    addPVToFolder(params.offsetState, folder, false) // don't listen
}

function makeELFolder(folder, params) {
    addELToFolder(params.currentState, folder, false) // don't listen
}

function makeOffsetELFolder(folder, params) {
    params.additionalVars.refDom1 = addReferenceItemToFolder(folder);
    addELToFolder(params.offsetState, folder, false) // don't listen
}

function makeCircularRFolder(folder, params){
    folder.add(params.additionalVars, 'Radius');
}

function makeCircularVFolder(folder, params) {
    folder.add(params.additionalVars, 'AzimuthalVelocity');
}

function makeEllipticalRFolder(folder, params) {
    folder.add(params.additionalVars, 'Rp');
    folder.add(params.additionalVars, 'Ra');
}

function makeHohmnannFolder(folder, params) {
    params.additionalVars.refDom1 = addReferenceItemToFolder(folder);
    params.additionalVars.refDom2 = addReferenceItemToFolder(folder);
    folder.add(params.additionalVars, 'startTheta');
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

function updateGUIControllers(gui) {
    // Iterate over all controllers
    for (var i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
    }
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
    let tree = gOrbitManager.treeNode.tree();

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