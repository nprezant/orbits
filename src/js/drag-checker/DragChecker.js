import { getEmSize } from "../helpers/screen.js";

// keeps track of whether the mouse was dragged or just clicked

var dragThreshold = getEmSize()/2;

export class DragChecker {
    constructor(element) {
        // init event to track pointer downs
        // element: element to track drags for
        this.justDraggedThreshold = 100; // ms
        element.addEventListener( 'pointerdown', logDragStart, false );
        element.addEventListener( 'pointermove', logPointerPosition, false );
        element.addEventListener( 'pointermove', logPointerState, false );
        element.addEventListener( 'pointerup', logDragStop, false );
    }
    get dragging() {
        // gets the drag state (boolean)
        return pointerDragged(dragThreshold);
    }
    get justDragged() {
        // gets whether the pointer just dragged
        // within the last "justDraggedThreshold" seconds
        // let deltaT = Date.now() - dragStopTime;
        if (pointerState == PointerStates.DRAG) {
            return true;
        } else {
            return false;
        }
    }
}

var pointerState = null;
const PointerStates = {
    DRAG: 'drag',
    CLICK: 'click',
    IDLE: 'idle'
};

var mousestart = null;
var mousestop = null;

function logDragStart( event ) {
    // start dragging, log start point
    mousestart = event;
}

function logPointerPosition( event ) {
    // saves the mouse pointer position
    mousestop = event;
}

function logDragStop( event ) {
    // once the pointer is lifted, we are no longer dragging
    mousestart = null;
}

function pointerDragged(threshold) {
    // compute distance dragged and determine if the pointer
    // was "dragged" or not based on the threshold allowable
    // returns boolean
    try {
        var dist_dragged = Math.sqrt((mousestop.pageX-mousestart.pageX)**2+(mousestop.pageY-mousestart.pageY)**2);
    } catch {
        // pointerdown event has not yet happened
    } finally {
        if (dist_dragged >= threshold) {
            return true;
        } else {
            return false;
        }
    }
}

function logPointerState( event ) {
    // saves the state of the pointer
    if (pointerDragged(dragThreshold)) {
        pointerState = PointerStates.DRAG;
    } else {
        pointerState = PointerStates.IDLE;
    }
}