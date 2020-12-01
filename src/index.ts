 
// TODO: load game data from TBD
import { Game } from './game';
import { GameData, IScenarioData } from './GameData';
import {version } from '../package.json';
import * as Data from '../default-gameData.json';

export class IndexPage {
    private _game: Game;
    private _renderCanvas: HTMLCanvasElement;

    constructor() {
        document.title = 'GravWell - v' + version;
        let scenario = {} as IScenarioData;
        Object.assign(scenario, Data);
        var instanceData = GameData.create(scenario);
        // Create the game using the 'renderCanvas'.

        this._renderCanvas = document.createElement("canvas");
        this._renderCanvas.id = 'renderCanvas';
        this._renderCanvas.style.height = '100%';
        this._renderCanvas.style.width = '100%';
        document.body.appendChild(this._renderCanvas);
        this._game  = new Game(this._renderCanvas, instanceData);
        
        
    }
}
new IndexPage();


