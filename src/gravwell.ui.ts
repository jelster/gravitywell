import { AdvancedDynamicTexture, Button, StackPanel, Control } from "@babylonjs/gui";
import { Scene } from "@babylonjs/core";
import { Game } from './game';

export class UI {
    private _advancedTexture : AdvancedDynamicTexture;
    private _pauseButton : Button;
    private _scene : Scene;

    constructor(scene : Scene) {
        this._scene = scene;
        this._advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this._advancedTexture.layer.layerMask = Game.MAIN_RENDER_MASK;
        var sp = new StackPanel("sp");
        this._pauseButton = Button.CreateSimpleButton("pauseButton", "Pause");
      //  this._pauseButton.width = "120px";
        this._pauseButton.height = "120px";
        this._pauseButton.width = "120px";
        this._pauseButton.color = "white";
        this._pauseButton.background = "black";
        this._pauseButton.left = 40;
        this._pauseButton.cornerRadius = 110;
        this._pauseButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
        this._advancedTexture.addControl(this._pauseButton);

    }
}