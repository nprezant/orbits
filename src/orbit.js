
import * as THREE from 'three';

import { arange } from './js/helpers/arrays';

const MU = 398600 // [kg/s2], constant for earth


export class Orbit {

    constructor({name='Unnamed Orbit', elements=undefined, pv=undefined}={}) {

        this.name = name;

        if (elements !== undefined) {
            this.elements = elements;
        } else if (pv !== undefined) {
            this.elements = pv_to_elements(pv);
        } else {
            this.elements = new ClassicalOrbitalElements(0,0,0,0,0,0);
        }
    }

    get semiMajorAxis() {
        return this.elements.h**2 / (MU * (1 - this.elements.e**2));
    }

    get rPerigee() {
        return this.semiMajorAxis * (1 - this.elements.e);
    }

    get rApogee() {
        return this.semiMajorAxis * (1 + this.elements.e);
    }

    get vPerigee() {
        return this.elements.h / this.rPerigee;
    }

    get vApogee() {
        return this.elements.h / this.rApogee;
    }

    get currentRadius() {
        return this.semiMajorAxis * (1 - this.elements.e**2) / (1 + this.elements.e*Math.cos(this.elements.theta));
    }

    get radialVelocity() {
        return MU/this.elements.h * this.elements.e * Math.sin(this.elements.theta);
    }

    get azimuthalVelocity() {
        return this.elements.h / this.currentRadius();
    }

    get velocity() {
        return Math.sqrt(this.radialVelocity**2 + this.azimuthalVelocity**2);
    }

    get period() {
        return 2*Math.PI / Math.sqrt(MU) * this.semiMajorAxis**(3/2);
    }

    get flightPathAngle() {
        return Math.atan(this.radialVelocity / this.azimuthalVelocity);
    }

    radiusAtTheta(theta) {
        return this.elements.h**2 / MU * 1 / (1 + this.elements.e * Math.cos(theta));
    }

    azimuthatVelocityAtTheta(theta) {
        return MU / this.elements.h * (1 + this.elements.e * Math.cos(theta));
    }

    radialVelocityAtTheta(theta) {
        return MU / this.elements.h * this.elements.e * Math.sin(theta);
    }

    velocityAtTheta(theta) {
        return Math.sqrt(this.radialVelocityAtTheta(theta)**2 + this.azimuthatVelocityAtTheta(theta)**2);
    }

    getpv() {
        // gets the IJK frame position, velocity vector
        // update the internal saved state to match both pv and elements
        var [pos, vel] = elements_to_pv(this.elements);        
        return [pos, vel];
    }

}

class ClassicalOrbitalElements {
    constructor(theta, h, e, Omega, inclination, omega) {
        // holds the 6 orbital elements
        // true anomoly, specific angular momentum,
        // eccentricity, right ascension of the ascending node,
        // inclination angle, and argument of perigee
        this.theta = theta;
        this.h = h;
        this.e = e;
        this.Omega = Omega;
        this.inclination = inclination;
        this.omega = omega;
    }
    clone() {
        // returns a cloned copy of this set of orbital elements
        return new ClassicalOrbitalElements(
            this.theta,
            this.h,
            this.e,
            this.Omega,
            this.inclination,
            this.omega
        );
    }
    equals(other) {
        // tests whether these orbital elements are equal to OTHER elements
        var is_equal = true;
        if (this.theta != other.theta) {
            is_equal = false;
        } else {
            is_equal = this.orbitEquals(other);
        }
        return is_equal;
    }
    orbitEquals(other) {
        // tests whether this orbit is the same as the OTHER orbit (only difference is theta)
        var is_equal = true;
        if (this.h != other.h) {
            is_equal = false;
        } else if (this.e != other.e) {
            is_equal = false;
        } else if (this.Omega != other.Omega) {
            is_equal = false;
        } else if (this.inclination != other.inclination) {
            is_equal = false;
        } else if (this.h != other.h) {
            is_equal = false;
        }
        return is_equal;
    }
}

function vec3_mag(vec3) {
    // computes magnitude of a THREE.Vector3 object
    return Math.sqrt(vec3.dot(vec3));
}

