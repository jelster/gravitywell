///<reference path="babylon.d.ts" />
/// <reference path="babylon.gui.d.ts" />


class UI {
    private _advancedTexture : BABYLON.GUI.AdvancedDynamicTexture;
    private _pauseButton : BABYLON.GUI.Button;
    private _scene : BABYLON.Scene;

    constructor(scene : BABYLON.Scene) {
        this._scene = scene;
        this._advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var sp = new BABYLON.GUI.StackPanel("sp");
        this._pauseButton = BABYLON.GUI.Button.CreateSimpleButton("pauseButton", "Pause");
        this._pauseButton.width = 0.2;
        this._pauseButton.height = "40px";
        this._pauseButton.color = "white";
        this._pauseButton.background = "green";
        this._advancedTexture.addControl(this._pauseButton);  
    }
}