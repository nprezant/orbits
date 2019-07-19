
import Toolbar, { ToolbarItem } from './js/toolbar/toolbar';
import addOrbitIcon from './icons/toolbar/add_orbit.png';
import pauseTimeIcon from './icons/toolbar/pause_time.png';
import resumeTimeIcon from './icons/toolbar/resume_time.png';
import addManyOrbitsIcon from './icons/toolbar/add_many_orbits.png';

import SearchBar, { SearchItem } from './js/search-bar/search-bar';

import Project1Runner from './js/mae472-project/project1.runner';
import OrbitDemos from './js/orbits/demos';
import OrbitalSystem from './js/orbits/system';

var system;

function init() {

    // make the orbital system
    system = new OrbitalSystem();

    // MAE project 1
    let project1Runner = new Project1Runner(system.orbitController);

    // Orbital demos
    let orbitDemos = new OrbitDemos(system.orbitController);

    // toolbar
    let toolbar = new Toolbar('toolbar-left', [
        new ToolbarItem(resumeTimeIcon, ()=>{system.orbitManager.resumeAll()}),
        new ToolbarItem(pauseTimeIcon, ()=>{system.orbitManager.pauseAll()}),
        new ToolbarItem(addOrbitIcon, ()=>{system.orbitController.newOrbit()}),
        new ToolbarItem(addManyOrbitsIcon, ()=>{orbitDemos.addCircularOrbits()}),
    ]);

    // searchbar
    let searchBar = new SearchBar([
        new SearchItem('Pause Time', ()=>{system.orbitManager.pauseAll()}),
        new SearchItem('Resume Time', ()=>{system.orbitManager.resumeAll()}),
        new SearchItem('New Orbit', ()=>{system.orbitController.newOrbit()}),
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

function animate() {

    requestAnimationFrame( animate );

    // update orbital system
    system.update();

}

init();
animate();