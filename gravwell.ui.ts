///<reference path="babylon.d.ts" />
/// <reference path="babylon.gui.d.ts" />


class UI {
    private _advancedTexture : BABYLON.GUI.AdvancedDynamicTexture;
    
    constructor(scene : BABYLON.Scene) {
        this._advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var sp = new BABYLON.GUI.StackPanel("sp");
        
    }
}