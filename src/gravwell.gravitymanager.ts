import { FloatArray, Vector3, DebugLayer, Logger, Scalar, _forceTransformFeedbackToBundle, Scene, Color3, Color4, StandardMaterial, MultiMaterial, MaterialFlags, Vector2 } from '@babylonjs/core';
import { Game } from './game';
import { GameData } from "./GameData";
import { Ship } from './gravwell.ship';
import { GridMaterial } from '@babylonjs/materials/grid';
import { MaterialAlphaMode } from 'babylonjs-gltf2interface';
import { DynamicTerrain } from './babylon.dynamicTerrain';

export interface IGravityContributor {
    mass: number;
    radius: number;
    position: Vector3;
    surfaceGravity: number;
}

export class GravityManager {

    public static GRAV_UNIT: number;
    private readonly ZERO_VECTOR: Vector3 = Vector3.Zero();
    public static GRAV_CONST: number = 6.67259e-11;
    private _gameData: GameData;
    private _gravWells: Array<IGravityContributor>;
    private tmpVector: Vector3;
    private _gridMat: GridMaterial;

    public get gridMat(): GridMaterial {
        return this._gridMat;
    }
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

    public computeGravitationalForceAtPointToRef(gravSource: IGravityContributor, testPoint: Vector3, testMass?: number, resultVector: Vector3 = Vector3.Zero(), overwriteYPos: boolean = true): Vector3 {
        resultVector.setAll(0);
        
        let dCenter = Vector3.Distance(testPoint, gravSource.position);        
        if (dCenter <= gravSource.radius) {             
            resultVector.y = gravSource.position.y;
            return resultVector; 
        }
        //testPoint.y = gravSource.position.y;
        if (overwriteYPos) {
            testPoint.y = 0;   

        }
        testPoint.subtractToRef(gravSource.position, resultVector);        
        resultVector.normalize();
        let G = GravityManager.GRAV_CONST,
            rsq = Math.pow(dCenter, 2),
            m1 = testMass || 1,
            m2 = gravSource.mass || 100;

        let f = -((G * m1 * m2) / rsq);                
        return resultVector.scaleInPlace(f);
    }
    public onUpdateShipStep(ship: Ship): void {
        
        let self = this,
            timeScale = this._gameData.timeScaleFactor;

        //const terrHeight = self.gravityMap.getHeightFromMap(ship.position.x, ship.position.z, ship);
        ship.geForce.setAll(0);

       // ship.geForce.scaleInPlace(terrHeight);
        
        self.gravWells.forEach(gravWell => {
            self.applyGravitationalForceToShip(gravWell, ship);
        });

        //ship.geForce.y = terrHeight;
        if (ship.thrustersFiring === true) {
            ship.geForce.addInPlace(ship.mesh.forward.scale(ship.maxAcceleration));
            ship.thrustersFiring = false;
        }
        let dT = ship.mesh.getEngine().getDeltaTime() / timeScale,
            dV = ship.geForce;
       // dV.scaleInPlace(dT);
        //ship.geForce.y = 0;
        dV.scaleAndAddToRef(dT, ship.velocity);

    }

