import { Vector3, Scalar, _forceTransformFeedbackToBundle, Scene, Color3, Color4, StandardMaterial, Vector2, AlphaState } from '@babylonjs/core';
import { Game } from './game';
import { GameData } from "./GameData";
import { Ship } from './gravwell.ship';


import './babylon.dynamicTerrain';
import { DynamicTerrain } from './babylon.dynamicTerrain';
import { GridMaterial } from '@babylonjs/materials/grid';

export interface IGravityContributor {
    mass: number;
    radius: number;
    position: Vector3;
    escapeVelocity: number;
    gMu: number;

}

export class GravityManager {

    public static GRAV_UNIT: number;
    private readonly ZERO_VECTOR: Vector3 = Vector3.Zero();
    public static GRAV_CONST: number = 6.67259e-11;
    private _gameData: GameData;
    private _gravWells: Array<IGravityContributor>;
 
    private test2d: Vector2 = Vector2.Zero();
 
    private temp2d: Vector2 = Vector2.Zero();
    private _primaryStar: IGravityContributor;

    public get primaryStar():IGravityContributor {
        return this._primaryStar;
    }

    public set primaryStar(s: IGravityContributor) {
        this._primaryStar = s;
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
   
    public onUpdateShipStep(ship: Ship): void {
        let timeScale = this._gameData.timeScaleFactor;
        ship.geForce.setAll(0);
        let dS = this.computeGravGradientAt(ship.position, ship.geForce);

        if (ship.thrustersFiring === true) {
            ship.geForce.addInPlace(ship.mesh.forward.scale(ship.maxAcceleration));
            ship.thrustersFiring = false;
        }
        let dT = ship.mesh.getEngine().getDeltaTime()/timeScale,
            dV = ship.geForce;
        ship.geForce.y = 0;
        dV.scaleAndAddToRef(dT, ship.velocity);
        
    }

    public generateDynamicTerrain(scene: Scene): DynamicTerrain {
        let gU = this._gameData.gravUnit,  
            wsX = this._gameData.gameWorldSizeX,//gU * 12, 
            wsZ = this._gameData.gameWorldSizeY,//gU * 12,        
            numberOfDivisionsX = wsX / gU,
            numberOfDivisionsZ = wsZ / gU,
            numberOfTerrainTiles = this._gameData.terrainSubCount,
            terrainOpts = { 
                gU: gU, 
                wsX: wsX, 
                wsZ: wsZ, 
                mapSubX: numberOfDivisionsX, 
                mapSubZ: numberOfDivisionsZ,
                stellarEscapeVelocity: this.primaryStar.escapeVelocity,
                computeForces: true
            },
            maps = this.generateHeightMap(terrainOpts);
        console.log("height map generated:", { options: terrainOpts, numberOfTiles: numberOfTerrainTiles });
        var gridMat  = new GridMaterial("gridMat", scene);
        gridMat.gridRatio = gU;
        gridMat.lineColor = Color3.White();
        gridMat.mainColor = Color3.Black();   
        gridMat.minorUnitVisibility = 0.85;
        //gridMat.opacity = 0.8;
        gridMat.majorUnitFrequency = 1;
        //gridMat.alpha = 0.78;
        gridMat.alphaMode = 1;
                // this._gridMat = gridMat;
        
        var stdMat = new StandardMaterial("std", scene);
        stdMat.diffuseColor = Color3.Gray();
        stdMat.ambientColor = Color3.Gray();
        stdMat.emissiveColor = Color3.Gray();
        stdMat.alphaMode = 0;
        stdMat.wireframe = true;
        stdMat.disableLighting = true;
  
        //gridMat.needAlphaBlending = () => true;
       
            
       // this.heightMap = heightMap;
        var dynTerr = new DynamicTerrain("gravityHeightMap", {   
            mapData: maps.heightMap, 
            mapColors: maps.colorMap,        
            mapSubX: numberOfDivisionsX,
            mapSubZ: numberOfDivisionsZ,
            terrainSub: numberOfTerrainTiles
        }, scene);
        dynTerr.createUVMap();
        dynTerr.camera = scene.activeCameras[0];
        dynTerr.isAlwaysVisible = true;
        dynTerr.mesh.isPickable = false;
        
        this.gravityMap = dynTerr;
        dynTerr.subToleranceX = 1;
        dynTerr.subToleranceZ = 1;
        dynTerr.mesh.layerMask = Game.MAIN_RENDER_MASK;
        dynTerr.LODLimits =  [1, 1, 1, 2, 2];
       
        dynTerr.mesh.material = gridMat;
         
        let forceVector = new Vector3(), 
            self = this;
        dynTerr.refreshEveryFrame = true;
        dynTerr.useCustomVertexFunction = false;
        dynTerr.computeNormals = true;
        
        
        dynTerr.updateVertex = function(vertex) {
            let vertexColor: Color4 = vertex.color;
            // vertexColor.a = Scalar.Lerp(1, 0, 1/(vertex.lodX || 1));
            if (vertex.lodX >= 6 || vertex.lodZ >= 6) {
                vertexColor.a = 0;
                return;
            }
            
            forceVector.setAll(0);          
         
            
            let heightMapIdx = 3*vertex.mapIndex + 1;
            let gE = self.computeGravGradientAt(vertex.worldPosition, forceVector);
            forceVector.normalize();
            vertexColor.set(forceVector.x, forceVector.y, forceVector.z, 1.0);
            self.gravityMap.mapData[heightMapIdx] = self.applyScalingToHeightMap(gE);
           // vertexColor.set(forceVector.x/255, forceVector.y/255, forceVector.z/255, 1.0);           

        };
        return dynTerr;
    }

    public applyScalingToHeightMap(rawHeightValue: number) {
        return rawHeightValue * this._gameData.terrainScaleFactor;
    }
    

    private generateHeightMap(options): any {
        let 
            gU = options.gU,  
            numberOfDivisionsX = options.mapSubX,
            numberOfDivisionsZ = options.mapSubZ,
            arrayLength = numberOfDivisionsX * numberOfDivisionsZ * 3,
            systemGravMax = options.stellarEscapeVelocity,
            computeForces = options.computeForces || false,
            tmpVector = new Vector3(0,0,0);

        var mapData = new Float32Array(arrayLength);
        var colorData = new Float32Array(arrayLength);

        for (let l = 0; l < numberOfDivisionsZ; l++) {
            for (let w = 0; w < numberOfDivisionsX; w++) {
                let idx = 3 * (l * numberOfDivisionsX + w),
                idy = idx + 1,
                idz = idx + 2;
                mapData[idx] = (w - numberOfDivisionsX * 0.5) * gU;
                mapData[idy] = systemGravMax;
                mapData[idz] = (l - numberOfDivisionsZ * 0.5) * gU;
               
                if (computeForces === true) {
                    const vertWPos = tmpVector.set(mapData[idx], mapData[idy], mapData[idz]);
                    let gf = this.computeGravGradientAt(vertWPos, tmpVector);
                    mapData[idy] = this.applyScalingToHeightMap(gf);

                    var color = new Color3(tmpVector.x/gf, tmpVector.y/gf, tmpVector.z/gf);
                    colorData[idx] = color.r;
                    colorData[idy] = color.g;
                    colorData[idz] = color.b;
                }
            }
        }
        return { heightMap: mapData, colorMap: colorData};
    }

    private computeGravGradientAt(vwpos: Vector3, summedVecRef:Vector3 = null): number {
        const gravSources = this._gravWells;
        let resV = 0;
        let test2d = this.test2d;
        let temp2d = this.temp2d;

        
        test2d.set(vwpos.x, vwpos.z);
        
        for (var gidx = 0; gidx < gravSources.length; gidx++) {
            temp2d.set(0,0);
            let gwA = gravSources[gidx];
            temp2d.set(gwA.position.x, gwA.position.z);
            let direction = temp2d.subtract(test2d);
            let dCenter = Vector2.Distance(temp2d, test2d);
        //    let distanceSquared = direction.lengthSquared();
           // let magnitude = -(gwA.gMu / distanceSquared);
            let vEsc = -GravityManager.computeEscapeVelocity(gwA, dCenter);
            resV = resV + vEsc;
            if (summedVecRef !== null) {
                direction.normalize();
                summedVecRef.addInPlaceFromFloats(direction.x, 0, direction.y);
            }
            
        }
        return resV;
    }

    
    public static computeEscapeVelocity(gravSource, distance = 0): number {
         
        if (!distance || distance < gravSource.radius || distance <= 0) {
            distance = gravSource.radius;
        }
        let twoGM = 2 * gravSource.gMu;
        let vEscape = Math.sqrt(twoGM / distance);
        return vEscape;
    }

    
    
}