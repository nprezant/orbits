const ArrayModule = require('./js/helpers/arrays');
const OrbitModule = require('./orbit');
const lambert = require('./lambert');

self.addEventListener('message', function(event) {
    
    let returnData;

    switch (event.data.cmd) {

        case 'project1task1plot1':
            returnData = project1Task1Plot1();
            returnData['cmd'] = 'project1task1plot1';
            self.postMessage(returnData);
            self.close();
            break;

        case 'project1task1plot2':
            returnData = project1Task1Plot2();
            returnData['cmd'] = 'project1task1plot2';
            self.postMessage(returnData);
            self.close();
            break;

        case 'project1task1plot3':
            returnData = project1Task1Plot3();
            returnData['cmd'] = 'project1task1plot3';
            self.postMessage(returnData);
            self.close();
            break;

        case 'task2':
            returnData = task2();
            returnData['cmd'] = 'task2';
            self.postMessage(returnData);
            self.close();

        case 'task3':
            returnData = task3();
            returnData['cmd'] = 'task3';
            self.postMessage(returnData);
            self.close();

        default:
            break;
    }
}, false);

function project1Task1Plot1() {
    let rA = 40000;
    let rAprime = rA * 5;
    let xrange = ArrayModule.arange(5.5, 10, 0.1); // rBrARange
    let yrange = ArrayModule.arange(1.5, 10, 0.1); // rBprimeRARange
    let data = project1Task1(rA, rAprime, xrange, yrange);
    data.plot_layout.title = 'Plot 1 - rA\' / rA = 5'
    // data.plot_data.contours = {
        
    // }
    return data;
}

function project1Task1Plot2() {
    let rA = 40000;
    let rAprime = rA * 1;
    let xrange = ArrayModule.arange(2, 10, 0.1); // rBrARange
    let yrange = ArrayModule.arange(2, 10, 0.1); // rBprimeRARange
    let data = project1Task1(rA, rAprime, xrange, yrange);
    data.plot_layout.title = 'Plot 2 - rA\' / rA = 1'
    // data.plot_data.contours = {
        
    // }
    return data;
}

function project1Task1Plot3() {
    let rA = 40000;
    let rAprime = rA * 1/5;
    let xrange = ArrayModule.arange(1.5, 10, 0.1); // rBrARange
    let yrange = ArrayModule.arange(1.5, 10, 0.1); // rBprimeRARange
    let data = project1Task1(rA, rAprime, xrange, yrange);
    data.plot_layout.title = 'Plot 3 - rA\' / rA = 1/5'
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

            let startAngle = 0; // geocentric angle
            let endAngle = startAngle + Math.PI; // 180 degrees
            let transferOrbit1 = new OrbitModule.Orbit({elements: OrbitModule.makeHohmannTransfer(startOrbit, endOrbit, startAngle), name: 'Transfer Orbit1 '});
            let transferOrbit2 = new OrbitModule.Orbit({elements: OrbitModule.makeHohmannTransfer(startOrbit, endOrbit, endAngle), name: 'Transfer Orbit2 '});

            let deltaV1 = (
                Math.abs( endOrbit.velocityAtTheta(-endOrbit.elements.omega + endAngle) - transferOrbit1.velocityAtTheta(-transferOrbit1.elements.omega + endAngle) )
                + Math.abs( transferOrbit1.velocityAtTheta(-transferOrbit1.elements.omega + startAngle) - startOrbit.velocityAtTheta(-startOrbit.elements.omega + startAngle) )
            );

            // deltaV1 = hohmanTr
            
            let deltaV2 = (
                Math.abs( endOrbit.velocityAtTheta(-endOrbit.elements.omega + startAngle) - transferOrbit2.velocityAtTheta(-transferOrbit2.elements.omega + startAngle) )
                + Math.abs( transferOrbit2.velocityAtTheta(-transferOrbit2.elements.omega + endAngle) - startOrbit.velocityAtTheta(-startOrbit.elements.omega + endAngle) )
            );

            deltaV1 = OrbitModule.hohmannTransferDeltaV(startOrbit, endOrbit, startAngle);
            deltaV2 = OrbitModule.hohmannTransferDeltaV(startOrbit, endOrbit, endAngle);

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
        },
        title: 'rA\' / rA = ',
        xaxis: {
            title: {
                text: 'rB / rA',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#7f7f7f'
                }
            },
        },
        yaxis: {
            title: {
                text: 'rB\' / rA',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#7f7f7f'
                }
            }   
        }
    };
        
    return {plot_data: data, plot_layout: layout};
            
}

