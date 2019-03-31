import { Vector3, Mesh, Scene, MeshBuilder, StandardMaterial, Color3, PointLight, Scalar, InstancedMesh } from "@babylonjs/core";
import { IGravityContributor, GravityManager } from "./gravwell.gravitymanager";
import { GameData } from ".";




export class Planet implements IGravityContributor {
    private static _masterMesh: Mesh;

    public static InitializeMasterMesh(scene: Scene) {
        Planet._masterMesh = MeshBuilder.CreateSphere("planet", { segments: 16, diameter: 1 }, scene);
        Planet._masterMesh.rotation.x = Math.PI / 2;
        Planet._masterMesh.bakeCurrentTransformIntoVertices();
        var plantMat = new StandardMaterial("planetMat", scene);
        var planColor = Color3.Random();
        plantMat.diffuseColor = planColor;
        plantMat.specularColor = Color3.Random();
        Planet._masterMesh.material = plantMat;
    }

    public mass: number;
    public radius: number;
    public orbitalRadius: number;
    public totalElapsedTime: number;
    public orbitalPeriod: number; // TODO
    public orbitalSpeed: number;

    public get position(): Vector3 {
        return this._mesh.position;
    }
    public set position(v: Vector3) {
        this._mesh.position = v;
    }
    public get mesh(): InstancedMesh {
        return this._mesh;
    }

    public parentStar: Star;
    private _mesh: InstancedMesh;
    private _currTheta: number;

    public movePlanetInOrbit() {
        let angularVel = this.orbitalSpeed / this.orbitalRadius,
            timeSinceLastUpdate = this._mesh.getEngine().getDeltaTime() / 1000,
            dT = angularVel * timeSinceLastUpdate,
            angPos = Scalar.Repeat(this._currTheta + (dT), Scalar.TwoPi);
        //     rOrbit = Vector3.Distance(pPos, sPos); // TODO: refactor into planet class        
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
            m = this.parentStar.mass,
            gM = g * m;

        this.orbitalSpeed = Math.sqrt((gM) / r);
        this.orbitalPeriod = Scalar.TwoPi * Math.sqrt(rCubed / gM);
    }
    constructor(scene: Scene, parentStar: Star, opts: GameData) {

        this.parentStar = parentStar;
        var starScaleFactor = Scalar.RandomRange(opts.lowerPlanetaryMassScale, opts.upperPlanetaryMassScale);
        this.mass = parentStar.mass * starScaleFactor;
        this.radius = opts.planetDensity * Math.sqrt(this.mass);
        this.orbitalRadius = Scalar.RandomRange(this.radius + opts.lowerOrbitalRadiiScale * parentStar.radius, this.radius + opts.upperOrbitalRadiiScale * parentStar.radius) + parentStar.radius;

        this._mesh = Planet._masterMesh.createInstance("PlanetInstance");
        this.mesh.scaling = new Vector3(this.radius, this.radius, this.radius);
        //   this._mesh.position.y = 128;
        this.mesh.outlineColor = Color3.Green();
        this.mesh.outlineWidth = 4;
        //    this.mesh.renderOutline = true;
        this.position = new Vector3(parentStar.position.x + this.orbitalRadius, parentStar.position.y, parentStar.position.z + this.orbitalRadius);
        //this.mesh.ellipsoid = new Vector3(1,1,1);
        //   this.mesh.parent = this._parentStar.mesh;
        this._currTheta = Scalar.RandomRange(0, Scalar.TwoPi);
        this.totalElapsedTime = 0.0;

        this.CalculateAndSetOrbitalVelocity();
        console.log('planetary params calculated', this);
    }
}

export class Star implements IGravityContributor {

    private _mesh: Mesh;
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

    constructor(scene: Scene, initialPos: Vector3, mass: number) {
        this.mass = mass;
        this.radius = (0.000940 / 36) * Math.sqrt(mass);


        this._mesh = MeshBuilder.CreateSphere('star', { segments: 16, diameter: 2 * this.radius }, scene);
        this._mesh.position = initialPos;
        let sphMat = new StandardMaterial("starMat", scene);
        sphMat.emissiveColor = Color3.Yellow();
        sphMat.diffuseColor = Color3.Yellow();
        sphMat.specularColor = Color3.Magenta();

        this._mesh.material = sphMat;


        this._light = new PointLight("starLight", new Vector3(0, 0, 0), scene);
        this._light.diffuse = Color3.FromHexString('#FF8040');
        this._light.specular = Color3.Yellow();

        this._light.intensity = 7.5;
        this._light.parent = this._mesh;

    }
}