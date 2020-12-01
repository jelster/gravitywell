import { Vector3, Mesh, Scene, MeshBuilder, StandardMaterial, Color3, PointLight, Scalar, InstancedMesh } from "@babylonjs/core";
import { IGravityContributor, GravityManager } from "./gravwell.gravitymanager";
import { GameData } from "./GameData";
import { Game } from "./game";

export class Planet implements IGravityContributor {
    private static _masterMesh: Mesh;
    private static _sphereMaterial: StandardMaterial;

    public static InitializeMasterMesh(scene: Scene) {
        Planet._masterMesh = MeshBuilder.CreateSphere("planet", { segments: 16, diameter: 1 }, scene);
        
        var plantMat = new StandardMaterial("planetMat", scene);
        var planColor = Color3.Random();
        plantMat.diffuseColor = planColor;
        plantMat.specularColor = Color3.Random();
        Planet._masterMesh.material = plantMat;
        var sphereMat = Planet._sphereMaterial = new StandardMaterial("HillSphereMat", scene);
        sphereMat.emissiveColor = Color3.Green();
        sphereMat.alpha = 0.27;
        sphereMat.fogEnabled = false;
        sphereMat.disableLighting = true;
        
    }

    public mass: number;
    public radius: number;
    public orbitalRadius: number;
    
    public orbitalPeriod: number; // TODO
    public orbitalSpeed: number;
    public escapeVelocity: number;
    public gMu: number;
    public surfaceGravity: number;

    public get position(): Vector3 {
        return this._mesh.position;
    }
    public set position(v: Vector3) {
        this._mesh.position = v;
    }
    public get mesh(): InstancedMesh {
        return this._mesh;
    }
    public get starMass(): number {
        return this._starMass;
    }
    public get hillSphereRadius(): number {
        let sM = 3 * this.starMass,
            mRat = this.mass / sM,
            cbMassRat = Math.cbrt(mRat),
            rH = this.orbitalRadius * cbMassRat;
        return rH;
    }
    public get hillSphereMesh(): Mesh {
        return this._hillSphereMesh;
    }

    public parentStar: Star;
    private _mesh: InstancedMesh;
    private _currTheta: number;
    private _starMass: number;
    private _hillSphereMesh: Mesh;
    private _gameData: GameData;

    public movePlanetInOrbit() {
        let angularVel = this.orbitalSpeed / this.orbitalRadius,
            timeSinceLastUpdate = this._mesh.getEngine().getDeltaTime() / this._gameData.timeScaleFactor,
            dT = angularVel * timeSinceLastUpdate,
            angPos = Scalar.Repeat(this._currTheta + (dT), Scalar.TwoPi);

        this.position.set(this.orbitalRadius * Math.sin(angPos), this.position.y, Math.cos(angPos) * this.orbitalRadius);
        this._currTheta = angPos;
    }
    /**
     * Vo = Sqrt(((G*m)/r))
     */
    private CalculateAndSetOrbitalVelocity() {
        let g = GravityManager.GRAV_CONST,
            r = this.orbitalRadius,
            rCubed = Math.pow(r, 3),
            m = this._starMass,
            gM = g * m;

        this.orbitalSpeed = Math.sqrt((gM) / r);
        this.orbitalPeriod = Scalar.TwoPi * Math.sqrt(rCubed / gM);
    }

