 
// TODO: load game data from TBD
import { Game } from './game';
import { GameData, IScenarioData } from './GameData';
import {version } from '../package.json';
import * as Data from '../default-gameData.json';
import * as RaftWorld from '../raftWorld-gameData.json';

export class IndexPage {
    private _game: Game;
    private _renderCanvas: HTMLCanvasElement;

    constructor() {
        document.title = 'GravWell - v' + version;
        
        // TODO: rework the scenario loading, add list, selection capabilities
        let scenario = {} as IScenarioData;
        let specifiedScenario = window.location.hash || "default";
        if (specifiedScenario.toLowerCase().indexOf("raftworld") > 0) {
            Object.assign(scenario, RaftWorld);

        }
        else {
            Object.assign(scenario, Data);
        }
        console.log("scenario data loaded", scenario);
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


