import { Scene, ParticleSystem, TransformNode, Camera, SphereParticleEmitter, GlowLayer, KeyboardEventTypes, BackgroundMaterial, EnvironmentHelper, Material, CubeTexture, StandardMaterial, TrailMesh } from '@babylonjs/core';
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
import { GameData, Point } from '.';


//import * as Ship from "gravwell.ship" ;// from 'gravwell.ship';


export enum GravityMode {
    DistanceSquared = 1,
    DistanceCubed = 2
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

    resetGame(): void {
        console.log('resetting game');

    }

    static readonly MINIMAP_RENDER_MASK = 1;
    static readonly MAIN_RENDER_MASK = 2;
    static readonly BaseCameraPosition: Vector3 = new Vector3(0, 2300, 0);

    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _scene: Scene;
    private _camera: UniversalCamera;

    private _backgroundTexture: CubeTexture;
    private _floor: Mesh;
    private _skybox: Mesh;

    private _ship: Ship;
    private _inputMap: object;

    private _stars: Array<Star>;
    private _planets: Array<Planet>;
    private _starMap: Array<Point>;

    private _explosionParticle: ParticleSystem;
    private _respawnTimeLimit: number;

    private _cameraDolly: Mesh;
    private _dollySize: number;

    public GravGui: UI;
    public gameWorldSizeX: number;
    public gameWorldSizeY: number;

    public GravityWellMode: GravityMode;
    public isPaused: boolean;

    private _gridMat: GridMaterial;
    private _planetMat: StandardMaterial;

    private _flyCam: UniversalCamera;
    private _cameraTarget: TransformNode;
    private _gravManager: GravityManager;
    private _numberOfPlanets: number;
    private _gameData: GameData;
    private _trailMesh: TrailMesh;

    private initializeGame(gameData?: GameData) {
        gameData = gameData || this._gameData || GameData.createDefault();
        
        this._planets.splice(0, this._planets.length);
        this._stars.splice(0, this._stars.length);

        this._gravManager = new GravityManager(gameData);
        

        this._starMap = gameData.starMap;
        this._numberOfPlanets = gameData.numberOfPlanets;
        this.gameWorldSizeX = gameData.gameWorldSizeX;
        this.gameWorldSizeY = gameData.gameWorldSizeY;
     
        this._dollySize = gameData.miniMapMaxZ/gameData.gravUnit;
        this._respawnTimeLimit = gameData.respawnTimeLimit;

        this.isPaused = true;
        this.createShip();
        this.createCameraDolly();
        this.createBackground();
        
        this.createFlyCam();
        this.createMiniMapCamera();

        this.createExplosion();
        for (let i = 0; i < this._starMap.length; i++) {
            let item = this._starMap[i];

            var starPos = new Vector3(item.x, 0, item.y);

            this.createStar(starPos, this._gameData.starMass);
        }
        this._gravManager.generateDynamicTerrain(this._scene);
        //this._gravManager.gravityMap.mesh.material = this._gridMat;

    }

    constructor(canvasElement: string, gameData: GameData) {
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new Engine(this._canvas, true, {
            deterministicLockstep: true,
            lockstepMaxSteps: 4
        }, true);

        this._gameData = gameData;
        this._inputMap = {};
        this._planets = [];
        this._stars = [];
        this._starMap = [];
    }

