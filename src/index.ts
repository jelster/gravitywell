
// TODO: load game data from TBD
import { Game } from './game';
import { UI } from './gravwell.ui';
import { SceneOptimizer, SceneOptimizerOptions } from '@babylonjs/core';
import { GameData } from './GameData';

window.addEventListener("DOMContentLoaded", () => {

   var game = GravityWellGameManager.createGame();

});

export class Point {
    public x: number;
    public y: number;
}
export class GravityWellGameManager {
    public static createGame(): Game {
        var instanceData = GameData.createDefault();
        // Create the game using the 'renderCanvas'.
        let game = new Game('renderCanvas', instanceData);
        // Create the scene.
        var scene = game.createScene();
        let gravGui = new UI(game, scene);
        game.initializeGame();
        gravGui.registerPlanetaryDisplays(game);
        scene.onAfterStepObservable.add(() => gravGui.updateControls(game));
        //var optimizer = SceneOptimizer.OptimizeAsync(scene, SceneOptimizerOptions.HighDegradationAllowed(60));
        
       // optimizer.onNewOptimizationAppliedObservable.add((ev) => console.log(ev));
        
        // Start render loop.
        game.doRender();
        
        return game;
    }
}


