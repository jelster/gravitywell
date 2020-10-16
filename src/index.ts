 
// TODO: load game data from TBD
import { Game } from './game';
import { UI } from './gravwell.ui';

import { GameData, IScenarioData } from './GameData';

import {version } from '../package.json';
import * as Data from '../default-gameData.json';
window.addEventListener("DOMContentLoaded", () => {

    document.title = 'GravWell - v' + version;
    var game = GravityWellGameManager.createGame();

});

export class GravityWellGameManager {
    public static createGame(): Game {
        let scenario = {} as IScenarioData;
        Object.assign(scenario, Data);
        var instanceData = GameData.create(scenario);
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


