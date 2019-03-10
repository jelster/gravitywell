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
    static readonly MINIMAP_RENDER_MASK = 1;
    static readonly MAIN_RENDER_MASK = 2;
    static readonly BaseCameraPosition: BABYLON.Vector3 = new BABYLON.Vector3(0, 2300, 0);
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.UniversalCamera;
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

    private _explosionParticle: BABYLON.ParticleSystem;
    private _respawnTimeLimit: number;

    private _cameraDolly: BABYLON.Mesh;
    private _dollySize: number;
    public readonly gameWorldSizeX: number;
    public readonly gameWorldSizeY: number;
    public readonly numberOfStars: number;

    public GravityWellMode: GravityMode;
    public isPaused: boolean;
    private _gridMat: BABYLON.GridMaterial;
    private _gravUnit: number;
    private _flyCam: BABYLON.UniversalCamera;
    private _cameraTarget: BABYLON.TransformNode;

    constructor(canvasElement: string, numStars: number = 6) {
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true, {
            deterministicLockstep: true,
            lockstepMaxSteps: 4
        }, true);

        this._inputMap = {};
        this._planets = [];
        this._stars = [];
        this._gravityWells = [];
        this.gameWorldSizeX = 12800;
        this.gameWorldSizeY = 12800;
        this._gravUnit = 50;
        this._starMap = [];
        for (let index = 0; index < numStars; index++) {
            let randX = BABYLON.Scalar.RandomRange(-this.gameWorldSizeX / 2, this.gameWorldSizeX / 2),
                randZ = BABYLON.Scalar.RandomRange(-this.gameWorldSizeY / 2, this.gameWorldSizeY / 2);
            this._starMap.push({ x: randX, y: randZ });

        }
        // this._starMap = [
        //     { x: 1700, y: -2000 },
        //     { x: -1200, y: 600 },
        //     { x: -2000, y: 3000 }
        // ];
        this.GravityWellMode = GravityMode.DistanceSquared;
        this.isPaused = true;
        this._respawnTimeLimit = 4000;
        this._dollySize = 1600;
    }

    private createCamera(): void {
        let camPos = new BABYLON.Vector3(0, this.gameWorldSizeX, 0);
        this._camera = new BABYLON.UniversalCamera('uniCam', camPos, this._scene);
        this._camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this._camera.maxZ = 16000;
        var fieldSize = this.gameWorldSizeX;
        this._camera.orthoTop = fieldSize / 2;
        this._camera.orthoBottom = -fieldSize / 2;
        this._camera.orthoLeft = -fieldSize / 2;
        this._camera.orthoRight = fieldSize / 2;
        this._camera.viewport = new BABYLON.Viewport(0.8, 0.75, 0.99 - 0.8, 1 - 0.75);
        this._camera.layerMask = Game.MINIMAP_RENDER_MASK;

        this._camera.rotation.x = Math.PI / 2;
        this._camera.rotation.z = Math.PI;
        this._scene.activeCameras.push(this._camera);
    }

    private createFollowCamera(): void {

        this._followCam = new BABYLON.FollowCamera("followCam", Game.BaseCameraPosition, this._scene);
        //   this._followCam.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

        this._followCam.viewport = new BABYLON.Viewport(0, 0, 1, 1);
        //   var ratio = this._followCam.viewport.width / this._followCam.viewport.height;

        // this._followCam.orthoTop = this._dollySize / (2 * ratio)
        // this._followCam.orthoBottom = -this._dollySize / (2 * ratio);
        // this._followCam.orthoLeft = -this._dollySize / 2;
        // this._followCam.orthoRight = this._dollySize / 2;

        this._followCam.layerMask = Game.MAIN_RENDER_MASK;
        this._followCam.heightOffset = 200;
        this._followCam.radius = 300;
        this._followCam.maxCameraSpeed = 20;
        this._followCam.cameraAcceleration = .9;
        this._followCam.rotationOffset = 180;

        this._followCam.upperHeightOffsetLimit = 500;
        this._followCam.upperRotationOffsetLimit = 220;
        this._followCam.lowerHeightOffsetLimit = 100;
        this._followCam.lowerRotationOffsetLimit = 140;
        this._followCam.upperRadiusLimit = 800;

        //    this._cameraDolly.parent = this._cameraTarget;
        this._followCam.parent = this._cameraDolly;
        this._followCam.setTarget(this._ship.position);
        this._scene.activeCameras.push(this._followCam);

        this._followCam.lockedTarget = null;
        // this._followCam.attachControl(this._engine.getRenderingCanvas(), true);
    }

    private createCameraDolly() {
        this._cameraDolly = BABYLON.MeshBuilder.CreatePlane("dollyPlane", { size: this._dollySize }, this._scene);
        // this._cameraDolly.position.y = 165;
        this._cameraDolly.layerMask = Game.MINIMAP_RENDER_MASK;
        this._cameraDolly.rotation.x = Math.PI / 2;
        this._cameraDolly.rotation.z = Math.PI;
        this._cameraDolly.bakeCurrentTransformIntoVertices();
        this._cameraDolly.showBoundingBox = true;
    }

    private createBackground(): void {
        //  this._backgroundTexture = new BABYLON.Texture("textures/corona_lf.png", this._scene);
        //   this._backgroundTexture.coordinatesMode = BABYLON.Texture.PROJECTION_MODE;
        this._floor = BABYLON.MeshBuilder.CreateGround("floor", { width: this.gameWorldSizeX, height: this.gameWorldSizeY, subdivisionsX: this.gameWorldSizeX / this._gravUnit, subdivisionsY: this.gameWorldSizeY / this._gravUnit, updatable: true }, this._scene);
        this._floor.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
        var backMat = new BABYLON.BackgroundMaterial("backMat", this._scene);
        backMat.primaryColor = BABYLON.Color3.Black();
        backMat.reflectionTexture = this._backgroundTexture;
        backMat.useRGBColor = true;

        this._gridMat = new BABYLON.GridMaterial("gridMat", this._scene);
        this._gridMat.gridRatio = this._gravUnit;
        this._floor.layerMask = Game.MAIN_RENDER_MASK;
        this._gridMat.lineColor = BABYLON.Color3.White();

        //backMat.alphaMode = 10;
        // backMat.fillMode = BABYLON.Material.TriangleFillMode;
        this._floor.layerMask = Game.MAIN_RENDER_MASK;

        //this._floor.material= backMat;
        this._floor.material = this._gridMat;
        this._gridMat.mainColor = BABYLON.Color3.Black();
    }


    private updateGridHeightMap(): void {
        let
            gravWells = this._gravityWells;

        var updatePositions = function (positions) {
            for (var idx = 0; idx < positions.length; idx += 3) {
                var forces = gravWells.reduce(function (pv, cv, ci, arr): BABYLON.Vector3 {
                    let fi = Game.computeGravitationalForceAtPoint(cv, BABYLON.Vector3.Zero().set(positions[idx + 0], positions[idx + 1], positions[idx + 2]), cv.mass);

                    return pv.addInPlace(fi);
                }, new BABYLON.Vector3());
                //positions[idx + 0] += forces.length();
                positions[idx + 1] = -forces.length();
                //positions[idx + 2] += forces.z;

            }
        };
        this._floor.updateMeshPositions(updatePositions, true);
        this._floor.refreshBoundingInfo();
        console.log('updated mesh positions');

    }

    private createStar(pos: BABYLON.Vector3): void {
        var star = new Star(this._scene, pos);
        this._stars.push(star);
        this._gravityWells.push(star);
        var gs = Game.computeGravitationalForceAtPoint(star, star.position.subtractFromFloats(star.radius, 0, star.radius), star.mass);
        console.log('gForce from star', gs);
        star.position.y = -gs.length() / 2;
        this.createPlanet(star);
    }

    private createPlanet(parentStar: Star): void {

        var planet = new Planet(this._scene, parentStar)
        this._planets.push(planet);
        this._gravityWells.push(planet);
    }

    private createShip(): void {
        this._ship = new Ship(this._scene);
        this._ship.position.y = 50;
        this._cameraTarget = new BABYLON.TransformNode("shipNode");
        this._cameraTarget.parent = this._ship.mesh;
        //      this._cameraTarget.setPositionWithLocalVector(new BABYLON.Vector3(0, 30, -24));
    }

    private handleKeyboardInput(): void {
        var
            inputMap = this._inputMap || {},
            ship = this._ship;

        if (inputMap["w"] || inputMap["ArrowUp"]) {
            console.log('fire thrusters!', inputMap);
            ship.fireThrusters();
        }
        if (inputMap["a"] || inputMap["ArrowLeft"]) {
            console.log('arrow left!', inputMap);
            ship.rotation -= ship.maxAngularVelocity;
        }
        if (inputMap["d"] || inputMap["ArrowRight"]) {
            console.log('arrow right!', inputMap);
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
        // if (this._ship.position.y > 200) {
        //     this._ship.position.y = 200;
        // }
        // if (this._ship.position.y < 0) {
        //     this._ship.position.y = 0;
        // }

    }

    private static computeGravitationalForceAtPoint(gravSource: IGravityContributor, testPoint: BABYLON.Vector3, testMass?: number): BABYLON.Vector3 {
        let dCenter = BABYLON.Vector3.Distance(testPoint, gravSource.position),
            sRad = gravSource.radius || 10;

        if (dCenter === 0) { return BABYLON.Vector3.Zero(); }

        let G = 6.67259e-11,
            r = dCenter ^ 2,
            dir = testPoint.subtract(gravSource.position).normalize(),
            m1 = testMass || 100,
            m2 = gravSource.mass || 100;

        // if (this.GravityWellMode === GravityMode.DistanceCubed) {
        //     r = r * dCenter; // r^3 propagation, like electrical fields
        // }
        let f = -(G * (m1 * m2)) / (r);
        return dir.scaleInPlace(f);

    }
    private applyGravitationalForceToShip(gravSource: IGravityContributor): void {
        var dV = Game.computeGravitationalForceAtPoint(gravSource, this._ship.position);

        this._ship.velocity.x += dV.x;
        this._ship.velocity.y += dV.y;
        this._ship.velocity.z += dV.z;
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
        this._scene.activeCamera.update();

    }

    private killShip(): void {
        if (!this._ship.isAlive) { // for how do you kill that which is already dead?
            return;
        }
        this._ship.isAlive = false;
        this._ship.mesh.isVisible = false;
        this._ship.velocity = BABYLON.Vector3.Zero();
        this._ship.mesh.checkCollisions = false;

        this._explosionParticle.emitter = this._ship.mesh;
        this._explosionParticle.start();
        this._scene.executeOnceBeforeRender(() => this.resetShip(), this._respawnTimeLimit);
    }

    private isInTheDangaZone: boolean;

    private moveCamera(): void {
        if (!this.isPaused) {

            this._cameraDolly.position = this._ship.position;
        }


    }
    private createFlyCam(): void {
        var flyCam = new BABYLON.UniversalCamera("CockpitCam", new BABYLON.Vector3(0, 50, -80), this._scene);
        // Airplane like rotation, with faster roll correction and banked-turns.
        // Default is 100. A higher number means slower correction.
        //flyCam.rollCorrect = 10;
        // Default is false.
        //flyCam.bankedTurn = true;
        // Defaults to 90° in radians in how far banking will roll the camera.
        // flyCam.bankedTurnLimit = Math.PI / 2;
        // How much of the Yawing (turning) will affect the Rolling (banked-turn.)
        // Less than 1 will reduce the Rolling, and more than 1 will increase it.
        // flyCam.bankedTurnMultiplier = 1;

        // flyCam.lockedTarget = this._cameraDolly;
        flyCam.layerMask = Game.MAIN_RENDER_MASK;
        flyCam.viewport = new BABYLON.Viewport(0, 0, 1, 1);



        flyCam.rotation.x = 0.28;
        this._flyCam = flyCam;
        this._scene.activeCameras.push(this._flyCam);
        flyCam.parent = this._cameraTarget;
    }
    private enterTheDangerZone(): void {
        console.log('entering TEH DANGA ZONE!');
        let pos = this._ship.position,
            canvas = this._engine.getRenderingCanvas();
        this.isInTheDangaZone = true;
        //    this.moveCamera();
        // this._cameraDolly.position.y = this._ship.position.y + 100;
        //  this._followCam.parent = null;
        //  this._followCam.lockedTarget = this._ship.mesh; 
        // this._cameraDolly.rotation.x =0;
        // this._cameraDolly.rotation.x =0;
        //  this._followCam.position.y = 500;








        //     this._followCam.setEnabled(false);
        //     // This attaches the camera to the canvas
        //    this._flyCam.attachControl(canvas, false);
        //    this._flyCam.setEnabled(true);


        //     this._scene.activeCameras.push(this._flyCam);
        //     this._scene.activeCamera = this._flyCam;
        this._flyCam.parent = this._cameraTarget;
    }

    private leaveTheDangerZone(): void {
        console.log('leaving the DANGER ZONE!');
        // let canvas = this._engine.getRenderingCanvas();
        // this._flyCam.detachControl(canvas);
        // this._followCam.attachControl(canvas, false);
        // this._flyCam.setEnabled(false);
        // this._followCam.setEnabled(true);
        // this._scene.activeCamera = this._followCam;
        this.isInTheDangaZone = false;
        this._followCam.lockedTarget = null;

        this._followCam.position = Game.BaseCameraPosition;
        this._followCam.setTarget(this._ship.position);

        this._followCam.rotation.set(Math.PI / 2, 0, Math.PI);
        this._followCam.parent = this._cameraDolly;





    }

    createScene(): void {
        let self = this;
        this._scene = new BABYLON.Scene(this._engine);
        this._scene.collisionsEnabled = true;
        var gl = new BABYLON.GlowLayer("glow", this._scene);
        this._scene.gravity = BABYLON.Vector3.Zero();
        this.createShip();
        this.createCameraDolly();
        this.createBackground();
        
        this.createFlyCam();
        this.createCamera();
        this.createExplosion();
        for (let i = 0; i < this._starMap.length; i++) {
            let item = this._starMap[i];

            var starPos = new BABYLON.Vector3(item.x, 0, item.y);

            this.createStar(starPos);
        }

   
       
        

        // this.createFollowCamera();


        //   this._scene.activeCamera = this._flyCam;

        this._scene.onKeyboardObservable.add((kbInfo) => {

            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                case BABYLON.KeyboardEventTypes.KEYUP:
                    this._inputMap[kbInfo.event.key] = kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN;
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


            alpha += 0.0001;

        });

        this.updateGridHeightMap();
        this._floor.checkCollisions = true;
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
        });


        this.resetShip();

    }

    doRender(): void {

        this._engine.runRenderLoop(() => {
            let alive = this._ship.isAlive, paused = this.isPaused;

            if (!paused) {
                this.updateShipPositionOverflow();
                this.moveCamera();
                if (alive) {
                    this.handleKeyboardInput();
                    for (var p = 0; p < this._planets.length; p++) {
                        let planet = this._planets[p];
                        if (planet.mesh.intersectsPoint(this._ship.mesh.position)) {
                            console.log('mesh intersection!', this._ship, planet);
                            alive = false;
                            this.killShip();
                            break;
                        }

                    }
                    for (var s = 0; s < this._stars.length; s++) {
                        let star = this._stars[s], sPos = this._ship.position;
                        if (star.mesh.intersectsPoint(sPos)) {
                            console.log('mesh intersection!', this._ship, star);
                            this.killShip();
                            alive = false;
                            break;
                        }
                    }

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