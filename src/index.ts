
// TODO: load game data from TBD
import { Game } from './game';
import { UI } from './gravwell.ui';
window.addEventListener("DOMContentLoaded", () => {
    // Create the game using the 'renderCanvas'.
    let game = new Game('renderCanvas');    
    // Create the scene.
    game.createScene();
    let gravGui = new UI(game);
    // Start render loop.
    game.doRender();
});

