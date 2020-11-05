 
// TODO: load game data from TBD
import { Game } from './game';
import { UI } from './gravwell.ui';

import { GameData, IScenarioData } from './GameData';

import {version } from '../package.json';
import * as Data from '../default-gameData.json';
import { Scene } from '@babylonjs/core';


export class IndexPage {
    private _game: Game;
    private _scene: Scene;
    
    constructor() {
        document.title = 'GravWell - v' + version;
        this._game = this._createGame();

        this._scene = this._game.createScene();
        
        let gravGui = new UI(this._game, this._scene);
        this._game.initializeGame();
        
        gravGui.registerPlanetaryDisplays(this._game);
        this._scene.onAfterStepObservable.add(() => gravGui.updateControls(this._game.gameData.stateData));

        // Start render loop.
        this._game.doRender();
        
    }
    private _createGame(): Game {
        let scenario = {} as IScenarioData;
        Object.assign(scenario, Data);
        var instanceData = GameData.create(scenario);
        // Create the game using the 'renderCanvas'.
        let game = new Game('renderCanvas', instanceData);
        // Create the scene.
        
        return game;
    }
}
new IndexPage();


