///<reference path="babylon.d.ts" />
///<reference path="gravwell.ship.ts" />

class Game {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.FreeCamera;
    private _followCam: BABYLON.FollowCamera;
    private _light: BABYLON.Light;
    private _backgroundTexture: BABYLON.Texture;
    private _floor: BABYLON.Mesh;
    private _skybox: BABYLON.Mesh;
    private _star: BABYLON.Mesh;
    private _planet: BABYLON.Mesh;
    private _ship: Ship;
    private _inputMap: object;

    constructor(canvasElement: string) {
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true, {
            deterministicLockstep: true,
            lockstepMaxSteps: 4
        });
        this._inputMap = {};
    }

    private createCamera(): void {
        this._camera = new BABYLON.UniversalCamera('camera1', new BABYLON.Vector3(0, 1000, 0), this._scene);
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
     //   this._camera.attachControl(this._canvas, true);
        this._scene.activeCamera = this._camera;
    }

    private createFollowCamera(): void {

        this._followCam = new BABYLON.FollowCamera("followCam", new BABYLON.Vector3(0, 1131, 0), this._scene, this._ship.mesh);
        this._followCam.radius = 200;
        this._followCam.cameraAcceleration = 0.005;
        this._followCam.heightOffset = 1131;
        this._followCam.rotationOffset = 0;
        this._scene.activeCamera = this._followCam;
    }

    private createLight(): void {
        this._light = new BABYLON.PointLight("light1", new BABYLON.Vector3(0, 128, 0), this._scene);
        this._light.diffuse = BABYLON.Color3.Red();
        this._light.intensity = 1;
    }

    private createBackground(): void {
        this._backgroundTexture = new BABYLON.Texture("textures/corona_lf.png", this._scene);
        this._backgroundTexture.coordinatesMode = BABYLON.Texture.PROJECTION_MODE;
        this._floor = BABYLON.MeshBuilder.CreateGround("floor", { width: 1600, height: 1600, subdivisions: 4 }, this._scene);
        var backMat = new BABYLON.BackgroundMaterial("backMat", this._scene);
        backMat.reflectionTexture = this._backgroundTexture;
        backMat.useRGBColor = true;
        backMat.fillMode = BABYLON.Material.TriangleFillMode;
        this._floor.material = backMat;
    }

    private createStar(): void {
        this._star = BABYLON.MeshBuilder.CreateSphere('star', { segments: 16, diameter: 128 }, this._scene);
        let sphMat = new BABYLON.StandardMaterial("starMat", this._scene);
        sphMat.emissiveColor = BABYLON.Color3.Yellow();
        this._star.material = sphMat;
        this._star.metadata = { mass: 10 };        
    }

    private createPlanet(): void {
        this._planet = BABYLON.MeshBuilder.CreateSphere("planet", { segments: 16, diameter: 64 }, this._scene);
        this._planet.position = new BABYLON.Vector3(100, 0, 300);
    }

    private createShip(): void {
        this._ship = new Ship(this._scene);
    }

    private handleKeyboardInput() : void {
        let
            inputMap = this._inputMap || {},
            ship = this._ship;

        if (inputMap["w"] || inputMap["ArrowUp"]) {
            ship.fireThrusters();
        }
        if (inputMap["a"] || inputMap["ArrowLeft"]) {
            ship.rotation -= ship.maxAngularVelocity;
        }
        if (inputMap["d"] || inputMap["ArrowRight"]) {
            ship.rotation += ship.maxAngularVelocity;
        }
    }

    private updateShipPositionOverflow() : void {
        if (this._ship.position.x > 800) {
            this._ship.position.x = -800;
        }
        if (this._ship.position.x < -800) {
            this._ship.position.x = 800;
        }
        if (this._ship.position.z > 800) {
            this._ship.position.z = -800;
        }
        if (this._ship.position.z < -800) {
            this._ship.position.z = 800;
        }
        
    }

    private applyGravitationalForceToShip() : void {
        let dCenter = BABYLON.Vector3.Distance(this._ship.position, this._star.position);
        if (dCenter < 64) {
            return;
        }
        let G = 6.67259*(10^-11),
         r = dCenter^2,
         dir = this._star.position.subtract(this._ship.position).normalize(),
         m1 = 1, 
         m2 = this._star.metadata.mass;
         
        let f = -(G*(m1*m2))/(r);
         
        this._ship.velocity.x += (dir.x*f);
        this._ship.velocity.z += (dir.z *f);
    }

    createScene(): void {
        this._scene = new BABYLON.Scene(this._engine);

        this.createCamera();
        this.createLight();
        this.createBackground();
        this.createStar();
        this.createPlanet();
        this.createShip();
      //  this.createFollowCamera();

        this._scene.onKeyboardObservable.add((kbInfo) => {

            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                case BABYLON.KeyboardEventTypes.KEYUP:
                    this._inputMap[kbInfo.event.key] = kbInfo.type == BABYLON.KeyboardEventTypes.KEYDOWN;
                    break;
            }
        });

        //deterministic steps for update loop
        this._scene.onBeforeStepObservable.add(() => {            
            this.handleKeyboardInput();
            this.applyGravitationalForceToShip();
            this._ship.onUpdate();
            this.updateShipPositionOverflow();         
        });
    }

    doRender(): void {
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Create the game using the 'renderCanvas'.
    let game = new Game('renderCanvas');
    // Create the scene.
    game.createScene();
    // Start render loop.
    game.doRender();
});