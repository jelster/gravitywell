import { FloatArray, Vector3, DebugLayer, Logger, Scalar, _forceTransformFeedbackToBundle, Scene } from '@babylonjs/core';
import { Game } from './game';
import { GameData } from '.';
import { Ship } from './gravwell.ship';


 import './babylon.dynamicTerrain';
import { DynamicTerrain } from './babylon.dynamicTerrain';

export interface IGravityContributor {
    mass: number;
    radius: number;
    position: Vector3;
}

export class GravityManager {

    public static GRAV_UNIT: number;
    private readonly ZERO_VECTOR: Vector3 = Vector3.Zero();
    public static GRAV_CONST: number = 6.67259e-11;
    private _gameData: GameData;
    private _gravWells: Array<IGravityContributor>;
    private tmpVector: Vector3;

    public get gravWells(): Array<IGravityContributor> {
        return this._gravWells;
    }
    public set gravWells(v: Array<IGravityContributor>) {
        this._gravWells = v;
    }

    public heightMap: Float32Array;
    public gravityMap: DynamicTerrain;

    constructor(opts: GameData) {
        this._gameData = opts;
        GravityManager.GRAV_UNIT = opts.gravUnit;
        this.gravWells = new Array<IGravityContributor>();
    }


    public computeGravitationalForceAtPoint(gravSource: IGravityContributor, testPoint: Vector3, testMass?: number): Vector3 {
        return this.computeGravitationalForceAtPointToRef(gravSource, testPoint, testMass);
        
    }    
    
