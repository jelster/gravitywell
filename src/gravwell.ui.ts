import { AdvancedDynamicTexture, Button, StackPanel } from "@babylonjs/gui";
import { Scene } from "@babylonjs/core";

export class UI {
    private _advancedTexture : AdvancedDynamicTexture;
    private _pauseButton : Button;
    private _scene : Scene;

    constructor(scene : Scene) {
        this._scene = scene;
        this._advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var sp = new StackPanel("sp");
        this._pauseButton = Button.CreateSimpleButton("pauseButton", "Pause");
        this._pauseButton.width = 0.2;
        this._pauseButton.height = "40px";
        this._pauseButton.color = "white";
        this._pauseButton.background = "green";
        this._advancedTexture.addControl(this._pauseButton);  
    }
}