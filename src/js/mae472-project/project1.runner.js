
import Project1Worker from './project1.worker';

function getProjectWorker() {
    if (typeof(Worker) !== 'undefined') {
        // web worker support!

        return new Project1Worker();

    } else {
        alert('Sorry! No Web Worker support...');
    }
}

export default class Project1Runner{

    constructor(orbitController) {
        this.orbitController = orbitController;
    }

     runTask1Plot1() {

        let worker = getProjectWorker();
        worker.addEventListener('message', function(event) {

            if (event.data.cmd == 'project1task1plot1') {
                let plotEl = document.getElementById('plot-panel');
                Plotly.newPlot(plotEl, event.data.plot_data, event.data.plot_layout);
                this.orbitController.panelManager.setDatGUI('plotter', plotEl);
            }

        }, false);

        worker.postMessage({cmd: 'project1task1plot1'});
        // worker.terminate();

    }

     runTask1Plot2() {

        let worker = getProjectWorker();
        worker.addEventListener('message', function(event) {

            if (event.data.cmd == 'project1task1plot2') {
                let plotEl = document.getElementById('plot-panel');
                Plotly.newPlot(plotEl, event.data.plot_data, event.data.plot_layout);
                this.orbitController.panelManager.setDatGUI('plotter', plotEl);
            }

        }, false);

        worker.postMessage({cmd: 'project1task1plot2'});

    }

     runTask1Plot3() {

        let worker = getProjectWorker();
        worker.addEventListener('message', function(event) {

            if (event.data.cmd == 'project1task1plot3') {
                let plotEl = document.getElementById('plot-panel');
                Plotly.newPlot(plotEl, event.data.plot_data, event.data.plot_layout);
                this.orbitController.panelManager.setDatGUI('plotter', plotEl);
            }

        }, false);

        worker.postMessage({cmd: 'project1task1plot3'});
    }

    runTask2Plot1() {

        let worker = getProjectWorker();
        worker.addEventListener('message', function(event) {

            if (event.data.cmd == 'task2') {
                let plotEl = document.getElementById('plot-panel');
                Plotly.newPlot(plotEl, event.data[0].data, event.data[0].layout);
                this.orbitController.panelManager.setDatGUI('plotter', plotEl);
            }

        }, false);

        worker.postMessage({cmd: 'task2'});
    }

    runTask2Plot2() {

        let worker = getProjectWorker();
        worker.addEventListener('message', function(event) {

            if (event.data.cmd == 'task2') {
                let plotEl = document.getElementById('plot-panel');
                Plotly.newPlot(plotEl, event.data[1].data, event.data[1].layout);
                this.orbitController.panelManager.setDatGUI('plotter', plotEl);
            }

        }, false);

        worker.postMessage({cmd: 'task2'});
    }

    runTask3Plot() {

        let worker = getProjectWorker();
        worker.addEventListener('message', function(event) {

            if (event.data.cmd == 'task3') {
                let plotEl = document.getElementById('plot-panel');
                Plotly.newPlot(plotEl, event.data.data, event.data.layout);
                this.orbitController.panelManager.setDatGUI('plotter', plotEl);
            }

        }, false);

        worker.postMessage({cmd: 'task3'});
    }

    runTask3Table() {

        let worker = getProjectWorker();
        worker.addEventListener('message', function(event) {

            if (event.data.cmd == 'task3') {
                let tbl = document.getElementById('plot-panel');
                tbl.innerText = '';
                let csv = event.data.tableData;
                for (const row of csv) {
                    tbl.innerText += '\n' + row[0] + ', ' + row[1] + ', ' + row[2] + ', ' + row[3];
                }
                this.orbitController.panelManager.setDatGUI('plotter', tbl);
            }

        }, false);

        worker.postMessage({cmd: 'task3'});
    }

}