function pv_to_elements(rvec, vvec) {
    // find orbital elements from the position and velocity vectors
    // given in a geocentric equatorial frame
    //
    // RVEC and VVEC are given as Vector3 objects

    // step 1: compute distance
    var r = vec3_mag(rvec);

    // step 2: compute speed
    var v = vec3_mag(vvec);

    // step 3: compute radial velocity
    var vr = rvec.dot(vvec.clone().divideScalar(r));

    // step 4: compute specific angular momentum
    var hvec = rvec.clone().cross(vvec);

    // step 5: compute magnitude of h
    var h = vec3_mag(hvec);

    // step 6: compute inclination
    var inclination = Math.acos(hvec.z/h);

    // step 7: compute node line vector
    var Nvec = new THREE.Vector3(0,0,1).cross(hvec);

    // step 7.a: if node line vector is (0,0,0) => it should be (1,0,0) (orbit in equitorial plane)
    if (Nvec.equals(new THREE.Vector3(0,0,0))) {
        Nvec = new THREE.Vector3(1,0,0);
    }

    // step 8: compute magnitude of node line vector
    var N = vec3_mag(Nvec);

    // step 9: compute RA of the ascending node
    if (Nvec.y >= 0) {
        var Omega = Math.acos(Nvec.x/N);
    } else {
        var Omega = 2*Math.PI - Math.acos(Nvec.x/N);
    }

    // step 10: compute eccentricity vector
    var evec = rvec.clone().multiplyScalar(v**2 - MU/r).sub(vvec.clone().multiplyScalar(r*vr)).multiplyScalar(1/MU);

    // step 11: compute eccentricity
    var e = vec3_mag(evec);

    // step 12: compute argument of perigee
    if (evec.z >= 0) {
        var omega = Math.acos(Nvec.dot(evec)/(N*e));
    } else {
        var omega = 2*Math.PI - Math.acos(Nvec.dot(evec)/(N*e));
    }

    // step 13: compute true anomoly
    if (vr >= 0) {
        var theta = Math.acos(evec.dot(rvec)/(e*r));
    } else {
        var theta = 2*Math.PI - Math.acos(evec.dot(rvec)/(e*r));
    }
 
    // return the 6 classical orbital elements
    return new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega);

}

function R1(a) {
    // R1 roation matrix
    var m = new THREE.Matrix3();
    m.set(
        1, 0, 0,
        0, Math.cos(a), Math.sin(a),
        0, -Math.sin(a), Math.cos(a)
    );
    return m;
}

function R3(a) {
    // R3 roation matrix
    var m = new THREE.Matrix3();
    m.set(
        Math.cos(a), Math.sin(a), 0,
        -Math.sin(a), Math.cos(a), 0,
        0, 0, 1
    );
    return m;
}

function elements_to_pv(el) {
    // find position and velocity vectors from orbital elements
    // given in a geocentric equatorial frame
    //
    // EL given as ClassicalOrbitalElements
    //
    // returns [rvec, vvec]

    var e = el.e;
    var h = el.h;
    var theta = el.theta;
    var omega = el.omega;
    var Omega = el.Omega;
    var inclination = el.inclination;

    // step 1: find position vector in perifocal frame
    var rvecp = new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0).multiplyScalar(h**2/MU * 1/(1+e*Math.cos(theta)));

    // step 2: find velocity vector in perifocal frame
    var vvecp = new THREE.Vector3(-Math.sin(theta), e+Math.cos(theta), 0).multiplyScalar(MU/h);

    // step 3: compute tansformation matrix
    var QXx = R3(omega).multiply(R1(inclination)).multiply(R3(Omega));
    var QxX = QXx.clone().transpose();

    // step 4: transform to geocentric frame
     var rvec = rvecp.applyMatrix3(QxX);
     var vvec = vvecp.applyMatrix3(QxX);

     // return transformed vectors
     return [rvec, vvec];
}

function orbital_path_pv_points(elements) {
    // makes a list of position, velocity points along this orbital path
    // points is a list of [[pos,vel], ...]
    // retreive just points with:
    //      points.map(function(v,i) {return v[0]; });

    var el = elements.clone();
    var thetas = arange(0, 2*Math.PI, 0.1);
    var points = [];

    thetas.forEach(theta => {
        el.theta = theta;
        var [pos, vel] = elements_to_pv(el);
        points.push([pos, vel]);
    });

    return points;
}

function pv_at_time(elements, time) {
    // finds the orbital position and velocity at a given time (seconds)

    el_at_time = elements_at_time(elements, time);
    return elements_to_pv(el_at_time);
}

function elements_at_time(elements, time) {
    // finds the orbital elements at a given time (seconds)

    // find mean anomoly
    var Me = MU**2/elements.h**3 * (1-elements.e**2)**(3/2) * time;

    // find eccentricic anomoly
    function Efunc(E) {
        return E - elements.e*Math.sin(E) - Me;
    }
    function Eprimefunc(E) {
        return 1 - elements.e*Math.cos(E);
    }
    if (Me <= Math.PI) {
        var guess = Me + elements.e/2
    } else {
        var guess = Me - elements.e/2
    }
    var E = newtons_method(Efunc, Eprimefunc, guess);

    // define orbital elements for this time
    var theta = 2*Math.atan(Math.sqrt((1+elements.e)/(1-elements.e))*Math.tan(E/2));
    var new_el = elements.clone();
    new_el.theta = theta;

    return new_el;    
}

function newtons_method(f, fprime, guess, max_iter=100, threshold=0.0001) {
    // use newtons method to solve an equation.
    // f: function
    // fprime: function derivative
    // guess: initial value guess
    // optional max_iter: maximum iterations allowed. Warning will
    //      be thrown if this limit is reached
    // optional threshold: Once x-f/f' is less than threshold, the
    //      solution is considered converged and the value is returned

    var val = null;
    var valprime = null;

    var x = guess;
    for (var i = 1; i < max_iter; i++) {
        val = f(x);
        valprime = fprime(x);
        x = x - val/valprime;
        if (x <= threshold) {
            break;
        }
    }
    return x;
}

