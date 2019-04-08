import { Vector3 } from '@babylonjs/core';
import { Point } from './index';
export class GameData {
    public get gameHypotenuse() : number {
        return Math.sqrt((Math.pow(this.gameWorldSizeX, 2) + Math.pow(this.gameWorldSizeY, 2)));
    }
    public starMap: Array<Point>;
    public numberOfPlanets: number;
    public gameWorldSizeX: number;
    public gameWorldSizeY: number;
    public gravUnit: number = 64;
    public respawnTimeLimit: number;
    public starMass: number;
    public miniMapMaxZ: number;
    public miniMapCameraPosition: Vector3;
    public flyCamRelativePosition: Vector3;
    public flyCamMaxZ: number;
    public skyBoxScale: number;
    public initialShipPosition: Vector3;
    public planetDensity: number;
    public starDensity: number;
    public starRadius: number;
    public initialStarPosition: Vector3;
    public lowerOrbitalRadiiScale: number;
    public upperOrbitalRadiiScale: number;
    public lowerPlanetaryMassScale: number;
    public upperPlanetaryMassScale: number;
    public isStarted: boolean = false;
    public startTime: Date;
    public lastUpdate: Date;
    public lastShipVelocity: Vector3 = new Vector3();
    public lastShipGeForce: Vector3 = new Vector3();
    public systemScaleFactor: number;
    public terrainSubCount: number;
    public terrainScaleFactor: number;
    public timeScaleFactor: number;
    public shipMaxAngularVelocity: number;
    public shipMaxAcceleration: number;

    public static createDefault(): GameData {
        var gameData = new GameData();
        gameData.systemScaleFactor = 36;
        gameData.timeScaleFactor = 1000;
        gameData.gravUnit = 64;
        gameData.numberOfPlanets = 3;
        gameData.starMap = [{ x: 0, y: 0 }];
        gameData.gameWorldSizeX = gameData.gravUnit * 240;
        gameData.gameWorldSizeY = gameData.gravUnit * 240;
        gameData.terrainSubCount = 240;
        gameData.terrainScaleFactor = 1.5;
        gameData.respawnTimeLimit = 4000;
        
        gameData.miniMapCameraPosition = new Vector3(0, gameData.gameHypotenuse, 0);
        gameData.miniMapMaxZ = 1.5 * gameData.gameHypotenuse;
        gameData.flyCamRelativePosition = new Vector3(0, 10, -12);
        gameData.flyCamMaxZ = gameData.gameHypotenuse * 0.467;
        gameData.skyBoxScale = gameData.gameWorldSizeX + (0.15 * gameData.gameWorldSizeX);
        
        gameData.starMass = 4.9181e17 / gameData.systemScaleFactor;
        gameData.starDensity = 0.000225;
        gameData.starRadius = (gameData.starDensity / gameData.systemScaleFactor) * Math.sqrt(gameData.starMass);
        gameData.planetDensity = (0.000241 / gameData.systemScaleFactor);
        gameData.lowerOrbitalRadiiScale = 3;
        gameData.upperOrbitalRadiiScale = 10;
        gameData.lowerPlanetaryMassScale = 0.1;
        gameData.upperPlanetaryMassScale = 0.5;

        gameData.initialShipPosition = new Vector3(gameData.gameWorldSizeX / 2 + gameData.gravUnit, 0, 0);
        gameData.initialStarPosition = new Vector3(0, -gameData.starRadius, 0);
        gameData.shipMaxAcceleration = 20;
        gameData.shipMaxAngularVelocity = 0.1;

        return gameData;
    }
}