import { FloatArray, Vector3, DebugLayer, Logger, Scalar, _forceTransformFeedbackToBundle, Scene, Color3, Color4, StandardMaterial, MultiMaterial, MaterialFlags, Vector2, int } from '@babylonjs/core';
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

        if (overwriteYPos) {
            //testPoint.y = 0;
            testPoint.y = gravSource.position.y;// - gravSource.radius;
        }
        let dCenter = Vector3.Distance(testPoint, gravSource.position);
        if (dCenter <= (Math.ceil(gravSource.radius / GravityManager.GRAV_UNIT) * GravityManager.GRAV_UNIT)) {
            resultVector.y = gravSource.position.y;
            return resultVector;
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
        let self = this,
            gU = this._gameData.gravUnit,
            wsX = this._gameData.gameWorldSizeX,//gU * 12, 
            wsZ = this._gameData.gameWorldSizeY,//gU * 12,        
            numberOfDivisionsX = wsX / gU,
            numberOfDivisionsZ = wsZ / gU,
            numberOfTerrainTiles = this._gameData.terrainSubCount,
            terrainGravScaleFactor = this._gameData.terrainScaleFactor,
            maps = this.generateHeightMap({ gU: gU, wsX: wsX, wsZ: wsZ, mapSubX: numberOfDivisionsX, mapSubZ: numberOfDivisionsZ });

        var gridMat = new GridMaterial("gridMat", scene);
        gridMat.gridRatio = gU * 2;
        gridMat.lineColor = Color3.White();
        gridMat.mainColor = Color3.Black();
        gridMat.minorUnitVisibility = 0.85;
        gridMat.opacity = 1.0;
        gridMat.majorUnitFrequency = 1;
        //gridMat.alpha = 0.78;
        //gridMat.alphaMode = 1;
        this._gridMat = gridMat;


        //gridMat.needAlphaBlending = () => true;



        var dynTerr = new DynamicTerrain("gravityHeightMap", {
            mapData: maps.heightMap,
            mapColors: maps.colorMap,
            mapSubX: numberOfDivisionsX,
            mapSubZ: numberOfDivisionsZ,
            terrainSub: numberOfTerrainTiles
        }, scene);
        this.gravityMap = dynTerr;
        this.heightMap = dynTerr.mapData as Float32Array;
        dynTerr.createUVMap();
        dynTerr.refreshEveryFrame = true;
        dynTerr.useCustomVertexFunction = false;
        dynTerr.computeNormals = true;
        dynTerr.subToleranceX = 1;
        dynTerr.subToleranceZ = 1;
        //   dynTerr.LODLimits = [1, 2, 2, 4, 4, 4];
        dynTerr.camera = scene.activeCameras[0];
        dynTerr.isAlwaysVisible = false;

        dynTerr.mesh.layerMask = Game.MAIN_RENDER_MASK;
        dynTerr.mesh.material = gridMat;
        dynTerr.mesh.isPickable = false;

        dynTerr.updateCameraLOD = function (terrainCamera) {
            //let terrAlt = dynTerr.getHeightFromMap(terrainCamera.globalPosition.x, terrainCamera.globalPosition.z);
            let camAlt = terrainCamera.globalPosition.y;
            let camLOD = Math.floor(Math.abs(camAlt / (gU * 1.5))) || 0;
            return camLOD;
        }
        dynTerr.update(false);


        this.tmpVector = new Vector3();

        dynTerr.updateVertex = function (v, i, j) {
            self.updateHeightMapVertice(v, i, j);
        };
        return dynTerr;
    }
    maxForce = 0.0;
    public onUpdateTerrain() {
        let forceVector = new Vector3(),
            tmpVector = this.tmpVector,
            posVector = new Vector3(),
            forceLength = 0.0;

        const forceMinimum = 1 / GravityManager.GRAV_UNIT,
            forceLimit = 10000 * GravityManager.GRAV_UNIT;


        let baseColor = Color4.FromColor3(Color3.Blue()),
            tmpColor = new Color4(1.0, 1.0, 1.0, 1.0),
            endColor = Color4.FromColor3(Color3.Red()),
            maxForceEncountered = 0.0;
        // if (vertex.lodX >= 6 || vertex.lodZ >= 6) {
        //     return;
        // }

        for (let indexL = 0; indexL < this.gravityMap.mapData.length; indexL += 9) {
            forceVector.setAll(0);
            tmpVector.setAll(0);
            forceLength = 0;

            const posX = this.gravityMap.mapData[indexL];
            const posZ = this.gravityMap.mapData[indexL + 2];
            const posYIdx = indexL + 3;

            posVector.set(posX, 0, posZ);

            for (var gidx = 0; gidx < this.gravWells.length; gidx++) {
                let gwA = this.gravWells[gidx];

                this.computeGravitationalForceAtPointToRef(gwA, posVector, 1, tmpVector);
                forceVector.addInPlace(tmpVector);
            }
            forceLength = Scalar.Clamp(forceVector.length(), forceMinimum, forceLimit);
            this.gravityMap.mapData[posYIdx] = -forceLength;
        }


    }
    private updateHeightMapVertice(vertex: { position: Vector3, lodX: int, lodZ: int, worldPosition: Vector3, mapIndex: int, color: Color4 }, i: int, j: int) {

        let forceVector = new Vector3(),
            forceLength = 0.0,
            forceMinimum = 0.01,
            forceLimit = 10000 * GravityManager.GRAV_UNIT;
        
        vertex.color.set(1.0, 1.0, 1.0, 1.0);
        let heightMapIdx = 3 * vertex.mapIndex + 1;

        for (var gidx = 0; gidx < this.gravWells.length; gidx++) {
            const gwA = this.gravWells[gidx];
            let vwp = vertex.worldPosition;
            vwp.y = 0;
            this.computeGravitationalForceAtPointToRef(gwA, vwp, 1, this.tmpVector);
            //this.tmpVector.y = 0;
            forceVector.addInPlace(this.tmpVector);
        }

        forceLength = Scalar.Clamp(forceVector.length(), forceMinimum, forceLimit);
        if (forceLength > this.maxForce) {
            this.maxForce = forceLength;
        }
        this.gravityMap.mapData[heightMapIdx] = -forceLength;//-(forceLength * terrainGravScaleFactor);
        var colorPerc = Scalar.RangeToPercent(forceLength, 0, this.maxForce);
        Color4.LerpToRef(Color4.FromColor3(Color3.Blue(), 1.0), Color4.FromColor3(Color3.Red(), 1.0), colorPerc, vertex.color);
        

    };

    private applyGravitationalForceToShip(gravSource: IGravityContributor, ship: Ship): void {
        let sV = ship.velocity,
            gForce = ship.geForce,
            tScale = this._gameData.timeScaleFactor,
            dTime = ship.mesh.getEngine().getDeltaTime() / tScale;

        this.computeGravitationalForceAtPointToRef(gravSource, ship.position, 1, gForce, false);

        gForce.y = 0; // ship should follow the terrain's height
        //gForce.scaleInPlace(dTime);

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