function task2() {

    let rA = 7000;
    let rBRange = ArrayModule.arange(145000, 500000, 5000);
    let rC = 140000;
    let rD = 140000;

    let startOrbit = new OrbitModule.Orbit({elements: OrbitModule.makeCircularElementsR(rA)});
    let endOrbit = new OrbitModule.Orbit({elements: OrbitModule.makeCircularElementsR(rC)});

    let hohmannTransfer = new OrbitModule.Orbit({elements: OrbitModule.makeEllipticalElementsR(rA, rD)});
    let hohmannDeltaV = OrbitModule.hohmannTransferDeltaV(startOrbit, endOrbit, 0);
    let hohmannTransferTime = hohmannTransfer.period / 2 / (60 * 60 * 24); // days

    let biellipticTimes = [];
    let biellipticDeltaVs = [];

    let deltaVPercentDecrease = [];
    let timePercentIncrease = [];
    
    for (const rB of rBRange) {

        let bielliptic1 = new OrbitModule.Orbit({elements: OrbitModule.makeEllipticalElementsR(rA, rB)});
        let bielliptic2 = new OrbitModule.Orbit({elements: OrbitModule.makeEllipticalElementsR(rC, rB)});

        let biellipticDeltaV = (
            Math.abs( bielliptic1.velocityAtTheta(bielliptic1.elements.omega - 0) - startOrbit.velocityAtTheta(startOrbit.elements.omega - 0) )
            + Math.abs( bielliptic2.velocityAtTheta(bielliptic2.elements.omega - Math.PI) - bielliptic1.velocityAtTheta(bielliptic1.elements.omega - Math.PI) )
            + Math.abs( endOrbit.velocityAtTheta(endOrbit.elements.omega - 0) - bielliptic2.velocityAtTheta(bielliptic2.elements.omega - 0) )
        );
        let biellipticTime = (bielliptic1.period/2 + bielliptic2.period/2) / (60 * 60 * 24); // days

        biellipticTimes.push(biellipticTime);
        biellipticDeltaVs.push(biellipticDeltaV);

        deltaVPercentDecrease.push( -(biellipticDeltaV - hohmannDeltaV) / hohmannDeltaV );
        timePercentIncrease.push( (biellipticTime - hohmannTransferTime) / hohmannTransferTime );

    }

    let biellipticTimeVsDeltaVTrace = {
        x: biellipticDeltaVs,
        y: biellipticTimes,
        type: 'markers',
        name: 'Bi-elliptic Transfer'
    };

    let hohmannTimeVsDeltaVTrace = {
        x: [hohmannDeltaV],
        y: [hohmannTransferTime],
        type: 'markers',
        name: 'Hohmann Transfer'
    };

    let data1 = [biellipticTimeVsDeltaVTrace, hohmannTimeVsDeltaVTrace];
    
    let layout1 = {
        title: 'Delta-V vs Time for Hohman and Bi-Elliptic Transfers',
        // scene: {camera: {eye: {x: 1.87, y: 0.88, z: -0.64}}},
        autosize: false,
        width: 500,
        height: 500,
        margin: {
            l: 65,
            r: 50,
            b: 65,
            t: 90,
        },
        legend: {
            x: 0.6,
            y: 0.9
        },
        xaxis: {
            title: {
                text: 'Delta V (km/s)',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#7f7f7f'
                }
            },
        },
        yaxis: {
            title: {
                text: 'Total Flight Time (days)',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#7f7f7f'
                }
            }   
        }
    };

    let data2 = [{
        x: deltaVPercentDecrease,
        y: timePercentIncrease,
        type: 'markers',
        name: 'Hohmann Transfer'
    }];

    let layout2 = {
        title: 'Efficiency Tradeoffs Among Bi-Elliptic Transfers',
        // scene: {camera: {eye: {x: 1.87, y: 0.88, z: -0.64}}},
        autosize: false,
        width: 500,
        height: 500,
        margin: {
            l: 65,
            r: 50,
            b: 65,
            t: 90,
        },
        xaxis: {
            title: {
                text: 'Delta V (% Decrease)',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#7f7f7f'
                }
            },
        },
        yaxis: {
            title: {
                text: 'Total Flight Time (% Increase)',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#7f7f7f'
                }
            }   
        }
    }

    return [
        {data: data1, layout: layout1},
        {data: data2, layout: layout2}
    ];

}

function task3() {

    let satellite1Elements = OrbitModule.makeEllipticalElementsR(8100, 18900);
    satellite1Elements.theta = 45 * Math.PI / 180;

    let satellite2Elements = satellite1Elements.clone();
    satellite2Elements.theta = 150 * Math.PI / 180;

    let satellite1 = new OrbitModule.Orbit({elements: satellite1Elements });
    let satellite2 = new OrbitModule.Orbit({elements: satellite2Elements });

    let timeRange = ArrayModule.arange(60*60, 2*60*60, 10*60); // 1 to 2 hours in 10 minute steps

    let times = [];
    let deltaVs = [];
    let csvData = [['chaseTime', 'e', 'h', 'theta']];

    for (const time of timeRange) {
        let satellite2Time2 = satellite2.clone();
        let newTime = satellite2.timeSincePerigee + time;
        satellite2Time2.setTimeSincePerigee(newTime);

        let chase = new OrbitModule.Orbit({ elements: lambert.lambertOrbitElements(satellite1.rvec, satellite2Time2.rvec, time) });
        let deltaV = OrbitModule.transferDeltaV(satellite1, satellite2Time2, chase, satellite1.elements.omega + satellite1.elements.theta, satellite2Time2.elements.omega + satellite2Time2.elements.theta);

        times.push(time / 60); // minutes
        deltaVs.push(deltaV);
        csvData.push([time/60, chase.elements.e, chase.elements.h, chase.elements.theta]);
    }

    let data = [{
        x: times,
        y: deltaVs,
        type: 'markers',
    }];

    let layout = {
        title: 'Tradeoffs in Chasing Maneuvers',
        autosize: false,
        width: 500,
        height: 500,
        margin: {
            l: 65,
            r: 50,
            b: 65,
            t: 90,
        },
        xaxis: {
            title: {
                text: 'Intercept time (minutes)',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#7f7f7f'
                }
            },
        },
        yaxis: {
            title: {
                text: 'Delta V Required (km/s)',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: '#7f7f7f'
                }
            }   
        }
    }
    // let x = dkfj;

    return {data: data, layout: layout, tableData: csvData};

}