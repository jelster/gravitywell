import { FloatArray, Vector3, DebugLayer, Logger, Scalar } from '@babylonjs/core'
import { Game } from './game';

export interface IGravityContributor {
    mass: number;
    radius: number;
    position: Vector3;
}

export class GravityManager {

    public static GRAV_UNIT: number = 64;
    private readonly ZERO_VECTOR: Vector3 = Vector3.Zero();
    private readonly GRAV_CONST: number = 6.67259e-11;

    private _gravWells: Array<IGravityContributor>;
    public get gravWells(): Array<IGravityContributor> {
        return this._gravWells;
    }
    public set gravWells(v: Array<IGravityContributor>) {
        this._gravWells = v;
    }

    public computeGravitationalForceAtPoint(gravSource: IGravityContributor, testPoint: Vector3, testMass?: number): Vector3 {
        return this.computeGravitationalForceAtPointToRef(gravSource, testPoint, testMass);
        
    }
    public updatePositions(positions: FloatArray): void {

        let gravWells = this._gravWells,
            zeroVector = this.ZERO_VECTOR,
            positionVector = Vector3.Zero(),
            forceVector = Vector3.Zero(),
            forceLength = 0;
        for (var idx = 0; idx < positions.length; idx += 3) {
            Vector3.FromFloatsToRef(positions[idx + 0], positions[idx + 1], positions[idx + 2], positionVector);

            forceVector.setAll(0);
            for (var gidx = 0; gidx < gravWells.length; gidx++) {
                let gwA = gravWells[gidx];

                if (positionVector.equalsWithEpsilon(gwA.position, gwA.radius)) {
                    positionVector.y = gwA.position.y;
                }
                else {
                    positionVector.y = 0;
                }

                this.computeGravitationalForceAtPointToRef(gwA, positionVector, gwA.mass, zeroVector)
                forceVector.addInPlace(zeroVector);

            }
            forceLength = Scalar.Clamp(forceVector.length(), GravityManager.GRAV_UNIT/3, 20 * GravityManager.GRAV_UNIT);
            positions[idx + 1] = -forceLength;
            //positions[idx + 0] += forces.length();
            //positions[idx + 2] += forces.z;
        }
    }    
    public computeGravitationalForceAtPointToRef(gravSource: IGravityContributor, testPoint: Vector3, testMass?: number, resultVector: Vector3 = Vector3.Zero()): Vector3 {
        let dCenter = Vector3.Distance(testPoint, gravSource.position);

        resultVector.setAll(0);

        if (dCenter === 0) { return resultVector; }

        let G = this.GRAV_CONST,
            r = Math.pow(dCenter, 2),

            m1 = testMass || 100,
            m2 = gravSource.mass || 100;
        testPoint.subtractToRef(gravSource.position, resultVector);
        // if (this.GravityWellMode === GravityMode.DistanceCubed) {
        //     r = r * dCenter; // r^3 propagation, like electrical fields
        // }
        let f = -(G * (m1 * m2)) / (r);
        return resultVector.scaleInPlace(f);

    }
    constructor() {
        
        this.gravWells = new Array<IGravityContributor>();
    }
}