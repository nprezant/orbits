
import Toolbar, { ToolbarItem } from '../toolbar/toolbar';
import SearchBar, { SearchItem } from '../search-bar/search-bar';

import addOrbitIcon from '../../icons/toolbar/add_orbit.png';
import pauseTimeIcon from '../../icons/toolbar/pause_time.png';
import resumeTimeIcon from '../../icons/toolbar/resume_time.png';
import addManyOrbitsIcon from '../../icons/toolbar/add_many_orbits.png';

import CornerElement from '../corner-element/corner-element';
import githubIcon from '../../icons/github-icon.png';

import Project1Runner from '../mae472-project/project1.runner';
import OrbitDemos from '../orbits/demos';

import OrbitPanel from './panels/OrbitPanel';
import OrbitCreator from './panels/OrbitCreator';

export default class UIControls {
    // Contains the user interface controls for controlling the orbital system

    constructor(system) {

        let project1Runner = new Project1Runner(system.orbitController);
        let orbitDemos = new OrbitDemos(system.orbitController);

        let toolbar = new Toolbar('toolbar-left', [
            new ToolbarItem(resumeTimeIcon, ()=>{system.orbitManager.resumeAll()}),
            new ToolbarItem(pauseTimeIcon, ()=>{system.orbitManager.pauseAll()}),
            new ToolbarItem(addOrbitIcon, ()=>{system.orbitController.newOrbit()}),
            new ToolbarItem(addManyOrbitsIcon, ()=>{orbitDemos.addPretty3DOrbits()}),
        ]);

        let searchBar = new SearchBar([
            new SearchItem('Pause Time', ()=>{system.orbitManager.pauseAll()}),
            new SearchItem('Resume Time', ()=>{system.orbitManager.resumeAll()}),
            new SearchItem('New Orbit', ()=>{system.orbitController.newOrbit()}),
            new SearchItem('Electron Field-like Demo Orbits', ()=>{orbitDemos.addPretty3DOrbits()}),
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
            new SearchItem('Orbit Panel', ()=>{new OrbitPanel()}),
            new SearchItem('Orbit Creater', ()=>{new OrbitCreator}),
            new SearchItem('Clear Orbits (Refresh Page)', ()=>{window.location.reload()})
        ]);

        searchBar.input.placeholder = 'Try typing "demo"';

        // link to the github page
        let githubElement = new CornerElement('ne');
        let githubLink = document.createElement('a');
        let githubImage = document.createElement('img');
        githubLink.appendChild(githubImage);
        githubElement.DOM.appendChild(githubLink);
        
        githubLink.href = 'https://github.com/nprezant/orbits';
        githubImage.src = githubIcon;
        
    }
}
