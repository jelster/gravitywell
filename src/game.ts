import { Scene, ParticleSystem, TransformNode, Camera, SphereParticleEmitter, GlowLayer, KeyboardEventTypes, BackgroundMaterial, EnvironmentHelper, Material, CubeTexture, StandardMaterial, TrailMesh, FollowCamera } from '@babylonjs/core';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3, Color3, Viewport, Color4 } from '@babylonjs/core/Maths/math';
//import { UniversalCamera } from '@babylonjs/core/Cameras/UniversalCamera';
import { Texture, UniversalCamera } from '@babylonjs/core';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Ship } from './gravwell.ship';
import { Star } from './gravwell.star';
import { Planet } from "./Planet";
import { UI } from './gravwell.ui';
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version
import { GravityManager } from './gravwell.gravitymanager';
import { Point } from '.';
import { GameData } from "./GameData";


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
        this._gravManager.gravityMap.useCustomVertexFunction = !this.isPaused;
    }

    resetGame(): void {
        console.log('resetting game');
        this._planets.forEach(planet => {
            this._scene.removeMesh(planet.mesh, true);
            planet.mesh.dispose();
            this._scene.removeMesh(planet.hillSphereMesh, true);
            planet.hillSphereMesh.dispose();
        });
        this._stars.forEach(star => {
            this._scene.removeMesh(star.mesh, true);
            star.mesh.dispose();
        });
        this._gravManager.gravityMap.useCustomVertexFunction = false;
        this._gravManager.gravityMap.updateVertex = null;
        this._scene.removeMesh(this._gravManager.gravityMap.mesh, true);
        this._gravManager.gravityMap.mesh.dispose();
        this.initializeGame(GameData.createDefault());
    }

    public get gameData(): GameData {
        return this._gameData;
    }
    public get ship(): Ship {
        return this._ship;
    }
    public get star(): Star {
        return this._stars[0];
    }
    public get planets(): Array<Planet> {
        return this._planets;
    }

    public static readonly MINIMAP_RENDER_MASK = 0x100000;
    public static readonly MAIN_RENDER_MASK = 0x2000000;
    public static readonly UI_RENDER_MASK = 0x3000000;
    static readonly BaseCameraPosition: Vector3 = new Vector3(0, 2300, 0);

    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _scene: Scene;
    private _camera: FollowCamera;

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

    public gameWorldSizeX: number;
    public gameWorldSizeY: number;

    public GravityWellMode: GravityMode;
    public isPaused: boolean;

    public inFirstPersonView: boolean = true;

    private _flyCam: UniversalCamera;
    private _cameraTarget: TransformNode;
    private _gravManager: GravityManager;
    private _numberOfPlanets: number;
    private _gameData: GameData;
    private _trailMesh: TrailMesh;
    private _miniMapMeshMaterial: Material;
    // private _primaryViewport = new Viewport(0, 0, 1, 1);
    // private _secondaryViewport = new Viewport(0.75, 0.8, 0.99 - 0.75, 0.99 - 0.8);

    private createPrimaryViewport(): Viewport {
        return new Viewport(0, 0, 1, 1);
    }

    private createSecondaryViewport(): Viewport {
        return new Viewport(0.75, 0.8, 0.99 - 0.75, 0.99 - 0.8);
    }

    public swapViewports() {
        if (!this.inFirstPersonView) {

            this._flyCam.viewport = this.createPrimaryViewport();
            this._camera.viewport = this.createSecondaryViewport();
            this._flyCam.layerMask = Game.MAIN_RENDER_MASK;
            this._camera.layerMask = Game.MINIMAP_RENDER_MASK;
            this.inFirstPersonView = !this.inFirstPersonView;
            
            //this._trailMesh.layerMask = Game.MAIN_RENDER_MASK;
            //this._gravManager.gravityMap.mesh.layerMask = Game.MAIN_RENDER_MASK
        }
        else {

            this._camera.viewport = this.createPrimaryViewport();
            this._flyCam.viewport = this.createSecondaryViewport();
            this._flyCam.layerMask = Game.MINIMAP_RENDER_MASK;
            this._camera.layerMask = Game.MAIN_RENDER_MASK;
            this.inFirstPersonView = !this.inFirstPersonView;
            //this._trailMesh.layerMask = Game.MINIMAP_RENDER_MASK;
            //this._gravManager.gravityMap.mesh.layerMask = Game.MINIMAP_RENDER_MASK;
        }

    }
    public initializeGame(gameData?: GameData) {
        if (!this._scene) {
            this.createScene();
        }
        if (gameData) {
            this._gameData = gameData;
        }
        else {
            gameData = this._gameData || GameData.createDefault();
        }

        gameData.startTime = new Date();
        this._planets = [];//.splice(0, this._planets.length);
        this._stars = [];//.splice(0, this._stars.length);

        this._gravManager = new GravityManager(gameData);


        this._starMap = gameData.starMap;
        this._numberOfPlanets = gameData.numberOfPlanets;
        this.gameWorldSizeX = gameData.gameWorldSizeX;
        this.gameWorldSizeY = gameData.gameWorldSizeY;

        this._respawnTimeLimit = gameData.respawnTimeLimit;

        this.isPaused = true;

        this.createStar();
        this.createPlanets(this._stars[0]);

        this._gravManager.generateDynamicTerrain(this._scene);
        this.resetShip();
        //this._gravManager.gravityMap.mesh.material = this._gridMat;

        console.log('game initialized.', this);

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
        this._camera = new FollowCamera('uniCam', camPos, this._scene, this._cameraDolly);
        this._camera.heightOffset = camPos.y;
        this._camera.lowerRotationOffsetLimit = -2*Math.PI;
        this._camera.upperRotationOffsetLimit = 2*Math.PI;
        this._camera.noRotationConstraint = true;
        
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        var fieldSize = gameData.gameWorldSizeX;
        this._camera.maxZ = gameData.miniMapMaxZ;
        
       // var fieldSize = gameData.starRadius * gameData.upperOrbitalRadiiScale;
        this._camera.orthoTop = fieldSize / 2;
        this._camera.orthoBottom = -fieldSize / 2;
        this._camera.orthoLeft = -fieldSize / 2;
        this._camera.orthoRight = fieldSize / 2;
        this._camera.viewport = this.createSecondaryViewport();
        this._camera.layerMask = Game.MINIMAP_RENDER_MASK;

        this._camera.rotation.x = Math.PI / 2;
        //this._camera.rotation.z = Math.PI;

        this._scene.activeCameras.push(this._camera);

    }

    private createFlyCam(): void {
        let gameData = this._gameData;
        var flyCam = new UniversalCamera("CockpitCam", gameData.flyCamRelativePosition, this._scene);
        flyCam.maxZ = gameData.flyCamMaxZ;
        flyCam.fov = 1.65;
        flyCam.layerMask = Game.MAIN_RENDER_MASK;
        flyCam.viewport = this.createPrimaryViewport();

        flyCam.rotation.x = 0.28;
        this._flyCam = flyCam;
        this._scene.activeCameras.push(this._flyCam);

        flyCam.parent = this._cameraTarget;
    }

    private createCameraDolly() {
        //this._cameraDolly = MeshBuilder.CreatePlane("dollyPlane", { size: 1600 }, this._scene);

        this._cameraDolly = MeshBuilder.CreateCylinder("dolly", { height: 500, diameterTop: 500, diameterBottom: 1, tessellation: 2 }, this._scene);
        this._cameraDolly.layerMask = Game.MINIMAP_RENDER_MASK;
        this._cameraDolly.billboardMode = 0;
        this._cameraDolly.isPickable = false;

        //this._cameraDolly.rotation = this._ship.mesh.forward.negate();
        this._cameraDolly.rotation.x = Math.PI / 2;
        this._cameraDolly.rotation.y = Math.PI;
        this._cameraDolly.bakeCurrentTransformIntoVertices();
        this._cameraDolly.computeWorldMatrix(true);
        this._cameraDolly.material = this._scene.getMaterialByName("trailMat");
        //this._cameraDolly.showBoundingBox = true;
        this._cameraDolly.parent = this._ship.mesh;
    }

    private createBackground(): void {
        let gameData = this._gameData;

        this._backgroundTexture = new CubeTexture(gameData.skyboxImagePath, this._scene);

        this._skybox = this._scene.createDefaultSkybox(this._backgroundTexture, false, gameData.skyBoxScale);
        this._skybox.layerMask = Game.MAIN_RENDER_MASK;
        this._skybox.receiveShadows = false;
        this._skybox.infiniteDistance = true;
    }

    private createStar(): void {
        var star = new Star(this._scene, this._gameData);
        this._stars.push(star);
        this._gravManager.gravWells.push(star);
    }

    private createPlanets(parentStar: Star): void {
        for (var i = 0; i < this._numberOfPlanets; i++) {
            var planet = new Planet(this._gameData);
            //   planet.position.y = this._gravManager.computeGravitationalForceAtPoint(planet, planet.position).length();
            this._planets.push(planet);
            this._gravManager.gravWells.push(planet);
        }
    }

    private createShip(): void {
        this._ship = new Ship(this._scene, this._gameData);
        this._cameraTarget = new TransformNode("shipNode");
        this._cameraTarget.parent = this._ship.mesh;

        var trail = new TrailMesh("trailer", this._ship.mesh, this._scene, this._gameData.starRadius * 0.01, this._gameData.starRadius * 5, false);
        //trail.position.y = 5000;
        trail.layerMask = Game.MAIN_RENDER_MASK | Game.MINIMAP_RENDER_MASK;
        var trailMat = new StandardMaterial("trailMat", this._scene);
        trailMat.ambientColor = Color3.Teal();
        trailMat.emissiveColor = Color3.Purple();
        trailMat.specularColor = Color3.Black();
        trailMat.disableLighting = true;

        trail.material = trailMat;
        trailMat.freeze();
        trail.freezeNormals();
        trail.isPickable = false;
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
            ship.angularVelocity -= ship.maxAngularVelocity
        }
        if (inputMap["d"] || inputMap["ArrowRight"]) {
            //  console.log('arrow right!', inputMap);
            ship.angularVelocity += ship.maxAngularVelocity;
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
        this._explosionParticle.particleTexture = new Texture(this.gameData.explosionTexturePath, this._scene);
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
        this._gravManager.gravityMap.update(true);
        //this._ship.position.y = this.star.position.y + 100;
        this._ship.velocity.setAll(0);
        this._ship.geForce.setAll(0);
        this._ship.angularVelocity = 0.0;
        this._ship.thrustersFiring = false;
        // this._ship.rotation = 1.57;
        this._ship.isAlive = true;
        this._ship.mesh.isVisible = true;
        this._ship.mesh.checkCollisions = true;
        this._explosionParticle.stop();

        this._trailMesh.start();
        //  this._scene.activeCamera.update();

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
        this._scene.ambientColor = Color3.White();

        //var gl = new GlowLayer("glow", this._scene);
        this._scene.gravity = Vector3.Zero();
        this.createShip();
        this.createCameraDolly();
        this.createBackground();

        this.createFlyCam();
        this.createMiniMapCamera();

        this.createExplosion();
        Planet.InitializeMasterMesh(this._scene);

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
        // this.initializeGame(this._gameData);
        
        return this._scene;
    }

    private updateRunningGameState() {
        if (this.isPaused) {
            return;
        }

        this._planets.forEach(planet => {
            planet.movePlanetInOrbit();
        });
        //this._gravManager.onUpdateTerrain();
        //    this.updateGridHeightMap();

        if (this._ship.isAlive) {
            this._gravManager.onUpdateShipStep(this._ship);
            this._ship.onUpdate();
        }

    }

    doRender(): void {

        this._engine.runRenderLoop(() => {
            let alive = this._ship.isAlive,
                paused = this.isPaused,
                gD = this._gameData,
                gMan = this._gravManager;
            gD.lastUpdate = new Date();
            gD.lastShipVelocity = this._ship.velocity;
            gD.lastShipGeForce = this._ship.geForce;

            if (!paused) {              
                var terrHeight = gMan.gravityMap.getHeightFromMap(this._ship.position.x, this._ship.position.z, { normal: this._ship.normal }) + 4;
                if (this._ship.position.y < terrHeight) {
                    this._ship.position.y = terrHeight + 10;
                    this._ship.velocity.y *= -0.00001;
                    //console.log('altitude warning', terrHeight, this._ship.position);
                }
                //this.updateShipPositionOverflow();
                //this.moveCamera();
                //this.updateGridHeightMap();
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