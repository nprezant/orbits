const ArrayModule = require('./js/helpers/arrays');
const OrbitModule = require('./orbit');

self.addEventListener('message', function(event) {

    switch (event.data.cmd) {

        case 'project1task1plot1':
            let returnData = project1Task1Plot1();
            returnData['cmd'] = 'project1task1plot1';
            self.postMessage(returnData);
            self.close();
            break;

        default:
            break;
    }
}, false);

function project1Task1Plot1() {
    let rA = 40000;
    let rAprime = rA * 1;
    let xrange = ArrayModule.arange(5.5, 10, 0.1); // rBrARange
    let yrange = ArrayModule.arange(1.5, 10, 0.1); // rBprimeRARange
    let data = project1Task1(rA, rAprime, xrange, yrange);
    data.plot_layout.title = 'Plot 1 - r\'\/r = 5'
    // data.plot_data.contours = {
        
    // }
    return data;
}

function project1Task1(rA, rAprime, xrange, yrange) {

    let z_data = [];

    for (const rBprimeRA of yrange) {
        
        let constYColumn = [];

        for (const rBrA of xrange) {

            let r0degA = rA;
            let r180degA = rAprime;

            let r0degB = rBprimeRA * rA;
            let r180degB = rBrA * rA;

            let startOrbit = new OrbitModule.Orbit({elements: OrbitModule.makeEllipticalElementsR(r0degA, r180degA)});
            let endOrbit = new OrbitModule.Orbit({elements: OrbitModule.makeEllipticalElementsR(r0degB, r180degB)});

            // let dv = OrbitModule.hohmannTransferDeltaV(startOrbit, endOrbit, 0);
            // let dvPrime = OrbitModule.hohmannTransferDeltaV(startOrbit, endOrbit, Math.PI);
            // let dvRatio = dvPrime/dv;

            let startTheta = 0;
            let endTheta = startTheta + Math.PI; // 180 degrees
            let transferOrbit1 = new OrbitModule.Orbit({elements: OrbitModule.makeHohmannTransfer(startOrbit, endOrbit, startTheta), name: 'Transfer Orbit1 '});
            let transferOrbit2 = new OrbitModule.Orbit({elements: OrbitModule.makeHohmannTransfer(startOrbit, endOrbit, endTheta), name: 'Transfer Orbit2 '});

            let deltaV1 = (
                Math.abs( endOrbit.velocityAtTheta(endTheta) - transferOrbit1.velocityAtTheta(endTheta) )
                + Math.abs( transferOrbit1.velocityAtTheta(startTheta) - startOrbit.velocityAtTheta(startTheta) )
            );
            
            let deltaV2 = (
                Math.abs( endOrbit.velocityAtTheta(startTheta) - transferOrbit2.velocityAtTheta(startTheta) )
                + Math.abs( transferOrbit2.velocityAtTheta(endTheta) - startOrbit.velocityAtTheta(endTheta) )
            );

            let dvRatio = deltaV2/deltaV1;

            constYColumn.push(dvRatio);

        }

        z_data.push(constYColumn);

    }

    var data = [{
        z: z_data,
        x: xrange,
        y: yrange,
        type: 'contour',
        contours : {
            showlabels: true,
            labelfont: {
                family: 'Raleway',
                size: 12,
                color: 'white',
            },
            // start: 1,
            // end: 1.5,
            // size: 0.05
    }
    }];
    
    var layout = {
        title: 'Project 1 Task 1',
        // scene: {camera: {eye: {x: 1.87, y: 0.88, z: -0.64}}},
        autosize: false,
        width: 500,
        height: 500,
        margin: {
            l: 65,
            r: 50,
            b: 65,
            t: 90,
        }
    };
        
    return {plot_data: data, plot_layout: layout};
            
}