    private createMiniMapCamera(): void {
        let gameData = this._gameData,
            camPos = gameData.miniMapCameraPosition;
        this._camera = new UniversalCamera('uniCam', camPos, this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this._camera.maxZ = gameData.miniMapMaxZ;

        var fieldSize = gameData.miniMapMaxZ;
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

    private createFlyCam(): void {
        let gameData = this._gameData;
        var flyCam = new UniversalCamera("CockpitCam", gameData.flyCamRelativePosition , this._scene);
        flyCam.maxZ = gameData.flyCamMaxZ;
        flyCam.layerMask = Game.MAIN_RENDER_MASK;
        flyCam.viewport = new Viewport(0, 0, 1,1 );
        flyCam.rotation.x = 0.28;
        this._flyCam = flyCam;
        this._scene.activeCameras.push(this._flyCam);
        this._scene.cameraToUseForPointers = this._flyCam;
        flyCam.parent = this._cameraTarget;
    }

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
        let gameData = this._gameData;
       
        this._backgroundTexture = new CubeTexture("textures/Space/space", this._scene);
        
        this._skybox = this._scene.createDefaultSkybox(this._backgroundTexture, false, gameData.skyBoxScale);
        this._skybox.layerMask = Game.MAIN_RENDER_MASK;        
        
        // this._floor = MeshBuilder.CreateGround("floor", {
        //     width: gameData.gameWorldSizeX,
        //     height: gameData.gameWorldSizeY,
        //     subdivisionsX: gameData.gameWorldSizeX / gameData.gravUnit,
        //     subdivisionsY: gameData.gameWorldSizeY / gameData.gravUnit,
        //     updatable: true
        // }, this._scene);

        // this._floor.layerMask = Game.MAIN_RENDER_MASK;
        // this._floor.billboardMode = Mesh.BILLBOARDMODE_NONE;
        // this._floor.material = this._gridMat;
        



    }



    private updateGridHeightMap(): void {
        return;
        
        let gravManager = this._gravManager;
       // let updatePositions = function () {
        gravManager.updatePositions(gravManager.heightMap);
        
        
       // };

       // let updateNormalsAfterGravUpdate = false;
       // this._gravManager.gravityMap.beforeUpdate = updatePositions;
       // this._floor.updateMeshPositions(updatePositions, updateNormalsAfterGravUpdate);
       // this._floor.refreshBoundingInfo();
       // console.log('updated mesh positions. Check whether enabling/disabling update of normals might be needed. current value', updateNormalsAfterGravUpdate);

    }

    private createStar(pos: Vector3, mass: number): void {
  
        var star = new Star(this._scene, pos, mass);
        this._stars.push(star);
        this._gravManager.gravWells.push(star);

        //var gs = this._gravManager.computeGravitationalForceAtPoint(star, new Vector3(star.position.x + star.radius, 0, star.position.z), star.mass);
        //  console.log('gForce from star', gs);
        for (var i = 0; i < this._numberOfPlanets; i++) {
            this.createPlanet(star);
        }

        //star.position.y = -gs.length()/2;
        // star.position.y = -star.radius;
    }

    private createPlanet(parentStar: Star): void {
        var planet = new Planet(this._scene, parentStar, this._gameData);
        this._planets.push(planet);
        this._gravManager.gravWells.push(planet);
        //var gs = this._gravManager.computeGravitationalForceAtPoint(planet, new Vector3(planet.position.x + planet.radius, 0, planet.position.z + planet.radius), planet.mass);
        //  console.log('gForce from star', gs);
        // planet.position.y = -gs.length()/2;
    }

    private createShip(): void {
        this._ship = new Ship(this._scene);
        this._cameraTarget = new TransformNode("shipNode");
        this._cameraTarget.parent = this._ship.mesh;

        var trail = new TrailMesh("trailer", this._ship.mesh, this._scene, 48, 512, false);
        trail.position.y = 5000;
        trail.layerMask = Game.MINIMAP_RENDER_MASK;
        var trailMat = new StandardMaterial("trailMat", this._scene);
        trailMat.ambientColor = Color3.Teal();
        trailMat.emissiveColor = Color3.Purple();
        trailMat.specularColor = Color3.Black();
        trailMat.disableLighting = true;
        trail.material = trailMat;
        this._trailMesh = trail;
        
    }

    private handleKeyboardInput(): void {
        let
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
        let gameData = this._gameData;
        if (this._ship.position.x > gameData.skyBoxScale / 2) {
            this._ship.position.x = -gameData.skyBoxScale / 2;
        }
        if (this._ship.position.x < -gameData.skyBoxScale / 2) {
            this._ship.position.x = gameData.skyBoxScale / 2;
        }
        if (this._ship.position.z > gameData.skyBoxScale / 2) {
            this._ship.position.z = -gameData.skyBoxScale / 2;
        }
        if (this._ship.position.z < -gameData.skyBoxScale / 2) {
            this._ship.position.z = gameData.skyBoxScale / 2;
        }
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
        let gameData = this._gameData, ship = this._ship;
        console.log('resetting ship', ship);
        if (!this._ship) { return; }
        this._ship.position.copyFrom(gameData.initialShipPosition);
        this._ship.velocity.setAll(0);
       // this._ship.rotation = 1.57;
        this._ship.isAlive = true;
        this._ship.mesh.isVisible = true;
        this._ship.mesh.checkCollisions = true;
        this._explosionParticle.stop();
        this._trailMesh.start();
        this._scene.activeCamera.update();

    }

    private killShip(): void {
        if (!this._ship.isAlive) { // for how do you kill that which is already dead?
            return;
        }
        this._ship.isAlive = false;
        this._ship.mesh.isVisible = false;
        this._trailMesh.stop();
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



    createScene(): Scene {
        this._scene = new Scene(this._engine);
        this._scene.collisionsEnabled = true;
        this._scene.clearColor = Color4.FromColor3(Color3.BlackReadOnly);
        this._scene.ambientColor =  Color3.White();
        //var gl = new GlowLayer("glow", this._scene);
        this._scene.gravity = Vector3.Zero();
        Planet.InitializeMasterMesh(this._scene);
        this.initializeGame(this._gameData);
        this._scene.onKeyboardObservable.add((kbInfo) => {

            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                case KeyboardEventTypes.KEYUP:
                    this._inputMap[kbInfo.event.key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;
                    break;
            }
        });

        //deterministic steps for update loop
        this._scene.onBeforeRenderObservable.add(() => this.updateRunningGameState());
        
        this.resetShip();
        return this._scene;
    }

    private updateRunningGameState() {
        
        if (this.isPaused) {
            return;
        }
        
        this._planets.forEach(planet => {
            planet.movePlanetInOrbit();
        });
        
    //    this.updateGridHeightMap();

        if (this._ship.isAlive) {
            this._gravManager.onUpdateShipStep(this._ship);
            this._ship.onUpdate();
        }
    }

    doRender(): void {

        this._engine.runRenderLoop(() => {
            let alive = this._ship.isAlive, paused = this.isPaused;

            if (!paused) {
                //this.updateShipPositionOverflow();
                this.moveCamera();
                this.updateGridHeightMap();
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
            var terrHeight = this._gravManager.gravityMap.getHeightFromMap(this._ship.position.x, this._ship.position.z, { normal: this._ship.normal}) + 8;
            this._ship.position.y = terrHeight;
            this._scene.render();

        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
}