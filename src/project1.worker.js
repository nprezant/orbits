const ArrayModule = require('./js/helpers/arrays');
const OrbitModule = require('./orbit');

self.addEventListener('message', function(event) {

    switch (event.data.cmd) {

        case 'project1task1':
            let returnData = project1Task1();
            returnData['cmd'] = 'project1task1';
            self.postMessage(returnData);
            self.close();
            break;

        default:
            break;
    }
}, false);

function project1Task1() {

    let rA = 40000;
    let rAprime = rA * 5;
    let xrange = ArrayModule.arange(5.5, 10, 0.1); // rBrARange
    let yrange = ArrayModule.arange(1.5, 10, 0.1); // rBprimeRARange

    let z_data = [];

    for (const rBprimeRA of yrange) {
        
        let constYColumn = [];

        for (const rBrA of xrange) {

            let rp1 = rA;
            let ra1 = rAprime;

            let rp2 = rBprimeRA * rA;
            let ra2 = rBrA * rA;

            let orbit1 = new OrbitModule.Orbit({elements:OrbitModule.makeEllipticalElementsR(rp1, ra1)});
            
            let orbit2 = new OrbitModule.Orbit({elements:OrbitModule.makeEllipticalElementsR(rp2, ra2)});

            let dv = OrbitModule.hohmannTransferDeltaV(orbit1, orbit2, true);
            let dvPrime = OrbitModule.hohmannTransferDeltaV(orbit1, orbit2, false);
            let dvRatio = dvPrime/dv;

            constYColumn.push(dvRatio);

        }

        z_data.push(constYColumn);

    }

    var data = [{
        z: z_data,
        x: xrange,
        y: yrange,
        type: 'contour'
        // contours: {
            //     z: {
                //         show:true,
                //         usecolormap: true,
                //         highlightcolor:"#42f462",
                //         project:{z: true}
                //     }
                // }
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