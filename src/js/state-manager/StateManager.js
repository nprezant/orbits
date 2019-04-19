

export class StateManager {

    constructor(stateDict) {
        // construct with a dictionary of state names : state functions
        // there MUST be a 'default' state
        //
        // e.g.
        // this.stateFns = {
        //     'default': () => {},
        //     'highlight': () => {},
        // }
        
        this.states = ['default'];
        this.stateFns = stateDict;
    }

    addStateOption(name, fn) {
        // add a state option with a key, function pair
        this.stateFns[name] = fn;
    }

    setState(name) {
        // sets the current state and calls the associated function

        let index = this.states.indexOf(name); // -1 if not present

        // already existed; remove all following
        if (index != -1) {
            this.states.splice(index+1,this.states.length-index);
        } else {
            // otherwise add to end
            this.states.push(name);
        }

        this.callTopLevelState();

    }

    removeState(name) {
        // removes state with name NAME and calls the top level state function

        let index = this.states.indexOf(name); // -1 if not present

        if (index != -1) {
            this.states.splice(index,1);
        }

        this.callTopLevelState();
        
    }

    callTopLevelState() {
        // calls the top level state function
        let top_state = this.states[this.states.length-1];
        this.stateFns[top_state]();
    }

    get state() {
        // returns the top level state
        return this.states[this.states.length-1];
    }
}