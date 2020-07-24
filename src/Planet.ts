import { Vector3, Mesh, Scene, MeshBuilder, StandardMaterial, Color3, Scalar, InstancedMesh } from "@babylonjs/core";
import { IGravityContributor, GravityManager } from "./gravwell.gravitymanager";
import { GameData } from "./GameData";
import { Game } from "./game";
import { Star } from "./gravwell.star";
export class Planet implements IGravityContributor {
    private static _masterMesh: Mesh;
    private static _sphereMaterial: StandardMaterial;
    density: number;
    escapeVelocity: number;
    public static InitializeMasterMesh(scene: Scene) {
        Planet._masterMesh = MeshBuilder.CreateSphere("planet", { segments: 16, diameter: 1 }, scene);
        Planet._masterMesh.rotation.x = Math.PI / 2;
        Planet._masterMesh.bakeCurrentTransformIntoVertices();
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
    public totalElapsedTime: number;
    public orbitalPeriod: number; // TODO
    public orbitalSpeed: number;
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
        let sM = 3 * this.starMass, mRat = this.mass / sM, cbMassRat = Math.cbrt(mRat), rH = this.orbitalRadius * cbMassRat;
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
    
    public movePlanetInOrbit() {
        let angularVel = this.orbitalSpeed / this.orbitalRadius, timeSinceLastUpdate = this._mesh.getEngine().getDeltaTime() / 1000, dT = angularVel * timeSinceLastUpdate, angPos = Scalar.Repeat(this._currTheta + (dT), Scalar.TwoPi);
        this.position.set(this.orbitalRadius * Math.sin(angPos), this.position.y, Math.cos(angPos) * this.orbitalRadius);
        this._currTheta = angPos;
    }
    /**
     * Vo = Sqrt(((G*m)/r))
     */
    private CalculateAndSetOrbitalVelocity() {
        let g = GravityManager.GRAV_CONST, r = this.orbitalRadius, rCubed = Math.pow(r, 3), m = this._starMass, gM = g * m;
        this.orbitalSpeed = Math.sqrt((gM) / r);
        this.orbitalPeriod = Scalar.TwoPi * Math.sqrt(rCubed / gM);
    }
    constructor(opts: GameData) {
        let starMass = opts.starMass, 
            starRad = opts.starRadius, 
            starPos = opts.initialStarPosition;
        
        this._mesh = Planet._masterMesh.createInstance("PlanetInstance");

        this._starMass = starMass;
        var starScaleFactor = Scalar.RandomRange(opts.lowerPlanetaryMassScale, opts.upperPlanetaryMassScale);

        this.density = Scalar.RandomRange(opts.planetDensity/100, opts.planetDensity);
        this.mass = starMass * starScaleFactor;
        var vol = (this.mass / this.density) / ((4/3)*Math.PI);
        var r = Math.cbrt(vol);
        this.radius = r;
        this.surfaceGravity = -(GravityManager.GRAV_CONST * this.mass) / Math.pow(this.radius, 2);
        this.escapeVelocity = Math.sqrt(((2*GravityManager.GRAV_CONST*this.mass)/this.radius));
        this.orbitalRadius = Scalar.RandomRange(this.radius + opts.lowerOrbitalRadiiScale * starRad, this.radius + opts.upperOrbitalRadiiScale * starRad) + starRad;
        this.position = new Vector3(starPos.x + this.orbitalRadius, (this.surfaceGravity), starPos.z + this.orbitalRadius);

        this.mesh.scaling = new Vector3(this.radius, this.radius, this.radius);
        this.mesh.ellipsoid = new Vector3(1, 1, 1);
        this._currTheta = Scalar.RandomRange(0, Scalar.TwoPi);
        this.totalElapsedTime = 0.0;
        this.CalculateAndSetOrbitalVelocity();
        console.log('planetary params calculated', this);
        var hillSphere = MeshBuilder.CreateSphere("", { diameterX: this.hillSphereRadius, diameterY: this.hillSphereRadius, diameterZ: this.hillSphereRadius }, this._mesh.getScene());
        //hillSphere.rotation.x = Math.PI / 2;
        hillSphere.position = this.position;
        // hillSphere.parent = this._mesh;
        hillSphere.layerMask = Game.MINIMAP_RENDER_MASK;
        hillSphere.isPickable = false;
        // hillSphere.parent = this._mesh;
        hillSphere.material = Planet._sphereMaterial;
        this._hillSphereMesh = hillSphere;
    }
}
