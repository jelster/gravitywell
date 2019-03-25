
// TODO: load game data from TBD
import { Game } from './game';
import { UI } from './gravwell.ui';
import { Vector3 } from '@babylonjs/core';
window.addEventListener("DOMContentLoaded", () => {
   var defaults = GameData.createDefault();
    // Create the game using the 'renderCanvas'.
    let game = new Game('renderCanvas', defaults);    
    // Create the scene.
    game.createScene();
    let gravGui = new UI(game);
    // Start render loop.
    game.doRender();
});
export class Point {
    public x: number;
    public y: number;
}
export class GameData {
    public static createDefault(): GameData {
        var gameData = new GameData();
        gameData.numberOfPlanets = 4;
        gameData.starMap = [ { x: 0, y: 0}];
        gameData.gameWorldSizeX = 16000;
        gameData.gameWorldSizeY = 16000;
        
        gameData.respawnTimeLimit = 4000;
        gameData.gravUnit = 64;
        gameData.starMass = 9e7;

        gameData.miniMapCameraPosition = new Vector3(0, gameData.gameWorldSizeX, 0);
        gameData.miniMapMaxZ = Math.sqrt((Math.pow(gameData.gameWorldSizeX, 2) + Math.pow(gameData.gameWorldSizeY, 2)));
        
        gameData.flyCamRelativePosition = new Vector3(0, 120, -200);
        gameData.flyCamMaxZ =  Math.sqrt(Math.pow(gameData.gameWorldSizeX, 2) + Math.pow(gameData.gameWorldSizeY, 2))/2;
        
        gameData.skyBoxScale = 15360;

        gameData.initialShipPosition = new Vector3(-gameData.gameWorldSizeX / 2, 0, 64);
        return gameData;
    }

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

}
