///<reference path="babylon.d.ts" />
///<reference path="gravwell.ship.ts" />
///<reference path="gravwell.star.ts" />

enum GravityMode {
    DistanceSquared = 1,
    DistanceCubed = 2
}

class Point {
    public x: number;
    public y: number;
}
class Game {
    static MINIMAP_RENDER_MASK = 1;
    static MAIN_RENDER_MASK = 2;
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.FreeCamera;
    private _followCam: BABYLON.UniversalCamera;
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

    private _explosionParticle: BABYLON.ParticleSystem;
    private _respawnTimeLimit: number;

    private _cameraDolly: BABYLON.Mesh;
    public readonly gameWorldSizeX: number;
    public readonly gameWorldSizeY: number;

    public readonly gameWorldCellsX: number;
    public readonly gameWorldCellsY: number;
    public readonly numberOfStars: number;

    public GravityWellMode: GravityMode;
    public isPaused: boolean;

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
        }, true);

        this._inputMap = {};
        this._planets = [];
        this._stars = [];
        this._gravityWells = [];
        this.gameWorldSizeX = 4800;
        this.gameWorldSizeY = 4800;
        this.gameWorldCellsX = 3;
        this.gameWorldCellsY = 3;

        this._starMap = [
            { x: -1600, y: -1600 },

            { x: 1600, y: -1600 },

            { x: 0, y: 1600 },
            { x: 1600, y: 1600 }
        ];
        this.GravityWellMode = GravityMode.DistanceSquared;
        this.isPaused = true;
        this._respawnTimeLimit = 4000;

    }

    private createCamera(): void {
        let camPos = new BABYLON.Vector3(0, 1000, 0);
        this._camera = new BABYLON.UniversalCamera('uniCam', camPos, this._scene);
        this._camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

        var fieldSize = this.gameWorldSizeX;
        this._camera.orthoTop = fieldSize / 2;
        this._camera.orthoBottom = -fieldSize / 2;
        this._camera.orthoLeft = -fieldSize / 2;
        this._camera.orthoRight = fieldSize / 2;
        this._camera.viewport = new BABYLON.Viewport(0.8, 0.75, 0.99 - 0.8, 1 - 0.75);
        this._camera.layerMask = Game.MINIMAP_RENDER_MASK;
        //    this._camera.setTarget(new BABYLON.Vector3(0.1,0.1,0.1));
        this._camera.rotation.x = Math.PI / 2;
        this._camera.rotation.z = Math.PI;
        this._scene.activeCameras.push(this._camera);
    }

    private createFollowCamera(): void {
        let camPos = new BABYLON.Vector3(0, 2300, 0),
            dollySize = 1700;
        this._followCam = new BABYLON.UniversalCamera("followCam", camPos, this._scene);
        this._followCam.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        //   this._camera.attachControl(this._canvas, true);
          this._followCam.viewport = new BABYLON.Viewport(0, 0, 1, 1);
          var ratio = this._followCam.viewport.width / this._followCam.viewport.height;
        //  var fieldSize = 1.5*(this.gameWorldSizeX / this.gameWorldCellsX);
        this._followCam.orthoTop = dollySize / (2*ratio)
        this._followCam.orthoBottom = -dollySize / (2*ratio);
        this._followCam.orthoLeft = -dollySize / 2;
        this._followCam.orthoRight = dollySize / 2;
        
        this._followCam.layerMask = Game.MAIN_RENDER_MASK;
        this._cameraDolly = BABYLON.MeshBuilder.CreatePlane("dollyPlane", { size: dollySize }, this._scene);
        this._cameraDolly.layerMask = Game.MINIMAP_RENDER_MASK;
        this._cameraDolly.rotation.x = Math.PI / 2;
        this._cameraDolly.rotation.z = Math.PI;
        this._cameraDolly.bakeCurrentTransformIntoVertices();
        // this._cameraDolly.parent = this._ship.mesh;
       // this._followCam.lockedTarget = this._cameraDolly;
        this._followCam.parent = this._cameraDolly;
        this._followCam.setTarget(this._ship.position);
        this._scene.activeCameras.push(this._followCam);
    }

    private createBackground(): void {
        this._backgroundTexture = new BABYLON.Texture("textures/corona_lf.png", this._scene);
        this._backgroundTexture.coordinatesMode = BABYLON.Texture.PROJECTION_MODE;
        this._floor = BABYLON.MeshBuilder.CreateGround("floor", { width: this.gameWorldSizeX, height: this.gameWorldSizeY, subdivisions: 1 }, this._scene);
        this._floor.position.y = -10;
        var backMat = new BABYLON.BackgroundMaterial("backMat", this._scene);
        backMat.primaryColor = BABYLON.Color3.Black();
        backMat.reflectionTexture = this._backgroundTexture;
        backMat.useRGBColor = true;
        //backMat.alphaMode = 10;
        // backMat.fillMode = BABYLON.Material.TriangleFillMode;
        //this._floor.layerMask = Game.MAIN_RENDER_MASK;
        this._floor.material = backMat;
    }

    private createStar(pos): void {
        var star = new Star(this._scene, pos);
        this._stars.push(star);
        this._gravityWells.push(star);
        this.createPlanet(star);
    }

    private createPlanet(parentStar: Star): void {

        var planet = new Planet(this._scene, parentStar)
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
        if (activeCam.isCompletelyInFrustum(this._ship.mesh)) {
            return;
        }
        let ship = this._ship,
            posOffsetX = ship.position.x,
            posOffsetY = ship.position.z,
            cellX = +((posOffsetX / this.gameWorldCellSizeX).toFixed(0)),
            cellY = +((posOffsetY / this.gameWorldCellSizeY).toFixed(0)),
            camCellX = +((activeCam.position.x / this.gameWorldCellSizeX).toFixed(0)),
            camCellY = +((activeCam.position.z / this.gameWorldCellSizeY).toFixed(0));

        //console.log('moving camera s{0}, s{1}, c{2}, c{3}', cellX, cellY, camCellX, camCellY);
        activeCam.position.x = (cellX * this.gameWorldCellSizeX);
        activeCam.position.z = (cellY * this.gameWorldCellSizeY);

    }

    private createExplosion(): void {

        this._explosionParticle = new BABYLON.ParticleSystem("explosion", 200, this._scene);
        this._explosionParticle.particleTexture = new BABYLON.Texture("textures/explosion-3.png", this._scene);
        this._explosionParticle.particleEmitterType = new BABYLON.SphereParticleEmitter(5, 0);
        this._explosionParticle.preventAutoStart = true;
        this._explosionParticle.disposeOnStop = false;
        this._explosionParticle.startDelay = 0;

        // Colors of all particles (splited in 2 + specific color before dispose)
        this._explosionParticle.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1);
        this._explosionParticle.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1);
        this._explosionParticle.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

        // Life time of each particle (random between...)
        this._explosionParticle.minLifeTime = 1;
        this._explosionParticle.maxLifeTime = 1;
        this._explosionParticle.emitRate = 200;


        //Angular speed
        this._explosionParticle.minAngularSpeed = 0.00;
        this._explosionParticle.maxAngularSpeed = Math.PI / 2;

        this._explosionParticle.targetStopDuration = 0.35;

        this._explosionParticle.maxEmitPower = 50;
        this._explosionParticle.minEmitPower = 10;
        this._explosionParticle.updateSpeed = 0.005;
        this._explosionParticle.addStartSizeGradient(0, 1);
        this._explosionParticle.addStartSizeGradient(1, 100);
        this._explosionParticle.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;


    }

    private resetShip(): void {
        console.log('resetting ship', this._ship);
        if (!this._ship) { return; }
        this._ship.position = BABYLON.Vector3.Zero();
        this._ship.velocity = new BABYLON.Vector3(0, 0, 0);
        this._ship.rotation = 0;
        this._ship.isAlive = true;
        this._ship.mesh.isVisible = true;
        this._ship.mesh.checkCollisions = true;
        this._explosionParticle.stop();
        //   this._followCam.lockedTarget = this._ship.mesh;
    }

    private killShip(): void {
        //   this._followCam.lockedTarget = null;
        this._ship.isAlive = false;
        this._ship.mesh.isVisible = false;
        this._ship.velocity = BABYLON.Vector3.Zero();
        this._ship.mesh.checkCollisions = false;

        this._explosionParticle.emitter = this._ship.mesh;
        this._explosionParticle.start();

        //BABYLON.ParticleHelper.CreateAsync("explosion", this._scene, true).then((s) => s.start(sh.mesh));
        this._scene.executeOnceBeforeRender(() => this.resetShip(), this._respawnTimeLimit);
    }
    createScene(): void {
        let self = this;
        this._scene = new BABYLON.Scene(this._engine);
        this._scene.collisionsEnabled = true;
        var gl = new BABYLON.GlowLayer("glow", this._scene);


        this.createBackground();


        for (let i = 0; i < this._starMap.length; i++) {
            let item = this._starMap[i];
            var starPos = new BABYLON.Vector3(item.x, 0, item.y);
            this.createStar(starPos);
        }

        this.createExplosion();
        this.createShip();

        this.createFollowCamera();
        this.createCamera();

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
            if (this.isPaused) {
                return;
            }
            this._planets.forEach(planet => {
                planet.movePlanetInOrbit(alpha);
            });

            this._gravityWells.forEach(gravWell => {
                if (this._ship.isAlive) {
                    this.applyGravitationalForceToShip(gravWell);
                }
            });
            this._ship.onUpdate();
            this.updateShipPositionOverflow();
            //          this.moveCameraToShipSector();
            alpha += 0.0001;
        });


        this._ship.mesh.checkCollisions = true;
        this._stars.forEach(star => {
            star.mesh.checkCollisions = true;
        });
        this._planets.forEach(planet => {
            planet.mesh.checkCollisions = true;
        });

        //   this._scene.debugLayer.show();//.then(console.log);


        $("#debugViewToggle").on("change", function () {
            if (self._scene.debugLayer.isVisible()) {
                self._scene.debugLayer.hide();
            }
            else {
                console.log('enabling debug layer');
                self._scene.debugLayer.show({ handleResize: true });
            }

        });

        $("#pauseGame").on("change", function () {
            self.isPaused = $(this).is(":checked");
        }).attr("checked", "checked");


        this.resetShip();


    }

    doRender(): void {

        this._engine.runRenderLoop(() => {
            this._cameraDolly.position = this._ship.position;
            if (!this.isPaused) {
               
                if (this._ship.isAlive) {
                    this.handleKeyboardInput();
                    this._planets.forEach(planet => {
                        if (planet.mesh.intersectsPoint(this._ship.mesh.position)) {
                            console.log('mesh intersection!', this._ship, planet);
                            this.killShip();
                            return false;
                        }
                    });
                    this._stars.forEach(star => {
                        if (star.mesh.intersectsPoint(this._ship.mesh.position)) {
                            console.log('mesh intersection!', this._ship, star);
                            this.killShip();
                            return false;
                        }
                    });
                }
            }

            var alpha = 0.0;
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