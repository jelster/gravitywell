import { AdvancedDynamicTexture, Button, StackPanel, Control, TextBlock, Style, Rectangle, Ellipse } from "@babylonjs/gui";
import { Scene, Vector3, Texture, Viewport } from "@babylonjs/core";
import { Game } from './game';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { GameData, IGameStateData } from "./GameData";
import { GravityWellGameManager } from ".";
import { HemisphericLightPropertyGridComponent } from "@babylonjs/inspector/components/actionTabs/tabs/propertyGrids/lights/hemisphericLightPropertyGridComponent";

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
        this._advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene, Texture.NEAREST_SAMPLINGMODE);
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
        pauseButton.onPointerClickObservable.add(() => {
            let helpText = document.getElementById("instructionPlate");
            if (!game.isPaused) { 
                helpText.style.display = 'block';
            }
            else {
                helpText.style.display = 'none';
            }
            game.togglePause();}
        );
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
        header.left = 1;
        header.top = 1;
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
        geView.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        geView.resizeToFit = true;
        header.addControl(geView);


    }
    public registerPlanetaryDisplays(current: Game) {
        current.planets.forEach(planet => {
            var rect = new Rectangle(planet.mesh.name + "-disp");
            rect.isHitTestVisible = false;
            rect.isPointerBlocker = false;
            rect.height = .1;
            rect.width = "185px";
           // rect.adaptWidthToChildren = true;
            rect.cornerRadius = 8;
            rect.thickness = 1;
            rect.color = "white";

            
            //rect.background = "teal";
            rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            var planetView = 
              "   Mass: " + planet.mass.toExponential(4) + "kg \n" 
            + "Radius: " + planet.radius.toFixed(2) + "m \n"
            + "  Orbit:  " + planet.orbitalRadius.toFixed(4) + "m \n"
            + "Period: " + planet.orbitalPeriod.toFixed(2) + "s \n"
            + " Speed:  " + planet.orbitalSpeed.toFixed(4);

            var rectTb = new TextBlock("", planetView);
            rectTb.left = rectTb.top = 0;
            rectTb.resizeToFit = true;
            rectTb.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            rect.addControl(rectTb);
            this._advancedTexture.addControl(rect);
            rect.linkWithMesh(planet.mesh);
            rect.linkOffsetY = -planet.radius*0.55;
          //  rect.linkOffsetX = 2* planet.radius + planet.position.x;
          
        });
    }
    public updateControls(current: IGameStateData): void {
        
        this.setSpeedText(current.lastShipVelocity);
        this.setGeForceText(current.lastShipGeForce);

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