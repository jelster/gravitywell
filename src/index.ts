 
// TODO: load game data from TBD
import { Game } from './game';
import { UI } from './gravwell.ui';

import { GameData } from './GameData';

import {version } from '../package.json';
import * as Data from '../default-gameData.json';
window.addEventListener("DOMContentLoaded", () => {

    document.title = 'GravWell - v' + version;
    var game = GravityWellGameManager.createGame();

});

export class Point {
    public x: number;
    public y: number;
}
export class GravityWellGameManager {
    public static createGame(): Game {
        var instanceData = GameData.create(Data);
        // Create the game using the 'renderCanvas'.
        let game = new Game('renderCanvas', instanceData);
        // Create the scene.
        var scene = game.createScene();
        let gravGui = new UI(game, scene);
        game.initializeGame();
        gravGui.registerPlanetaryDisplays(game);
        scene.onAfterStepObservable.add(() => gravGui.updateControls(game));

        // Start render loop.
        game.doRender();
        
        return game;
    }
}