function elements_to_time(elements) {
    // find the time since perigee given classical orbital element set

    let period = 2*Math.PI/MU**2 * (elements.h/Math.sqrt(1-elements.e**2))**3;
    let E = 2*Math.atan(Math.sqrt((1-elements.e)/(1+elements.e))*Math.tan(elements.theta/2));
    let t = (E-elements.e*Math.sin(E)) * period / (2*Math.PI);
    return t
}

function makeCircularElementsR(radius) {
    // makes classical orbital elements for a circular orbit, given the RADIUS
    let v = Math.sqrt(MU/radius);
    let theta = 0;
    let h = v * radius;
    let e = 0;
    let Omega = 0;
    let inclination = 0;
    let omega = 0;
    return new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega);
}

function makeCircularElementsV(velocity) {
    // makes classical orbital elements for a circular orbit, given the VELOCITY
    let r = MU / velocity**2;
    let theta = 0;
    let h = r*velocity;
    let e = 0;
    let Omega = 0;
    let inclination = 0;
    let omega = 0;
    return new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega);
}

export function makeEllipticalElementsR(rp, ra) {
    // makes classical orbital elements for an elliptical orbit, given RA and RP
    if (rp > ra) {
        // throw Error('Perigee must be less than Apogee')
        let temp_ra = ra;
        ra = rp;
        rp = temp_ra;
    };
    let theta = 0;
    let h = Math.sqrt(2*MU) * Math.sqrt((ra*rp)/(ra+rp));
    let e = (ra-rp)/(ra+rp);
    let Omega = 0;
    let inclination = 0;
    let omega = 0;
    return new ClassicalOrbitalElements(theta, h, e, Omega, inclination, omega);
}

function makeHohmannTransfer(orbit1, orbit2, speedUpAtPerigee=true) {
    // comes up with the classical orbital elements for the hohmann transfer ellipse
    // between two orbits.
    // orbits MUST share an apse line.
    // speedUpAtPerigee = true is recommended.
    // for hohmann transfer, it is more efficient to go from perigee of the inner
    // ellipse to apogee of the outer ellipse

    let rp1 = orbit1.rPerigee;
    let ra1 = orbit1.rApogee;
    
    let rp2 = orbit2.rPerigee;
    let ra2 = orbit2.rApogee;

    let rp;
    let ra;

    if (rp1 <= rp2) { // orbit1 is the inner ellipse
        if (speedUpAtPerigee) { // inner perigee to outer apogee (more efficient)
            rp = rp1;
            ra = ra2;
        } else { // inner apogee to outer perigee
            rp = ra1;
            ra = rp2;
        }
    } else { // orbit2 is the inner ellipse
        if (speedUpAtPerigee) {
            rp = rp2;
            ra = ra1;
        } else {
            rp = ra2;
            ra = rp1;
        }
    }

    return makeEllipticalElementsR(rp, ra);
}

export function hohmannTransferDeltaV(orbit1, orbit2, speedUpAtPerigee=true) {
    // finds the delta V required in a hohmann transfer
    
    let deltaV;
    let transferOrbit = new Orbit({elements:makeHohmannTransfer(orbit1, orbit2, speedUpAtPerigee)});

    let rp1 = orbit1.rPerigee;
    let rp2 = orbit2.rPerigee;

    if (rp1 <= rp2) { // orbit1 is the inner ellipse
        if (speedUpAtPerigee) { // inner perigee to outer apogee (more efficient)
            deltaV = Math.abs(orbit2.velocityAtTheta(Math.PI) - transferOrbit.velocityAtTheta(Math.PI)) + Math.abs(transferOrbit.velocityAtTheta(0) - orbit1.velocityAtTheta(0));
        } else { // inner apogee to outer perigee
            deltaV = Math.abs(orbit2.velocityAtTheta(0) - transferOrbit.velocityAtTheta(0)) + Math.abs(transferOrbit.velocityAtTheta(Math.PI) - orbit1.velocityAtTheta(Math.PI));
        }
    } else { // orbit2 is the inner ellipse
        if (speedUpAtPerigee) {
            deltaV = Math.abs(orbit1.velocityAtTheta(Math.PI) - transferOrbit.velocityAtTheta(Math.PI)) + Math.abs(transferOrbit.velocityAtTheta(0) - orbit2.velocityAtTheta(0));
        } else {
            deltaV = Math.abs(orbit1.velocityAtTheta(0) - transferOrbit.velocityAtTheta(0)) + Math.abs(transferOrbit.velocityAtTheta(Math.PI) - orbit2.velocityAtTheta(Math.PI));
        }
    }

    return deltaV;

}