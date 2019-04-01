import { FloatArray, Vector3, DebugLayer, Logger, Scalar, _forceTransformFeedbackToBundle, Scene, Color3, Color4, StandardMaterial, MultiMaterial, MaterialFlags } from '@babylonjs/core';
import { Game } from './game';
import { GameData } from '.';
import { Ship } from './gravwell.ship';


 import './babylon.dynamicTerrain';
import { DynamicTerrain } from './babylon.dynamicTerrain';
import { GridMaterial } from '@babylonjs/materials/grid';
import { MaterialAlphaMode } from 'babylonjs-gltf2interface';

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
    private _gridMat: GridMaterial;

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
                
                this.computeGravitationalForceAtPointToRef(gwA, positionVector, 1, zeroVector)
                 
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
            maps = this.generateHeightMap({ gU: gU, wsX: wsX, wsZ: wsZ, mapSubX: numberOfDivisionsX, mapSubZ: numberOfDivisionsZ}),
        
        gridMat  = new GridMaterial("gridMat", scene);
        gridMat.gridRatio = gU;
        gridMat.lineColor = Color3.White();
        gridMat.mainColor = Color3.Black();    
        gridMat.alpha = 0.78;
        gridMat.alphaMode = 1;
        
        this._gridMat = gridMat;
        var multiMat = new MultiMaterial("multi", scene);
        var stdMat = new StandardMaterial("std", scene);
        multiMat.subMaterials.push(gridMat);
        multiMat.subMaterials.push(stdMat);

        stdMat.alpha = 0.5;
        stdMat.alphaMode = 2;
        gridMat.needAlphaBlending = () => true;
       
            
       // this.heightMap = heightMap;
        var dynTerr = new DynamicTerrain("gravityHeightMap", {   
            mapData: maps.heightMap, 
          //  mapColors: maps.colorMap,        
            mapSubX: numberOfDivisionsX,
            mapSubZ: numberOfDivisionsZ,
            terrainSub: 160
        }, scene);
        dynTerr.camera = scene.activeCameras[0];
        this.gravityMap = dynTerr;
        // dynTerr.subToleranceX = 2;
        // dynTerr.subToleranceZ = 2;
        dynTerr.mesh.layerMask = Game.MAIN_RENDER_MASK;
        dynTerr.LODLimits = [1,2,2];
        dynTerr.mesh.material = multiMat;
        this.tmpVector = new Vector3();
        var forceVector = new Vector3(), self = this, forceLength = 0.0, forceLimit = 600 * GravityManager.GRAV_UNIT;
     
        dynTerr.refreshEveryFrame = true;
        dynTerr.useCustomVertexFunction = true;
        dynTerr.computeNormals = true;
        var whiteColor = Color4.FromColor3(Color3.White()), tmpColor = new Color4(1.0, 1.0, 1.0, 1.0);
        dynTerr.updateVertex = function(vertex, i, j) {
            forceVector.setAll(0);
            self.tmpVector.setAll(0);
            forceLength = 0;
            //tmpColor.set(1.0,1.0,1.0,1.0);
            vertex.color.set(1.0, 1.0, 1.0, 1.0);
            let heightMapIdx = 3*vertex.mapIndex + 1;
            
            for (var gidx = 0; gidx < self.gravWells.length; gidx++) {
                let gwA = self.gravWells[gidx];
                                
                self.computeGravitationalForceAtPointToRef(gwA, vertex.worldPosition, 1, self.tmpVector);                 
                forceVector.addInPlace(self.tmpVector);
            }

            forceLength = Scalar.Clamp(forceVector.length(), 1, forceLimit);        
            self.gravityMap.mapData[heightMapIdx] = -forceLength;
            var colorPerc = Scalar.RangeToPercent(forceLength, 0, forceLimit);
            Color4.LerpToRef(Color4.FromColor3(Color3.BlackReadOnly), whiteColor, colorPerc, tmpColor);
            vertex.color.r = 1.0 - colorPerc;
            vertex.color.g = 1.0 - colorPerc;
            vertex.color.b = 1.0 - colorPerc;

        };
        return dynTerr;
    }
    private applyGravitationalForceToShip(gravSource: IGravityContributor, ship: Ship): void {
        let sV = ship.velocity, gForce = ship.geForce, dTime = ship.mesh.getEngine().getDeltaTime()/1000;

        this.computeGravitationalForceAtPointToRef(gravSource, ship.position, .1, gForce);
        
       // gForce.y = 0; // ship should follow the terrain's height
        gForce.scaleInPlace(dTime);
        sV.addInPlace(gForce);
    }

    private generateHeightMap(options): any {
        let wsX = options.wsX, 
            wsZ = options.wsZ,
            gU = options.gU,  
            numberOfDivisionsX = options.mapSubX,
            numberOfDivisionsZ = options.mapSubZ,
            arrayLength = numberOfDivisionsX * numberOfDivisionsZ * 3;

        var mapData = new Float32Array(arrayLength);
        var colorData = new Float32Array(arrayLength);

        for (let l = 0; l < numberOfDivisionsZ; l++) {
            for (let w = 0; w < numberOfDivisionsX; w++) {
                let idx = 3 * (l * numberOfDivisionsX + w),
                idy = idx + 1,
                idz = idx + 2;
                mapData[idx] = (w - numberOfDivisionsX * 0.5) * gU;
                mapData[idy] = 0;
                mapData[idz] = (l - numberOfDivisionsZ * 0.5) * gU;
                var color = Color3.White();
                colorData[idx] = color.r;
                colorData[idy] = color.g;
                colorData[idz] = color.b;
            }
        }
        return { heightMap: mapData, colorMap: colorData};
    }

    
    
}