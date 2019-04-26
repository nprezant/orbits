import * as THREE from 'three';
import { vec3_mag, newtons_method, pv_to_elements } from './orbit';

var MU = 398600;

const TrajectoryType = {
    PROGRADE: 'prograde',
    RETROGRADE: 'retrograde'
}

export function lambertOrbitElements(rvec1, rvec2, deltaT) {
    // position1 and position2 are given as THREE.Vector3 objects
    // time given in seconds

    // step 1: magnitude of position vectors
    let r1 = vec3_mag(rvec1);
    let r2 = vec3_mag(rvec2);

    // step 2: delta theta (choose prograde/retrograde)
    let dTheta = lambertDeltaTheta(rvec1, rvec2, TrajectoryType.PROGRADE);

    // step 3: A from 8-22
    let A = Afunc(r1, r2, dTheta);

    // step 4: solve 8-23 for z using Newton's method
    let gamma0 = gamma(r1, r2, 0, A);
    function Ffunc(z) {
        let gammaZ = gamma(r1, r2, z, A);
        return Math.abs(gammaZ/C(z))**(3/2) * S(z) + A*Math.sqrt(gammaZ) - Math.sqrt(MU) * deltaT;
    }
    function Fprimefunc(z) {
        if (z == 0) {
            return Math.sqrt(2)/40 * gamma0**(3/2) + A/8*(Math.sqrt(gamma0) + A*Math.sqrt(1/(2*gamma0)));
        } else {
            let gammaZ = gamma(r1, r2, z, A);
            return (gammaZ/C(z))**(3/2) * (1/(2*z)*(C(z)-3/2*S(z)/C(z)) + 3/4*S(z)**2/C(z)) + A/8*(3*S(z)/C(z)*Math.sqrt(gammaZ)+A*Math.sqrt(C(z)/gammaZ));
        }
    }
    let guess = 0;
    var z = newtons_method(Ffunc, Fprimefunc, guess);

    // step 4.a: if the sign of z is off, we must have chosen the wrong trajectory


    // step 5: compute gamma
    let gammaZ = gamma(r1, r2, z, A);

    // step 6: compute lagrange coeffs with 8-25
    let f = 1 - gammaZ / r1;
    let g = A * Math.sqrt(gammaZ / MU);
    let fdot = Math.sqrt(MU) / (r1 * r2) * Math.sqrt(gammaZ / C(z)) * (z * S(z) - 1);
    let gdot = 1 - gammaZ / r2;

    // step 7: compute velocities at 1 and 2 with 8-17 and 8-18
    let vvec1 = rvec2.clone().sub(rvec1.clone().multiplyScalar(f)).multiplyScalar(1/g);
    let vvec2 = rvec2.clone().multiplyScalar(gdot).sub(rvec1).multiplyScalar(1/g);

    // step 8: compute classical orbital elements from position and velocity
    return pv_to_elements(rvec1, vvec1);
}

function lambertDeltaTheta(rvec1, rvec2, trajectoryType) {
    // trajectoryType: TrajectoryType Enum

    let pos1 = vec3_mag(rvec1);
    let pos2 = vec3_mag(rvec2);

    let dot = rvec1.dot(rvec2);
    let cross = new THREE.Vector3().crossVectors(rvec1, rvec2);
    let angle = Math.acos(dot/(pos1*pos2));
    let dTheta;

    if (trajectoryType == TrajectoryType.PROGRADE) {
        if (cross.z >= 0) {
            dTheta = angle;
        } else {
            dTheta = 2*Math.PI - angle;
        }
    } else if (trajectoryType == TrajectoryType.RETROGRADE) {
        if (cross.z < 0) {
            dTheta = angle;
        } else {
            dTheta = 2*Math.PI - angle;
        }
    } else {
        throw Error('Invalid Trajectory Type');
    }

    return dTheta;
}

function gamma(r1, r2, z, A) {
    return r1 + r2 + A*(z*S(z)-1) / (Math.sqrt(C(z)));
}

function S(z) {
    if (z > 0) {
        return (Math.sqrt(z) - Math.sin(Math.sqrt(z))) / (Math.sqrt(z))**3;
    } else if (z < 0) {
        return (Math.sinh(Math.sqrt(-z)) - Math.sqrt(-z)) / (Math.sqrt(-z))**3;
    } else {
        return 1/6;
    }
}

function C(z) {
    if (z > 0) {
        return (1-Math.cos(Math.sqrt(z))) / z;
    } else if (z < 0) {
        return (Math.cosh(Math.sqrt(-z)) - 1) / (-z);
    } else {
        return 1/2;
    }
}

function Afunc(r1, r2, dTheta) {
    return Math.sin(dTheta) * Math.sqrt(r1*r2/(1-Math.cos(dTheta)));
}