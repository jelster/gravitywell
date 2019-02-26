///<reference path="babylon.d.ts" />
///<reference path="gravwell.ship.ts" />
///<reference path="gravwell.star.ts" />

enum GravityMode {
    DistanceSquared = 1,
    DistanceCubed = 2
}

class Point {
    public x : number;
    public y : number;
}
class Game {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.FreeCamera;
    private _followCam: BABYLON.FollowCamera;
    private _light: BABYLON.PointLight;
    private _backgroundTexture: BABYLON.Texture;
    private _floor: BABYLON.Mesh;
    private _skybox: BABYLON.Mesh;

    private _ship: Ship;
    private _inputMap: object;

    private _stars: Array<Star>;
    private _planets: Array<Planet>;
    private _gravityWells: Array<IGravityContributor>;
    private readonly _starMap: Array<Point>;
    public readonly gameWorldSizeX: number;
    public readonly gameWorldSizeY: number;

    public readonly gameWorldCellsX: number;
    public readonly gameWorldCellsY: number;
    public readonly numberOfStars: number;

    public GravityWellMode: GravityMode;

    public get gameWorldCellSizeX(): number {
        return Math.floor(this.gameWorldSizeX / this.gameWorldCellsX);
    }
    public get gameWorldCellSizeY(): number {
        return Math.floor(this.gameWorldSizeY / this.gameWorldCellsY);
    }

    constructor(canvasElement: string, numStars: number = null) {
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true, {
            deterministicLockstep: true,
            lockstepMaxSteps: 4
        });
        this._inputMap = {};
        this._planets = [];
        this._stars = [];
        this._gravityWells = [];
        this.gameWorldSizeX = 4800;
        this.gameWorldSizeY = 4800;
        this.gameWorldCellsX = 3;
        this.gameWorldCellsY = 3;
        