    constructor(opts: GameData, star: Star) {
        this.parentStar = star;
        let starMass = star.mass, starRad = star.radius, starPos = star.position;
        this._starMass = starMass;
        var starScaleFactor = Scalar.RandomRange(opts.lowerPlanetaryMassScale, opts.upperPlanetaryMassScale);
        
        this.mass = starMass * starScaleFactor;
        this.radius = opts.planetDensity * Math.sqrt(this.mass);
        this.gMu = this.mass * GravityManager.GRAV_CONST;
        this.orbitalRadius = Scalar.RandomRange(this.radius + opts.lowerOrbitalRadiiScale * starRad, this.radius + opts.upperOrbitalRadiiScale * starRad) + starRad;
        this.escapeVelocity = -GravityManager.computeEscapeVelocity(this);
        this.surfaceGravity = -(this.gMu / Math.pow(this.radius, 2));
        this._mesh = Planet._masterMesh.createInstance("PlanetInstance");
        this.mesh.scaling.setAll(2*this.radius);       
        
        let vSolarEsc = -GravityManager.computeEscapeVelocity(star, this.orbitalRadius);
        this.position = new Vector3(starPos.x + this.orbitalRadius, this.surfaceGravity * opts.terrainScaleFactor, starPos.z + this.orbitalRadius);
        this.mesh.ellipsoid = new Vector3(1, 1, 1);
        
        this._currTheta = Scalar.RandomRange(0, Scalar.TwoPi);
         

        this.CalculateAndSetOrbitalVelocity();
        console.log('planetary params calculated', this);

        var hillSphere = MeshBuilder.CreateSphere("hillSphere", { diameterX: 2*this.hillSphereRadius, diameterY: 2*this.hillSphereRadius, diameterZ: 2*this.hillSphereRadius }, this._mesh.getScene());
        //hillSphere.rotation.x = Math.PI / 2;
        hillSphere.position = this.position;
       // hillSphere.parent = this._mesh;
        
        hillSphere.layerMask = Game.MINIMAP_RENDER_MASK;
        hillSphere.isPickable = false;
       // hillSphere.parent = this._mesh;
        hillSphere.material = Planet._sphereMaterial;
        this._hillSphereMesh = hillSphere;
        this._gameData = opts;

        this._mesh.checkCollisions = true;
    }
}

export class Star implements IGravityContributor {

    private _mesh: Mesh;

    public escapeVelocity: number;
    public gMu:number;
    public surfaceGravity: number;

    public get mesh(): Mesh {
        return this._mesh;
    }
    private _light: PointLight;

    private _mass: number;
    public get mass(): number {
        return this._mass;
    }
    public set mass(v: number) {
        this._mass = v;
    }

    private _radius: number;
    public get radius(): number {
        return this._radius;
    }
    public set radius(v: number) {
        this._radius = v;
    }

    public get position(): Vector3 {
        return this._mesh.position;
    }
    public set position(v: Vector3) {
        this._mesh.position = v;
    }

    constructor(scene: Scene, opts: GameData) {
        let starPos = opts.initialStarPosition;

        this.mass = opts.starMass;
        this.radius = opts.starRadius;
        this.gMu = this.mass * GravityManager.GRAV_CONST;
        this.escapeVelocity = -GravityManager.computeEscapeVelocity(this);
        this.surfaceGravity = -(this.gMu / Math.pow(this.radius, 2));
        starPos.y = this.surfaceGravity * opts.terrainScaleFactor;
        
        this._mesh = MeshBuilder.CreateSphere('star', { segments: 16, diameter: 2 * this.radius }, scene);
        this._mesh.position = starPos;
        let sphMat = new StandardMaterial("starMat", scene);
        sphMat.emissiveColor = Color3.FromInts(226, 213, 37);
        sphMat.diffuseColor = Color3.Yellow();
        sphMat.specularColor = Color3.White();
        sphMat.disableLighting = true;

        this._mesh.material = sphMat;


        this._light = new PointLight("starLight", new Vector3(0, Math.abs(this.escapeVelocity), 0), scene);
        this._light.diffuse = Color3.FromHexString('#FF8040');
        this._light.specular = Color3.Yellow();
        this._light.includeOnlyWithLayerMask = Game.MAIN_RENDER_MASK;
        this._light.intensity = 100;
        this._light.parent = this._mesh;
        this._light.range = opts.gameWorldSizeX * 0.95;

        this._mesh.checkCollisions = true;

    }
}