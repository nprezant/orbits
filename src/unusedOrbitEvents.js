// this module contains the custom events used in the program

// scene object events are passed back with a "detail.object" attribute
// referencing the object selected
var sceneObjectSelectedE = new Event('sceneObjectSelected');
var sceneObjectDeselectedE = new Event('sceneObjectDeselected');

var sceneObjectActivatedE = new Event('sceneObjectActivated');
var sceneObjectDeactivatedE = new Event('sceneObjectDeactivated');

var sceneObjectHoveredE = new Event('sceneObjectHovered');
var sceneObjectUnhoveredE = new Event('sceneObjectUnhovered');

var nodeActivatedE = new Event('nodeActivated');

var dblClickTimeThreshold = 250; // ms

export function nodeActivatedDispatcher(node) {
    let deltaT = timeSinceLastHit(node);
    if (deltaT == null) {
        // different object
    } else if (deltaT < dblClickTimeThreshold) {
        node.emit(nodeActivatedE);
        // onNodeDoubleClick(node);
    }
}

var previousSelection = [null, null]; // [time(ms), obj]

// count time between function calls
function timeSinceLastHit(object) {

    var prevTime = previousSelection[0];
    var prevObject = previousSelection[1];

    // if this was the first selection to happen, simply record and carry on
    if (prevTime == null) {

        // record time and object after the if statement

    } else {

        // if this was two hits with the same object on the same node, count the time
        if (object == prevObject) {
            let deltaHitTime = Date.now() - prevTime;
            return deltaHitTime;
        }
    }

    previousSelection = [Date.now(), object];

    return null;

}

const mousemovements = {
    DRAG: 'drag',
    CLICK: 'click',
    IDLE: 'idle'
};



// dispatch a hover event if a the pointer is above
// a three 3D object
export function dispatchThreeHoverObjects(event) {

    var intersects = getIntersects( event.layerX, event.layerY );

    if ( intersects.length > 0 ) {

        // get the top intersected object
        var res = intersects.filter( function ( res ) {
            return res && res.object;
        } )[ 0 ];

        // dispatch event
        if ( res && res.object ) {
            res.object.dispatchEvent(sceneObjectHoveredE);
        }
    }
}

// ****************************
// Selection
// ****************************

var selectedObject = null;

function onDocumentSelectObject( event ) {
    // if an object is currently highlighted, select that one
    function deSelectObject(obj, colors) {
        try {
            // setObjectColor(obj, colors);
            obj.resetState();
        } catch {
            // no object was selected
        } finally {
            // object was selected, so there should be a gui to destroy
            try {
                panelmanager.removeDatGUI('prop_viewer');
            } catch {
                // gui didn't exist
            }
        }
    }
    if ( highlightedObject ) {
        // if a highlighted object exists, then select it
        deSelectObject(selectedObject);
        selectedObject = highlightedObject;
        selectedObject.selectState = true;
        highlightedObject = null;
        selectedObject.viewPropertiesGUI(panelmanager);
    } else {
        // no object currently highlighted.
        // only deselect the current object if user clicked (not dragged)
        if (mousemovement == mousemovements.CLICK) {
            deSelectObject(selectedObject);
        }
    }
}

var highlightedObject = null;

function highlightObjectUnderPointer( event ) {
    // highlights the object under the pointer
    event.preventDefault();
    if ( highlightedObject ) {
        if (highlightedObject != selectedObject) {
            // only mess with the state if it is not the selected object
            highlightedObject.resetState();
            highlightedObject = null;
        }
    }
    var intersects = getIntersects( event.layerX, event.layerY );
    if ( intersects.length > 0 ) {
        var res = intersects.filter( function ( res ) {
            return res && res.object;
        } )[ 0 ];
        if ( res && res.object ) {
            // at this point, res.object is under the pointer
            res.object.dispatchEvent()
            if (res.object.parent instanceof Orbit) {
                highlightedObject = res.object.parent;
                highlightedObject.hoverState = true;
            }
        }
    }
}

// var raycaster = new THREE.Raycaster();
// var mouseVector = new THREE.Vector3();

function getIntersects( x, y ) {
    x = ( x / window.innerWidth ) * 2 - 1;
    y = - ( y / window.innerHeight ) * 2 + 1;
    mouseVector.set( x, y, 0.5 );
    raycaster.setFromCamera( mouseVector, camera );
    return raycaster.intersectObject( orbits, true );
}

// ****************************
// Selection
// ****************************