    public updatePositions(positions): void {

        let  
            gravWells = this._gravWells,
            zeroVector = this.ZERO_VECTOR,
            positionVector = this.ZERO_VECTOR,
            forceVector = this.tmpVector,
            gridMeshPadding = GravityManager.GRAV_UNIT,
            szX = this._gameData.gameWorldSizeX,
            szZ = this._gameData.gameWorldSizeY,
            forceLength = 0;

        for (var idx = 0; idx < positions; idx += 3) {
            Vector3.FromFloatsToRef(positions[idx + 0], positions[idx + 1], positions[idx + 2], positionVector);
            // if (Scalar.WithinEpsilon(Math.abs(positionVector.x), szX/2, gridMeshPadding) || Scalar.WithinEpsilon(Math.abs(positionVector.z), szZ/2, gridMeshPadding)) {
            //     positionVector.y = 0;
            //     continue;
            // }
            forceVector.setAll(0);
            for (var gidx = 0; gidx < gravWells.length; gidx++) {
                let gwA = gravWells[gidx];
                
                // if (positionVector.equalsWithEpsilon(gwA.position, gwA.radius)) {
                //     positionVector.y = gwA.position.y + gwA.radius;
                // }
                // else {
                //     positionVector.y = 0;
                // }
                
                this.computeGravitationalForceAtPointToRef(gwA, positionVector, 100, zeroVector)
                 
                forceVector.addInPlace(zeroVector);

            }
            forceLength = Scalar.Clamp(forceVector.length(), GravityManager.GRAV_UNIT/8, 1000 * GravityManager.GRAV_UNIT);
            positions[idx + 1] = -forceLength;
            //positions[idx + 0] += forces.length();
            //positions[idx + 2] += forces.z;
        }
        
    }    
    public computeGravitationalForceAtPointToRef(gravSource: IGravityContributor, testPoint: Vector3, testMass?: number, resultVector: Vector3 = Vector3.Zero()): Vector3 {
        let dCenter = Vector3.Distance(testPoint, gravSource.position);

        resultVector.setAll(0);

        if (dCenter === 0) { return resultVector; }

        let G = GravityManager.GRAV_CONST,
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
    public onUpdateShipStep(ship: Ship): void {
        let self = this;
        this.gravWells.forEach(gravWell => {
            self.applyGravitationalForceToShip(gravWell, ship);
        });
    }

    public generateDynamicTerrain(scene: Scene): DynamicTerrain {
        let gU = this._gameData.gravUnit,  
            wsX = this._gameData.gameWorldSizeX,//gU * 12, 
            wsZ = this._gameData.gameWorldSizeY,//gU * 12,
        
        numberOfDivisionsX = wsX / gU,
        numberOfDivisionsZ = wsZ / gU,
        heightMap = this.generateHeightMap();
       // this.heightMap = heightMap;
        var dynTerr = new DynamicTerrain("gravityHeightMap", {   
            mapData: heightMap,         
            mapSubX: numberOfDivisionsX,
            mapSubZ: numberOfDivisionsZ,
            terrainSub: 160
        }, scene);
        dynTerr.camera = scene.activeCameras[0];
        this.gravityMap = dynTerr;
        // dynTerr.subToleranceX = 2;
        // dynTerr.subToleranceZ = 2;
        dynTerr.mesh.layerMask = Game.MAIN_RENDER_MASK;
        dynTerr.LODLimits = [1,1,1,1,1];
        
        this.tmpVector = new Vector3();
        var forceVector = new Vector3(), self = this, forceLength = 0.0;
     
        dynTerr.refreshEveryFrame = true;
        dynTerr.useCustomVertexFunction = true;
        dynTerr.computeNormals = true;
       
        dynTerr.updateVertex = function(vertex, i, j) {
            forceVector.setAll(0);
            self.tmpVector.setAll(0);
            forceLength = 0;
            let heightMapIdx = 3*vertex.mapIndex + 1;
            //     heightValue = self.heightMap[heightMapIdx];  
            if (vertex.lodX > 5 || vertex.lodZ > 5) {
                return;
            }
            for (var gidx = 0; gidx < self.gravWells.length; gidx++) {
                let gwA = self.gravWells[gidx];
                                
                self.computeGravitationalForceAtPointToRef(gwA, vertex.worldPosition, 100,self.tmpVector)
                 
                forceVector.addInPlace(self.tmpVector);

            }
            forceLength = Scalar.Clamp(forceVector.length(), GravityManager.GRAV_UNIT/4, 600 * GravityManager.GRAV_UNIT);   
          //  vertex.position.y = -forceLength;         
     //       vertex.position.x = self.heightMap[heightMapIdx + 0]
      //      vertex.position.y = heightValue;
      //      vertex.position.z = self.heightMap[heightMapIdx + 2];
            self.gravityMap.mapData[heightMapIdx] = -forceLength;
           // self.heightMap[heightMapIdx] = -forceLength;
        };
        return dynTerr;
    }
    private applyGravitationalForceToShip(gravSource: IGravityContributor, ship: Ship): void {
        let sV = ship.velocity, gForce = ship.geForce, dTime = ship.mesh.getEngine().getDeltaTime()/1000;

        this.computeGravitationalForceAtPointToRef(gravSource, ship.position, 1, gForce);
        
       // gForce.y = 0; // ship should follow the terrain's height
        gForce.scaleInPlace(dTime);
        sV.addInPlace(gForce);
    }

    private generateHeightMap(): Float32Array {
        let wsX = this._gameData.gameWorldSizeX, 
            wsZ = this._gameData.gameWorldSizeY,
            gU = this._gameData.gravUnit,  
            numberOfDivisionsX = wsX / gU,
            numberOfDivisionsZ = wsZ / gU,
            arrayLength = numberOfDivisionsX * numberOfDivisionsZ * 3;

        var mapData = new Float32Array(arrayLength);
        for (let l = 0; l < numberOfDivisionsZ; l++) {
            for (let w = 0; w < numberOfDivisionsX; w++) {
                let idx = 3 * (l * numberOfDivisionsX + w),
                idy = idx + 1,
                idz = idx + 2;
                mapData[idx] = (w - numberOfDivisionsX * 0.5) * gU;
                mapData[idy] = 0;
                mapData[idz] = (l - numberOfDivisionsZ * 0.5) * gU;
            }
        }
        return mapData;
    }

    
    
}