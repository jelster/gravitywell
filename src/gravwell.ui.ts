import { AdvancedDynamicTexture, Button, StackPanel, Control, TextBlock, Style } from "@babylonjs/gui";
import { Scene, Vector3 } from "@babylonjs/core";
import { Game } from './game';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { GameData } from "./GameData";
import { GravityWellGameManager } from ".";

export class UI {

    public get speedText(): TextBlock {
        var control: Array<Control> = this._advancedTexture.getDescendants(false, (ctrl) => ctrl.name === "speedView");
        if (!control || (control.length <= 0)) {
            return null;
        }
        return control[0] as TextBlock;
    }

    public get geText(): TextBlock {
        var control: Array<Control> = this._advancedTexture.getDescendants(false, (ctrl) => ctrl.name === "geView");
        if (!control || (control.length <= 0)) {
            return null;
        }
        return control[0] as TextBlock;
    }


    private _advancedTexture: AdvancedDynamicTexture;
    private _pauseButton: Button;
    private _debugButton: Button;

    private _baseStyle: Style;
    private _game: Game;

    constructor(game: Game, scene?: Scene) {
        this._game = game;
        this._advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
        this._baseStyle = new Style(this._advancedTexture);
        this._baseStyle.fontSize = "18pt";
        
        this._advancedTexture.layer.layerMask = Game.MAIN_RENDER_MASK;
        this._advancedTexture.renderAtIdealSize = true;

        var sp = new StackPanel("sp");
        sp.style = this._baseStyle;
        sp.isHitTestVisible = true;
        sp.isPointerBlocker = true;
        sp.isVertical = true;
        sp.background = "black";
        sp.left = 10;
        sp.top = 0;
        sp.color = "white";
        sp.width = "7%";
        sp.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        sp.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        
        this._advancedTexture.addControl(sp);

        var pauseButton = Button.CreateSimpleButton("pauseButton", "Pause");
        
        pauseButton.adaptWidthToChildren = true;
        pauseButton.height = "120px";
        pauseButton.onPointerClickObservable.add(() => game.togglePause());
        sp.addControl(pauseButton);
        this._pauseButton = pauseButton;

        var debugButton = Button.CreateSimpleButton("debugButton", "Debug");
        debugButton.height = "120px";
        debugButton.adaptWidthToChildren = true;
        debugButton.onPointerClickObservable.add(() => {
            game.toggleDebugLayer();
        });
        sp.addControl(debugButton);
        this._debugButton = debugButton;

        var resetButton = Button.CreateSimpleButton("reset", "Restart");
        resetButton.adaptWidthToChildren = true;
        resetButton.height = "120px";
        resetButton.onPointerClickObservable.add(() => {
            game.resetGame();
        });
        sp.addControl(resetButton);

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

        var speedView = new TextBlock("speedView", "Speed: 0.0");
        speedView.width = "160px";
        speedView.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        // speedView.height = "7%";
        speedView.resizeToFit = true;
        header.addControl(speedView);

        var geView = new TextBlock("geView", this.formatVectorText(Vector3.Zero()));
        geView.resizeToFit = true;
        header.addControl(geView);        

        
    }

    public updateControls(current: Game): void {
        let data = current.gameData;
        this.setSpeedText(data.lastShipVelocity);
        this.setGeForceText(data.lastShipGeForce);

        if (current.isPaused) {
            this._pauseButton.textBlock.text = "Resume";
        }
        else {
            this._pauseButton.textBlock.text = "Pause";
        }
    }

    private setSpeedText(value) {
        this.speedText.text = "Speed: " + this.formatVectorText(value);
    }
    private setGeForceText(value) {
        this.geText.text = "GForce: " + this.formatVectorText(value);
    }
    private formatVectorText(vector: Vector3): string {
        return vector.length().toFixed(4) + " - { x: " + vector.x.toFixed(4) + " y: " + vector.y.toFixed(4) + " z: " + vector.z.toFixed(4) + " }";
    }
}