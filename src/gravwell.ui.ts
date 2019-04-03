import { AdvancedDynamicTexture, Button, StackPanel, Control, TextBlock, Style } from "@babylonjs/gui";
import { Scene } from "@babylonjs/core";
import { Game } from './game';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

export class UI {

    public get speedText() : TextBlock {
        var control : Array<Control> = this._advancedTexture.getDescendants(false, (ctrl) => ctrl.name === "speedView");
        if (!control || (control.length <= 0)) {
            return null;
        }
        return control[0] as TextBlock;
    }

    public get geText() : TextBlock {
        var control : Array<Control> = this._advancedTexture.getDescendants(false, (ctrl) => ctrl.name === "geView");
        if (!control || (control.length <= 0)) {
            return null;
        }
        return control[0] as TextBlock;
    }
    

    private _advancedTexture : AdvancedDynamicTexture;
    private _pauseButton : Button;
    private _debugButton: Button;

    private _baseStyle: Style;
   

    constructor(game : Game, scene?: Scene) {
        
        this._advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
        this._baseStyle = new Style(this._advancedTexture);
        this._baseStyle.fontSize = "18pt";
        this._advancedTexture.layer.layerMask = Game.MAIN_RENDER_MASK;
        this._advancedTexture.renderAtIdealSize = true;

        var sp = new StackPanel("sp");        
        sp.isHitTestVisible = true;
        sp.isPointerBlocker = true;
        sp.isVertical = true;
        sp.background = "black";
        sp.left = 40;
        sp.top = 0;
        sp.color = "white";
        sp.width = "7%";
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


        var header = new StackPanel("header");        
        header.isHitTestVisible = false;
        header.isPointerBlocker = false;
        header.left = 0;
        header.top = 0;
        header.height = "7%";
        header.color = "white";
        header.paddingTop = "1%";
        header.adaptWidthToChildren = true;
        header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._advancedTexture.addControl(header);

        
        var speedView = new TextBlock("speedView", "Current Speed: 0.0");
        speedView.width = "160px";
        speedView.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
       // speedView.height = "7%";
        speedView.resizeToFit = true;
        header.addControl(speedView);

        var geView = new TextBlock("geView", "0.0x 0.0y 0.0z");
        geView.resizeToFit = true;
        header.addControl(geView);
        
    }
}