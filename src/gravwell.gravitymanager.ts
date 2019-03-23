import { FloatArray, Vector3, DebugLayer, Logger, Scalar } from '@babylonjs/core'
import { Game } from './game';

export interface IGravityContributor {
    mass: number;
    radius: number;
    position: Vector3;
}

export class GravityManager {
    public static GRAV_UNIT : number = 64;
    private readonly ZERO_VECTOR: Vector3 = Vector3.Zero();
    private readonly GRAV_CONST: number = 6.67259e-11;

    private _gravWells: Array<IGravityContributor>;
    public get gravWells(): Array<IGravityContributor> {
        return this._gravWells;
    }
    public set gravWells(v: Array<IGravityContributor>) {
        this._gravWells = v;
    }


    // private _positions: FloatArray;
    // public get positions(): FloatArray {
    //     return this._positions;
    // }
    // public set positions(v: FloatArray) {
    //     this._positions = v;
    // }

    public updatePositions(positions  : FloatArray): void {
        
        let gravWells = this._gravWells, 
        zeroVector = this.ZERO_VECTOR, 
        positionVector = Vector3.Zero(),
        forceVector = Vector3.Zero(),
        forceLength = 0;
        for (var idx = 0; idx < positions.length; idx += 3) {
            Vector3.FromFloatsToRef(positions[idx + 0],positions[idx + 1], positions[idx + 2], positionVector);
                         
            forceVector.setAll(0); 
            for (var gidx = 0; gidx < gravWells.length; gidx++) {
                let gwA = gravWells[gidx]; 
                    // dX = gwA.position.x - positionVector.x,
                    // dY = gwA.position.y - positionVector.y,
                    // dZ = gwA.position.z - positionVector.z;
                if (positionVector.equalsWithEpsilon(gwA.position, gwA.radius/GravityManager.GRAV_UNIT)) {
                    continue;
                }
             //   console.log('pre-calc force: ', forceVector);
            //    this.computeGravitationalForceAtPointToRef(gwA, positionVector, forceVector);
                forceVector.addInPlace(this.computeGravitationalForceAtPoint(gwA, positionVector, gwA.mass));
                
            //    console.log('post-calc force', forceVector);
            }
            forceLength = Scalar.Clamp(forceVector.length(), 0, 20*GravityManager.GRAV_UNIT);
            positions[idx + 1] = -forceLength;
            
            //positions[idx + 0] += forces.length();
            
            //positions[idx + 2] += forces.z;
        }
    }
    computeGravitationalForceAtPointToRef(gravSource: IGravityContributor, positionVector: Vector3, forceVector: Vector3, testMass?: number): void {
        let G = this.GRAV_CONST,
            d = Vector3.Distance(gravSource.position, positionVector),
            m1 = gravSource.mass,
            m2 = testMass || 100,
            dir = positionVector.subtractToRef(gravSource.position, this.ZERO_VECTOR).normalize(),
            r = Math.pow(d, 2);
        if (r === 0) { return; }

        //  positionVector.subtract(gravSource.position).normalize();
        let f = -(G * (m1 * m2)) / (r);
        
        forceVector.set(dir.x * f, dir.y * f, dir.z * f);//forceVector.copyFrom(dir);
    //    console.log(forceVector);
    }

    // private GravitySourceReductor(accum : IGravityContributor, gravSource : IGravityContributor) : Vector3 {
    //     let fi = this.computeGravitationalForceAtPoint(
    //         accum, 
    //         Vector3.Zero().set(
    //             positions[idx + 0], 
    //             positions[idx + 1], 
    //             positions[idx + 2]), cv.mass);

    //     return pv.addInPlace(fi);
    // }

    private computeGravitationForceAtPointUsingFloatsToRef(gravSource: IGravityContributor, testPointX: number,
        testPointY: number, testPointZ: number,
        testMass?: number, result?: Vector3): void {
        let dX = testPointX - gravSource.position.x,
            dY = testPointY - gravSource.position.y,
            dZ = testPointZ - gravSource.position.z,
            m1 = testMass || 100,
            m2 = testMass || 100;

        let f = - (this.GRAV_CONST * (m1 * m2));

    }
    private computeGravitationalForceAtPoint(gravSource: IGravityContributor, testPoint: Vector3, testMass?: number): Vector3 {
        let dCenter = Vector3.Distance(testPoint, gravSource.position),
            sRad = gravSource.radius || 10;

        if (dCenter === 0) { return Vector3.Zero(); }

        let G = 6.67259e-11,
            r = dCenter ^ 2,
            dir = testPoint.subtract(gravSource.position).normalize(),
            m1 = testMass || 100,
            m2 = gravSource.mass || 100;

        // if (this.GravityWellMode === GravityMode.DistanceCubed) {
        //     r = r * dCenter; // r^3 propagation, like electrical fields
        // }
        let f = -(G * (m1 * m2)) / (r);
        return dir.scaleInPlace(f);

    }
    constructor(numberOfPositions: number) {
       // this.positions = new Float32Array(numberOfPositions);
        this.gravWells = new Array<IGravityContributor>();
    }
}