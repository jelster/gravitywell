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

    private static computeValuesFromSettingsData(gameData: GameData) : GameData {

        gameData.miniMapCameraPosition = new Vector3(0, gameData.gameHypotenuse, 0);
        gameData.miniMapMaxZ = 2 * gameData.gameHypotenuse;
        gameData.flyCamRelativePosition = new Vector3(0, 15, -15);
        gameData.flyCamMaxZ = gameData.gameWorldSizeX  / 2;
        gameData.skyBoxScale = gameData.gameWorldSizeX + (0.15 * gameData.gameWorldSizeX);

        gameData.starRadius = (gameData.starDensity / gameData.systemScaleFactor) * Math.sqrt(gameData.starMass);
        gameData.planetDensity = (0.00000921 / gameData.systemScaleFactor);
        gameData.upperOrbitalRadiiScale = 0.5 *  Math.floor(( gameData.gameWorldSizeX) / gameData.starRadius);

        gameData.initialShipPosition = new Vector3(gameData.gameWorldSizeX / 2.1, 0, 0);
        gameData.initialStarPosition = new Vector3(0, -gameData.starRadius, 0);

        return gameData;
    }
    public static create(settings = null): GameData {
        var gameData = new GameData();
        settings = settings || {};
        gameData.systemScaleFactor = settings.systemScaleFactor || 1;
        gameData.timeScaleFactor = settings.timeScaleFactor || 1000;
        gameData.gravUnit =  settings.gravUnit || 16;
        gameData.numberOfPlanets = settings.numberOfPlanets ?? 2;
        gameData.starMap = settings.starMap || [{ x: 0, y: 0 }];
        gameData.gameWorldSizeX = settings.gameWorldSizeX || 22400;
        gameData.gameWorldSizeY = settings.gameWorldSizeY || 22400;
        gameData.terrainSubCount = settings.terrainSubCount || 300;
        gameData.terrainScaleFactor = settings.terrainScaleFactor || 256;
        gameData.respawnTimeLimit = settings.respawnTimeLimit || 4000;
        gameData.starMass = settings.starMass || 1.963e15;
        gameData.starDensity = settings.starDensity || 0.0000125;
        gameData.lowerOrbitalRadiiScale = settings.lowerOrbitalRadiiScale || 8;
        gameData.lowerPlanetaryMassScale = settings.lowerPlanetaryMassScale || 0.01;
        gameData.upperPlanetaryMassScale = settings.upperPlanetaryMassScale || 0.25;
        gameData.shipMaxAcceleration = settings.shipMaxAccelleration || 50;
        gameData.shipMaxAngularVelocity = settings.shipMaxAngularVelocity || .15;

        return GameData.computeValuesFromSettingsData(gameData);
    }
}