        this._starMap = [
            {x: -1600, y: -1600},
            {x: 0, y: -1600},
            {x: 1600, y: -1600},
            {x: -1600, y: 0},
            {x: 0, y: 1600},
            {x: 1600, y: 1600}
        ];
        this.GravityWellMode = GravityMode.DistanceSquared;
    }

    private createCamera(): void {
let camPos = new BABYLON.Vector3(0, 100, 0);
        this._camera = new BABYLON.UniversalCamera('camera1', camPos, this._scene);
        this._camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        //   this._camera.attachControl(this._canvas, true);
        this._camera.viewport = new BABYLON.Viewport(0, 0, 1, 1);
        var ratio = this._camera.viewport.width / this._camera.viewport.height;
        var fieldSize = this.gameWorldSizeX / this.gameWorldCellsX;
        this._camera.orthoTop = fieldSize / (2 * ratio);
        this._camera.orthoBottom = -fieldSize / (2 * ratio);
        this._camera.orthoLeft = -fieldSize / 2;
        this._camera.orthoRight = fieldSize / 2;
        this._camera.setTarget(new BABYLON.Vector3(camPos.x, 0, camPos.z));
        this._scene.activeCamera = this._camera;
    }

    private createFollowCamera(): void {

        this._followCam = new BABYLON.FollowCamera("followCam", new BABYLON.Vector3(0, 1131, 0), this._scene, this._ship.mesh);
        this._followCam.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        //   this._camera.attachControl(this._canvas, true);
        this._followCam.viewport = new BABYLON.Viewport(0, 0, 1, 1);
        var ratio = this._followCam.viewport.width / this._followCam.viewport.height;
        var fieldSize = 1600;
        this._followCam.orthoTop = fieldSize / (2 * ratio);
        this._followCam.orthoBottom = -fieldSize / (2 * ratio);
        this._followCam.orthoLeft = -fieldSize / 2;
        this._followCam.orthoRight = fieldSize / 2;

        this._followCam.radius = fieldSize;
        this._followCam.cameraAcceleration = 0.005;
        this._followCam.heightOffset = 1131;
        // this._followCam.rotationOffset = ;


        this._scene.activeCamera = this._followCam;
    }

    private createLight(): void {
        this._light = new BABYLON.PointLight("light1", new BABYLON.Vector3(0, 0, 0), this._scene);
        this._light.diffuse = BABYLON.Color3.Red();
        this._light.specular = BABYLON.Color3.Yellow();
        this._light.range = 1600;
        this._light.intensity = 10;
    }

    private createBackground(): void {
        this._backgroundTexture = new BABYLON.Texture("textures/corona_lf.png", this._scene);
        this._backgroundTexture.coordinatesMode = BABYLON.Texture.PROJECTION_MODE;
        this._floor = BABYLON.MeshBuilder.CreateGround("floor", { width: 3200, height: 3200, subdivisions: 4 }, this._scene);
        var backMat = new BABYLON.BackgroundMaterial("backMat", this._scene);
        backMat.reflectionTexture = this._backgroundTexture;
        backMat.useRGBColor = false;
        backMat.fillMode = BABYLON.Material.TriangleFillMode;

        this._floor.material = backMat;
    }

    private createStar(pos): void {
        var star = new Star(this._scene, pos);
        this._stars.push(star);
        this._gravityWells.push(star);
        this.createPlanet(star);
    }

    private createPlanet(parentStar: Star): void {
        let planet = new Planet(this._scene, parentStar)
        this._planets.push(planet);
        this._gravityWells.push(planet);
    }

    private createShip(): void {
        this._ship = new Ship(this._scene);
        //this._ship.position.x = -2200;
        //this._ship.position.z = -2200;
    }

    private handleKeyboardInput(): void {
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

    private updateShipPositionOverflow(): void {
        if (this._ship.position.x > this.gameWorldSizeX / 2) {
            this._ship.position.x = -this.gameWorldSizeX / 2;
        }
        if (this._ship.position.x < -this.gameWorldSizeX / 2) {
            this._ship.position.x = this.gameWorldSizeX / 2;
        }
        if (this._ship.position.z > this.gameWorldSizeY / 2) {
            this._ship.position.z = -this.gameWorldSizeY / 2;
        }
        if (this._ship.position.z < -this.gameWorldSizeY / 2) {
            this._ship.position.z = this.gameWorldSizeY / 2;
        }

    }

    private applyGravitationalForceToShip(gravSource: IGravityContributor): void {
        let dCenter = BABYLON.Vector3.Distance(this._ship.position, gravSource.position),
            sRad = gravSource.radius || 10;

        if (dCenter <= sRad) { return; }

        let G = 6.67259e-11,
            r = dCenter ^ 2,
            dir = this._ship.position.subtract(gravSource.position).normalize(),
            m1 = 100,
            m2 = gravSource.mass || 1;

        if (this.GravityWellMode === GravityMode.DistanceCubed) {
            r = r * dCenter; // r^3 propagation, like electrical fields
        }
        let f = -(G * (m1 * m2)) / (r);

        this._ship.velocity.x += (dir.x * f);
        this._ship.velocity.z += (dir.z * f);
    }

    private moveCameraToShipSector() {
        
        let activeCam = this._scene.activeCamera;
        if (activeCam.isInFrustum(this._ship.mesh)) {
            return;
        }
        let ship = this._ship,
            halfSizeX = this.gameWorldSizeX/2,
            halfCellX = this.gameWorldCellSizeX/2,
            halfSizeY = this.gameWorldSizeY/2,
            halfCellY = this.gameWorldCellSizeY/2,
            posOffsetX = ship.position.x,
            posOffsetY = ship.position.z,        
            cellX = Math.fround(posOffsetX/this.gameWorldCellSizeX),
            cellY = Math.fround(posOffsetY/this.gameWorldCellSizeY);
        
        activeCam.position.x = (cellX * this.gameWorldCellSizeX);
        activeCam.position.z = (cellY * this.gameWorldCellSizeY);

    }
    
    createScene(): void {
        this._scene = new BABYLON.Scene(this._engine);

        this.createCamera();
        this.createLight();
        //   this.createBackground();
        for (let i = 0; i < this._starMap.length; i++) {
            let item = this._starMap[i];
            var starPos = new BABYLON.Vector3(item.x, 0, item.y);
            this.createStar(starPos);
        }

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

        var alpha = 0;
        //deterministic steps for update loop
        this._scene.onBeforeStepObservable.add(() => {
            this._planets.forEach(planet => {
                planet.movePlanetInOrbit(alpha);
            });
            this._gravityWells.forEach(gravWell => {
                this.applyGravitationalForceToShip(gravWell);
            });

            this._ship.onUpdate();
            this.updateShipPositionOverflow();
            this.moveCameraToShipSector();
            alpha += 0.001;
        });
    }

    doRender(): void {
        this._engine.runRenderLoop(() => {
            this.handleKeyboardInput();

            this._scene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // TODO: load game data from TBD
   
    // Create the game using the 'renderCanvas'.
    let game = new Game('renderCanvas');
    // Create the scene.
    game.createScene();
    // Start render loop.
    game.doRender();
});