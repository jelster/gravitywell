import { Vector3 } from '@babylonjs/core';

export interface IScenarioData {
    numberOfPlanets: number;
    gameWorldSizeX: number;
    gameWorldSizeY: number;
    gravUnit: number;
    respawnTimeLimit: number;
    starMass: number;
    planetDensity: number;
    starDensity: number;
    lowerOrbitalRadiiScale: number;
    upperOrbitalRadiiScale: number;
    lowerPlanetaryMassScale: number;
    upperPlanetaryMassScale: number;
    initialShipPosition: Vector3;
    initialStarPosition: Vector3;
    systemScaleFactor: number;
    terrainSubCount: number;
    terrainScaleFactor: number;
    timeScaleFactor: number;
    shipMaxAngularVelocity: number;
    shipMaxAcceleration: number;
}

export interface IGameStateData {
    isPaused: boolean;
    isStarted: boolean;
    startTime: Date;
    lastUpdate: Date;
    lastShipVelocity: Vector3;
    lastShipGeForce: Vector3;
}
export class GameState implements IGameStateData {
    isPaused: boolean;
    isStarted: boolean;
    startTime: Date;
    lastUpdate: Date;
    lastShipVelocity: Vector3 = Vector3.Zero();
    lastShipGeForce: Vector3 = Vector3.Zero();
    
}

export class GameData implements IScenarioData {
    public get gameHypotenuse(): number {
        return Math.sqrt((Math.pow(this.gameWorldSizeX, 2) + Math.pow(this.gameWorldSizeY, 2)));
    }

    public numberOfPlanets: number;
    public gameWorldSizeX: number;
    public gameWorldSizeY: number;
    public gravUnit: number = 64;
    public respawnTimeLimit: number;
    public starMass: number;

    public initialShipPosition: Vector3;
    public planetDensity: number;
    public starDensity: number;

    public lowerOrbitalRadiiScale: number;
    public lowerPlanetaryMassScale: number;
    public upperPlanetaryMassScale: number;
    public systemScaleFactor: number;
    public terrainSubCount: number;
    public terrainScaleFactor: number;
    public timeScaleFactor: number;
    public shipMaxAngularVelocity: number;
    public shipMaxAcceleration: number;

    public miniMapMaxZ: number;
    public miniMapCameraPosition: Vector3;
    public flyCamRelativePosition: Vector3;
    public flyCamMaxZ: number;
    public skyBoxScale: number;
    public starRadius: number;
    public upperOrbitalRadiiScale: number;
    public initialStarPosition: Vector3;

    public stateData: IGameStateData;

    public isPaused(): boolean { return this.stateData.isPaused; };
    public isStarted(): boolean { return this.stateData.isStarted ?? false; };
    public startTime(): Date { return this.stateData.startTime; };
    public lastUpdate(): Date { return this.stateData.lastUpdate; };
    public lastShipVelocity(): Vector3 { return this.stateData.lastShipVelocity ?? Vector3.Zero(); };
    public lastShipGeForce(): Vector3 { return this.stateData.lastShipGeForce ?? Vector3.Zero(); };

    private computeValuesFromSettingsData(scenarioData: IScenarioData): GameData {
        const gameHypotenuse = this.gameHypotenuse;
        this.miniMapCameraPosition = new Vector3(0, gameHypotenuse, 0);
        this.miniMapMaxZ = 2 * gameHypotenuse;
        this.flyCamRelativePosition = new Vector3(0, 15, -15);
        this.flyCamMaxZ = scenarioData.gameWorldSizeX / 2;
        this.skyBoxScale = scenarioData.gameWorldSizeX + (0.15 * scenarioData.gameWorldSizeX);
        this.starRadius = (scenarioData.starDensity / scenarioData.systemScaleFactor) * Math.sqrt(scenarioData.starMass);
        this.planetDensity = (0.00000921 / scenarioData.systemScaleFactor);
        this.upperOrbitalRadiiScale = 0.5 * Math.floor((scenarioData.gameWorldSizeX) / this.starRadius);

        this.initialShipPosition = scenarioData.initialShipPosition || new Vector3(scenarioData.gameWorldSizeX / 2.1, 0, 0);
        this.initialStarPosition = scenarioData.initialStarPosition || new Vector3(0, -this.starRadius, 0);

        return this;
    }
    public static create(settings?: IScenarioData, gameState?: IGameStateData): GameData {
        var gameData = new GameData();
        settings = settings || {} as IScenarioData;
        gameData.systemScaleFactor = settings.systemScaleFactor || 1;
        gameData.timeScaleFactor = settings.timeScaleFactor || 1000;
        gameData.gravUnit = settings.gravUnit || 16;
        gameData.numberOfPlanets = settings.numberOfPlanets ?? 2;
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
        gameData.shipMaxAcceleration = settings.shipMaxAcceleration || 50;
        gameData.shipMaxAngularVelocity = settings.shipMaxAngularVelocity || .15;

        gameData.computeValuesFromSettingsData(settings);
        gameData.stateData = gameState || new GameState();

        return gameData;
    }
}
