
// TODO: load game data from TBD
import { Game } from './game';
import { UI } from './gravwell.ui';
import { Vector3, SceneOptimizer } from '@babylonjs/core';
window.addEventListener("DOMContentLoaded", () => {
   var defaults = GameData.createDefault();
    // Create the game using the 'renderCanvas'.
    let game = new Game('renderCanvas', defaults);    
    // Create the scene.
    var scene = game.createScene();
    let gravGui = new UI(game);
  //  var optimizer = SceneOptimizer.OptimizeAsync(scene);
    // Start render loop.
    game.doRender();
});
export class Point {
    public x: number;
    public y: number;
}
export class GameData {
    public starMap: Array<Point>;
    public numberOfPlanets: number;
    public gameWorldSizeX: number;
    public gameWorldSizeY: number;
    public gravUnit: number;
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
    public lowerOrbitalRadiiScale: number;
    public upperOrbitalRadiiScale: number;
    public lowerPlanetaryMassScale: number;
    public upperPlanetaryMassScale: number;
    
    public static createDefault(): GameData {
        var gameData = new GameData();
        gameData.gravUnit = 64;
        gameData.numberOfPlanets = 3;
        gameData.starMap = [ { x: 0, y: 0}];
        gameData.gameWorldSizeX = gameData.gravUnit * 200;
        gameData.gameWorldSizeY = gameData.gravUnit * 200;
        
        gameData.respawnTimeLimit = 4000;
        
        gameData.starMass = 1.9181e15/36;
        var gameHypotenuse = Math.sqrt((Math.pow(gameData.gameWorldSizeX, 2) + Math.pow(gameData.gameWorldSizeY, 2)));
        gameData.miniMapCameraPosition = new Vector3(0, gameHypotenuse, 0);
        gameData.miniMapMaxZ =gameHypotenuse;
        
        gameData.flyCamRelativePosition = new Vector3(0, 10, -12);
        gameData.flyCamMaxZ =  Math.sqrt(Math.pow(gameData.gameWorldSizeX, 2) + Math.pow(gameData.gameWorldSizeY, 2))/2;
        
        gameData.skyBoxScale = gameData.gameWorldSizeX + (0.15 * gameData.gameWorldSizeX);

        gameData.initialShipPosition = new Vector3(-gameData.gameWorldSizeX/2 + gameData.gravUnit, 0, 0);

        gameData.planetDensity = (0.000991/36);
        gameData.lowerOrbitalRadiiScale = 15;
        gameData.upperOrbitalRadiiScale = 40;
        gameData.lowerPlanetaryMassScale = 0.1;
        gameData.upperPlanetaryMassScale = 0.5;
        return gameData;
    }

   

}
