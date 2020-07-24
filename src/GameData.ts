import { Vector3 } from '@babylonjs/core';
import { Point } from './index';
export class GameData {
   
    public get gameHypotenuse(): number {
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

    public skyboxImagePath: string = "../textures/Space/space";
    public explosionTexturePath: string = "../textures/explosion-3.png"

    public static createDefault(): GameData {
        var gameData = new GameData();
        gameData.systemScaleFactor = 30000000;
        gameData.timeScaleFactor = 1000;
        gameData.gravUnit = 64;

        gameData.starMass = 1.9885e30 / gameData.systemScaleFactor; // 1 solar mass = 1.9885e30kg
        gameData.starDensity = 1.0e9; // / gameData.systemScaleFactor; // units: kg/m^3
        
        var vol = (gameData.starMass / gameData.starDensity) / ((4/3)*Math.PI);
        var r = Math.cbrt(vol);
        gameData.starRadius = r;
        //gameData.starRadius = (696342000 * 0.009)  * (1 / Math.sqrt(gameData.systemScaleFactor)); // solar radius, meters: 696342000 // / gameData.systemScaleFactor;
        gameData.planetDensity = 500000;// / gameData.systemScaleFactor; // ~5000 kg/m^3 avg earth density
        gameData.lowerOrbitalRadiiScale = 5;// 75 - ratio of solar radii:orbital radii 75; // inside orbit of mercury
        gameData.upperOrbitalRadiiScale = 15;// / gameData.systemScaleFactor; // a bit outside of jupiter
        gameData.lowerPlanetaryMassScale = 3.0e-5; //gameData.starMass * 3.0032e-6;
        gameData.upperPlanetaryMassScale = 9.0e-4; //gameData.starMass * 9.5459e-4;

        gameData.numberOfPlanets = 0;
        gameData.starMap = [{ x: 0, y: 0 }];
        gameData.terrainSubCount = 128;
        var gravStd = gameData.gravUnit * gameData.terrainSubCount;
        gameData.gameWorldSizeX =  gravStd * (Math.ceil((gameData.upperOrbitalRadiiScale * gameData.starRadius / gravStd)));
        gameData.gameWorldSizeY = gameData.gameWorldSizeX;//gameData.gravUnit * gameData.terrainSubCount;

        gameData.terrainScaleFactor = 1.0;
        gameData.respawnTimeLimit = 4000;

        gameData.miniMapCameraPosition = new Vector3(0, gameData.gameWorldSizeX, 0);
        gameData.miniMapMaxZ = gameData.miniMapCameraPosition.y * 50;
        gameData.flyCamRelativePosition = new Vector3(0, 500, -1200);
        gameData.flyCamMaxZ = gameData.gameHypotenuse * 0.267;
        gameData.skyBoxScale = gameData.gameWorldSizeX * 10;


        gameData.initialShipPosition = new Vector3(gameData.starRadius * 10, 0, 0);
        gameData.initialStarPosition = new Vector3(0, 0, 0); // 274 m/s^2 == sol gravity
        gameData.shipMaxAcceleration = 50;
        gameData.shipMaxAngularVelocity = 0.1;

        return gameData;
    }
}

//-274 = 1.9885e30 / r^2
