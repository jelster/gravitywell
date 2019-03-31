import { AdvancedDynamicTexture, Button, StackPanel, Control } from "@babylonjs/gui";
import { Scene } from "@babylonjs/core";
import { Game } from './game';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

export class UI {
    private _advancedTexture : AdvancedDynamicTexture;
    private _pauseButton : Button;
    private _debugButton: Button;
   

    constructor(game : Game, scene?: Scene) {
        
        this._advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

        this._advancedTexture.layer.layerMask = Game.MAIN_RENDER_MASK;
        var sp = new StackPanel("sp");
        this._advancedTexture.renderAtIdealSize = true;
        sp.isHitTestVisible = true;
        sp.isPointerBlocker = true;
        sp.isVertical = true;
        sp.background = "black";
        sp.left = 40;
        sp.top = 0;
        sp.color = "white";
        sp.width = "180px";
        sp.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        sp.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._advancedTexture.addControl(sp);

        var pauseButton = Button.CreateSimpleButton("pauseButton", "Pause");      
        pauseButton.height = "120px";
        pauseButton.width = "120px";       
        pauseButton.onPointerClickObservable.add(() => game.togglePause());
        sp.addControl(pauseButton);
        this._pauseButton = pauseButton;

        var debugButton = Button.CreateSimpleButton("debugButton", "Debug");
        debugButton.width = "120px";
        debugButton.height = "120px";
        
        debugButton.onPointerClickObservable.add(() => {
            game.toggleDebugLayer();
        });

        sp.addControl(debugButton);
        this._debugButton = debugButton;
    }
}