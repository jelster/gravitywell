import { Scene, ParticleSystem, TransformNode, Camera, SphereParticleEmitter, GlowLayer, KeyboardEventTypes, BackgroundMaterial } from '@babylonjs/core';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3, Color3, Viewport, Color4 } from '@babylonjs/core/Maths/math';
import { FollowCamera } from '@babylonjs/core/Cameras/FollowCamera';
import { UniversalCamera } from '@babylonjs/core/Cameras/UniversalCamera';
import { Texture } from '@babylonjs/core';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { GridMaterial } from '@babylonjs/materials/grid';
import { Scalar } from '@babylonjs/core/Maths/math.scalar';
import { Ship } from './gravwell.ship';
import { Star, Planet } from './gravwell.star';
import { UI } from './gravwell.ui';
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version
import { IGravityContributor, GravityManager } from './gravwell.gravitymanager';
import { number } from 'prop-types';


//import * as Ship from "gravwell.ship" ;// from 'gravwell.ship';


export enum GravityMode {
    DistanceSquared = 1,
    DistanceCubed = 2
}

export class Point {
    public x: number;
    public y: number;
}
export class Game {
    toggleDebugLayer(): any {
        if (this._scene.debugLayer.isVisible()) {
            this._scene.debugLayer.hide();
        }
        else {
            this._scene.debugLayer.show({ handleResize: true });
        }
    }
    togglePause(): void {
        console.log('toggled pause');
        this.isPaused = !this.isPaused;
    }

    static readonly MINIMAP_RENDER_MASK = 1;
    static readonly MAIN_RENDER_MASK = 2;
    static readonly BaseCameraPosition: Vector3 = new Vector3(0, 2300, 0);

    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _scene: Scene;
    private _camera: UniversalCamera;
    private _followCam: FollowCamera;

    private _backgroundTexture: Texture;
    private _floor: Mesh;
    private _skybox: Mesh;

    private _ship: Ship;
    private _inputMap: object;

    private _stars: Array<Star>;
    private _planets: Array<Planet>;
    private readonly _starMap: Array<Point>;

    private _explosionParticle: ParticleSystem;
    private _respawnTimeLimit: number;

    private _cameraDolly: Mesh;
    private _dollySize: number;

    public GravGui: UI;
    public readonly gameWorldSizeX: number;
    public readonly gameWorldSizeY: number;
    public readonly numberOfStars: number;

    public GravityWellMode: GravityMode;
    public isPaused: boolean;

    private _gridMat: GridMaterial;
    private _gravUnit: number;
    private _flyCam: UniversalCamera;
    private _cameraTarget: TransformNode;
    private _gravManager: GravityManager;

    constructor(canvasElement: string, numStars: number = 6) {
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new Engine(this._canvas, true, {
            deterministicLockstep: true,
            lockstepMaxSteps: 4
        }, true);

        this._inputMap = {};
        this._planets = [];
        this._stars = [];
        this._gravManager = new GravityManager();
        this.gameWorldSizeX = 16000;
        this.gameWorldSizeY = 16000;
        this._gravUnit = GravityManager.GRAV_UNIT;

       // let numberOfCells = (this.gameWorldSizeX / this._gravUnit) * (this.gameWorldSizeY / this._gravUnit);
        this._starMap = [];
        // for (let index = 0; index < numStars; index++) {
        //     let randX = Scalar.RandomRange(-this.gameWorldSizeX / 2, this.gameWorldSizeX / 2),
        //         randZ = Scalar.RandomRange(-this.gameWorldSizeY / 2, this.gameWorldSizeY / 2);
        //     this._starMap.push({ x: randX, y: randZ });

        // }
        // this._starMap = [
        //     { x: 1700, y: -2000 },
        //     { x: -1200, y: 600 },
        //     { x: -2000, y: 3000 }
        // ];
        this._starMap.push({ x: 0, y: 0 });

        this.isPaused = true;
        this._respawnTimeLimit = 4000;
        this._dollySize = this.gameWorldSizeX/this._gravUnit;

    }