    public generateDynamicTerrain(scene: Scene): DynamicTerrain {
        let gU = this._gameData.gravUnit,
            wsX = this._gameData.gameWorldSizeX,//gU * 12, 
            wsZ = this._gameData.gameWorldSizeY,//gU * 12,        
            numberOfDivisionsX = wsX / gU,
            numberOfDivisionsZ = wsZ / gU,
            numberOfTerrainTiles = this._gameData.terrainSubCount,
            terrainGravScaleFactor = this._gameData.terrainScaleFactor,
            maps = this.generateHeightMap({ gU: gU, wsX: wsX, wsZ: wsZ, mapSubX: numberOfDivisionsX, mapSubZ: numberOfDivisionsZ });

        var gridMat = new GridMaterial("gridMat", scene);
        gridMat.gridRatio = gU;
        gridMat.lineColor = Color3.White();
        gridMat.mainColor = Color3.Black();
        gridMat.minorUnitVisibility = 0.85;
        gridMat.opacity = 1.0;
        gridMat.majorUnitFrequency = 100;
        //gridMat.alpha = 0.78;
        //gridMat.alphaMode = 1;
        this._gridMat = gridMat;

        
        //gridMat.needAlphaBlending = () => true;


        this.heightMap = maps.heightMap;
        var dynTerr = new DynamicTerrain("gravityHeightMap", {
            mapData: maps.heightMap,
            mapColors: maps.colorMap,
            mapSubX: numberOfDivisionsX,
            mapSubZ: numberOfDivisionsZ,
            terrainSub: numberOfTerrainTiles
        }, scene);
        this.gravityMap = dynTerr;
        dynTerr.createUVMap();
        dynTerr.refreshEveryFrame = true;
        dynTerr.useCustomVertexFunction = false;
        dynTerr.computeNormals = true;        
        dynTerr.subToleranceX = 1;
        dynTerr.subToleranceZ = 1;
        dynTerr.LODLimits = [1, 1, 1, 2];
        dynTerr.camera = scene.activeCameras[0];
        dynTerr.isAlwaysVisible = true;

        dynTerr.mesh.layerMask = Game.MAIN_RENDER_MASK;       
        dynTerr.mesh.material = gridMat;
        dynTerr.mesh.isPickable = false;

        dynTerr.update(false);


        this.tmpVector = new Vector3();
        var forceVector = new Vector3(),
            self = this,
            forceLength = 0.0,
            forceMinimum = 1/gU,
            forceLimit = 100000 * GravityManager.GRAV_UNIT;

        
        var baseColor = Color4.FromColor3(Color3.Blue()),
            tmpColor = new Color4(1.0, 1.0, 1.0, 1.0),
            endColor = Color4.FromColor3(Color3.Red()),
            maxForceEncountered = 0.0;
        dynTerr.updateVertex = function (vertex, i, j) {
            if (vertex.lodX >= 6 || vertex.lodZ >= 6 || vertex.lodY >= 6) {
                return;
            }
            forceVector.setAll(0);
            self.tmpVector.setAll(0);
            forceLength = 0;
            tmpColor.set(1.0, 1.0, 1.0, 1.0);
            vertex.color.set(1.0, 1.0, 1.0, 1.0);
            let heightMapIdx = 3 * vertex.mapIndex + 1;

            for (var gidx = 0; gidx < self.gravWells.length; gidx++) {
                let gwA = self.gravWells[gidx];

                self.computeGravitationalForceAtPointToRef(gwA, vertex.worldPosition, 1, self.tmpVector);
                forceVector.addInPlace(self.tmpVector);
            }

            forceLength = Scalar.Clamp(forceVector.length(), forceMinimum, forceLimit);
            if (forceLength > maxForceEncountered) {
                maxForceEncountered = forceLength;
            }
            self.gravityMap.mapData[heightMapIdx] = -(forceLength * terrainGravScaleFactor);
            var colorPerc = Scalar.RangeToPercent(Math.log(forceLength)-1, 0, Math.log(maxForceEncountered)+1);
            Color4.LerpToRef(baseColor, endColor, colorPerc, tmpColor);
            vertex.color.set(tmpColor.r, tmpColor.g, tmpColor.b, tmpColor.a);

        };
        return dynTerr;
    }
    private applyGravitationalForceToShip(gravSource: IGravityContributor, ship: Ship): void {
        let sV = ship.velocity,
            gForce = ship.geForce,
            tScale = this._gameData.timeScaleFactor,
            dTime = ship.mesh.getEngine().getDeltaTime() / tScale;

        this.computeGravitationalForceAtPointToRef(gravSource, ship.position, 1, gForce, false);

        //gForce.y = 0; // ship should follow the terrain's height
        gForce.scaleInPlace(dTime);

    }

    private generateHeightMap(options): any {
        let
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
        return { heightMap: mapData, colorMap: colorData };
    }



}