    private createCamera(): void {
        let camPos = new Vector3(0, this.gameWorldSizeX, 0);
        this._camera = new UniversalCamera('uniCam', camPos, this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this._camera.maxZ = 16000;
        var fieldSize = this.gameWorldSizeX;
        this._camera.orthoTop = fieldSize / 2;
        this._camera.orthoBottom = -fieldSize / 2;
        this._camera.orthoLeft = -fieldSize / 2;
        this._camera.orthoRight = fieldSize / 2;
        this._camera.viewport = new Viewport(0.8, 0.75, 0.99 - 0.8, 1 - 0.75);
        this._camera.layerMask = Game.MINIMAP_RENDER_MASK;

        this._camera.rotation.x = Math.PI / 2;
        this._camera.rotation.z = Math.PI;
        this._scene.activeCameras.push(this._camera);
    }

    // private createFollowCamera(): void {

    //     this._followCam = new FollowCamera("followCam", Game.BaseCameraPosition, this._scene);
    //     //   this._followCam.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

    //     this._followCam.viewport = new Viewport(0, 0, 1, 1);
    //     //   var ratio = this._followCam.viewport.width / this._followCam.viewport.height;

    //     // this._followCam.orthoTop = this._dollySize / (2 * ratio)
    //     // this._followCam.orthoBottom = -this._dollySize / (2 * ratio);
    //     // this._followCam.orthoLeft = -this._dollySize / 2;
    //     // this._followCam.orthoRight = this._dollySize / 2;

    //     this._followCam.layerMask = Game.MAIN_RENDER_MASK;
    //     this._followCam.heightOffset = 200;
    //     this._followCam.radius = 300;
    //     this._followCam.maxCameraSpeed = 20;
    //     this._followCam.cameraAcceleration = .9;
    //     this._followCam.rotationOffset = 180;

    //     this._followCam.upperHeightOffsetLimit = 500;
    //     this._followCam.upperRotationOffsetLimit = 220;
    //     this._followCam.lowerHeightOffsetLimit = 100;
    //     this._followCam.lowerRotationOffsetLimit = 140;
    //     this._followCam.upperRadiusLimit = 800;

    //     //    this._cameraDolly.parent = this._cameraTarget;
    //     this._followCam.parent = this._cameraDolly;
    //     this._followCam.setTarget(this._ship.position);
    //     this._scene.activeCameras.push(this._followCam);

    //     this._followCam.lockedTarget = null;
    //     // this._followCam.attachControl(this._engine.getRenderingCanvas(), true);
    // }

    private createCameraDolly() {
        this._cameraDolly = MeshBuilder.CreatePlane("dollyPlane", { size: this._dollySize }, this._scene);
        // this._cameraDolly.position.y = 165;
        this._cameraDolly.layerMask = Game.MINIMAP_RENDER_MASK;
        this._cameraDolly.rotation.x = Math.PI / 2;
        this._cameraDolly.rotation.z = Math.PI;
        this._cameraDolly.bakeCurrentTransformIntoVertices();
        this._cameraDolly.showBoundingBox = true;
    }

    private createBackground(): void {
        this._backgroundTexture = new Texture("textures/corona_lf.png", this._scene);
        var backMat = new BackgroundMaterial("backMat", this._scene);
        backMat.primaryColor = Color3.Black();
        backMat.reflectionTexture = this._backgroundTexture;
        backMat.useRGBColor = true;
        //   this._backgroundTexture.coordinatesMode = BABYLON.Texture.PROJECTION_MODE;
        // var box = MeshBuilder.CreateBox("box", {
        //     height: this.gameWorldSizeY,
        //     width: this.gameWorldSizeX,
        //     depth: this.gameWorldSizeX,
            
        //     sideOrientation: Mesh.BACKSIDE,
        //     updatable: true
        // },this._scene);
        
        // this._floor = box;
        this._floor = MeshBuilder.CreateGround("floor", {
            width: this.gameWorldSizeX,
            height: this.gameWorldSizeY,
            subdivisionsX: this.gameWorldSizeX / this._gravUnit,
            subdivisionsY: this.gameWorldSizeY / this._gravUnit,
            updatable: true
        }, this._scene);

        this._floor.layerMask = Game.MAIN_RENDER_MASK;        
       // this._floor.billboardMode = Mesh.BILLBOARDMODE_NONE;

        this._gridMat = new GridMaterial("gridMat", this._scene);
        this._gridMat.gridRatio = this._gravUnit;
        this._gridMat.lineColor = Color3.White();
        this._gridMat.mainColor = Color3.Black();       
        
        //backMat.alphaMode = 10;
        // backMat.fillMode = BABYLON.Material.TriangleFillMode;
        

        //this._floor.material= backMat;
        this._floor.material = this._gridMat;
        
    }


    private updateGridHeightMap(): void {
        // var gravWells = this._gravManager.gravWells;
        // var updatePositions = function (positions) {
        //     for (var idx = 0; idx < positions.length; idx += 3) {
        //         var forces = gravWells.reduce(function (pv, cv, ci, arr): Vector3 {
        //             let fi = Game.computeGravitationalForceAtPoint(
        //                 cv, 
        //                 Vector3.Zero().set(
        //                     positions[idx + 0], 
        //                     positions[idx + 1], 
        //                     positions[idx + 2]), cv.mass);

        //             return pv.addInPlace(fi);
        //         }, new Vector3());
        //         //positions[idx + 0] += forces.length();
        //         positions[idx + 1] = -forces.length();
        //         //positions[idx + 2] += forces.z;

        //     }
        //};

        var gravManager = this._gravManager;
        var updatePositions = function (positions) {
            //        console.log('using grav manager to update mesh positions', gravManager);
            gravManager.updatePositions(positions);
        };

        this._floor.updateMeshPositions(updatePositions, true);
        this._floor.refreshBoundingInfo();
        console.log('updated mesh positions');

    }

    private createStar(pos: Vector3): void {
        var star = new Star(this._scene, pos);
        this._stars.push(star);
        this._gravManager.gravWells.push(star);
        
        var gs = this._gravManager.computeGravitationalForceAtPoint(star, new Vector3(star.position.x + star.radius, 0, star.position.z), star.mass);
        //  console.log('gForce from star', gs);
        
        this.createPlanet(star);
        this.createPlanet(star);
        this.createPlanet(star);
        this.createPlanet(star);
        //star.position.y = -gs.length()/2;
       // star.position.y = -star.radius;
        
    }

    private createPlanet(parentStar: Star): void {

        var planet = new Planet(this._scene, parentStar)
        this._planets.push(planet);
        this._gravManager.gravWells.push(planet);
        var gs = this._gravManager.computeGravitationalForceAtPoint(planet, new Vector3(planet.position.x + planet.radius, 0, planet.position.z + planet.radius), planet.mass);
        //  console.log('gForce from star', gs);
       // planet.position.y = -gs.length()/2;
    }

    private createShip(): void {
        this._ship = new Ship(this._scene);
        this._cameraTarget = new TransformNode("shipNode");
        this._cameraTarget.parent = this._ship.mesh;
        //      this._cameraTarget.setPositionWithLocalVector(new BABYLON.Vector3(0, 30, -24));
    }

    private handleKeyboardInput(): void {
        var
            inputMap = this._inputMap || {},
            ship = this._ship;

        if (inputMap["w"] || inputMap["ArrowUp"]) {
            //   console.log('fire thrusters!', inputMap);
            ship.fireThrusters();
        }
        if (inputMap["a"] || inputMap["ArrowLeft"]) {
            //    console.log('arrow left!', inputMap);
            ship.rotation -= ship.maxAngularVelocity;
        }
        if (inputMap["d"] || inputMap["ArrowRight"]) {
            //  console.log('arrow right!', inputMap);
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

    
    private applyGravitationalForceToShip(gravSource: IGravityContributor): void {
        let sV = this._ship.velocity, gForce = this._ship.geForce;
        this._gravManager.computeGravitationalForceAtPointToRef(gravSource, this._ship.position, 1000, gForce)
        sV.addInPlace(gForce);       
    }

    private createExplosion(): void {

        this._explosionParticle = new ParticleSystem("explosion", 200, this._scene);
        this._explosionParticle.particleTexture = new Texture("textures/explosion-3.png", this._scene);
        this._explosionParticle.particleEmitterType = new SphereParticleEmitter(5, 0);
        this._explosionParticle.preventAutoStart = true;
        this._explosionParticle.disposeOnStop = false;
        this._explosionParticle.startDelay = 0;

        // Colors of all particles (splited in 2 + specific color before dispose)
        this._explosionParticle.color1 = new Color4(0.7, 0.8, 1.0, 1);
        this._explosionParticle.color2 = new Color4(0.2, 0.5, 1.0, 1);
        this._explosionParticle.colorDead = new Color4(0, 0, 0.2, 0.0);

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
        this._explosionParticle.blendMode = ParticleSystem.BLENDMODE_ADD;


    }

    private resetShip(): void {
        console.log('resetting ship', this._ship);
        if (!this._ship) { return; }
        this._ship.position.set(-this.gameWorldSizeX/2, 500, 64);
        this._ship.velocity.setAll(0);
        this._ship.rotation = 1.57;
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
        this._ship.velocity = Vector3.Zero();
        this._ship.mesh.checkCollisions = false;

        this._explosionParticle.emitter = this._ship.mesh;
        this._explosionParticle.start();
        this._scene.executeOnceBeforeRender(() => this.resetShip(), this._respawnTimeLimit);
    }

    private moveCamera(): void {
        if (!this.isPaused) {
            this._cameraDolly.position = this._ship.position;
        }

    }
    private createFlyCam(): void {
        var flyCam = new UniversalCamera("CockpitCam", new Vector3(0, 50, -80), this._scene);

        flyCam.layerMask = Game.MAIN_RENDER_MASK;
        flyCam.viewport = new Viewport(0, 0, 1, 1);
        flyCam.rotation.x = 0.28;
        this._flyCam = flyCam;
        this._scene.activeCameras.push(this._flyCam);
        flyCam.parent = this._cameraTarget;
    }

    private leaveTheDangerZone(): void {
        console.log('leaving the DANGER ZONE!');
        // let canvas = this._engine.getRenderingCanvas();
        // this._flyCam.detachControl(canvas);
        // this._followCam.attachControl(canvas, false);
        // this._flyCam.setEnabled(false);
        // this._followCam.setEnabled(true);
        // this._scene.activeCamera = this._followCam;        
        this._followCam.lockedTarget = null;

        this._followCam.position = Game.BaseCameraPosition;
        this._followCam.setTarget(this._ship.position);

        this._followCam.rotation.set(Math.PI / 2, 0, Math.PI);
        this._followCam.parent = this._cameraDolly;
    }

    createScene(): void {
        let self = this;
        this._scene = new Scene(this._engine);
        this._scene.collisionsEnabled = true;
        var gl = new GlowLayer("glow", this._scene);
        this._scene.gravity = Vector3.Zero();
        this.createShip();
        this.createCameraDolly();
        this.createBackground();
        this.createCamera();
        this.createFlyCam();

        this.createExplosion();
        for (let i = 0; i < this._starMap.length; i++) {
            let item = this._starMap[i];

            var starPos = new Vector3(item.x, 0, item.y);

            this.createStar(starPos);
        }

        this._scene.onKeyboardObservable.add((kbInfo) => {

            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                case KeyboardEventTypes.KEYUP:
                    this._inputMap[kbInfo.event.key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;
                    break;
            }
        });

       
        //deterministic steps for update loop
        this._scene.onBeforeRenderObservable.add(() => {
            if (this.isPaused) {
                return;
            }

            this._planets.forEach(planet => {
                planet.movePlanetInOrbit(0.0025);
            });

            this._gravManager.gravWells.forEach(gravWell => {
                if (this._ship.isAlive) {
                    this.applyGravitationalForceToShip(gravWell);
                }
            });

            this.updateGridHeightMap();
            this._ship.onUpdate();

        });

        //  this._floor.checkCollisions = true;
        this._ship.mesh.checkCollisions = true;
        this._stars.forEach(star => {
            //     star.mesh.checkCollisions = true;
        });
        this._planets.forEach(planet => {
            //     planet.mesh.checkCollisions = true;
        });

        this.resetShip();

    }

    doRender(): void {


        this._engine.runRenderLoop(() => {
            let alive = this._ship.isAlive, paused = this.isPaused;

            if (!paused) {
                this.updateShipPositionOverflow();
                this.moveCamera();
                // this.updateGridHeightMap();
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
            this._scene.render();

        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
}