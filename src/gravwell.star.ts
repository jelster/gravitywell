import { Vector3, Mesh, Scene, MeshBuilder, StandardMaterial, Color3, PointLight, Scalar } from "@babylonjs/core";
import { IGravityContributor, GravityManager } from "./gravwell.gravitymanager";




export class Planet implements IGravityContributor {

    mass: number;
    radius: number;
    orbitalRadius: number;
    currentAlpha: number;

    public get position(): Vector3 {
        return this._mesh.position;
    }
    public set position(v: Vector3) {
        this._mesh.position = v;
    }
    public get mesh(): Mesh {
        return this._mesh;
    }

    private _parentStar: Star;
    private _mesh: Mesh;

    public movePlanetInOrbit(alphaIncrementAmount: number) {
        // let pPos = this.position,
        //     sPos = this._parentStar.position,
        //     rOrbit = Vector3.Distance(pPos, sPos); // TODO: refactor into planet class        
        this.position.set(this.orbitalRadius * Math.sin(this.currentAlpha), this.position.y, Math.cos(this.currentAlpha) * this.orbitalRadius);
        this.currentAlpha += alphaIncrementAmount;

    }
    constructor(scene: Scene, parentStar: Star) {
        this._parentStar = parentStar;
        this.mass = parentStar.mass * Scalar.RandomRange(0.15, 0.5);
        this.radius = this.mass / Math.pow(GravityManager.GRAV_UNIT, 2.86);//this.radius = GravityManager.GRAV_UNIT * Scalar.RandomRange(1,8);
        this.orbitalRadius = Scalar.RandomRange(this.radius + 2*parentStar.radius, this.radius + 10*parentStar.radius);
        this._mesh = MeshBuilder.CreateSphere("planet", { segments: 16, diameter: this.radius*2 }, scene);
     //   this._mesh.position.y = 128;
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.rotation.z = Math.PI / 2;
        this.mesh.rotation.y = Math.PI / 2;
        var plantMat = new StandardMaterial("planetMat", scene);
        var planColor = Color3.Gray();
        plantMat.diffuseColor = planColor;
        plantMat.specularColor = Color3.Random();
        this._mesh.material = plantMat;
        this.mesh.outlineColor = Color3.Green();
        this.mesh.outlineWidth = 4;
    //    this.mesh.renderOutline = true;
        this.position = new Vector3(parentStar.position.x + this.orbitalRadius, parentStar.position.y, parentStar.position.z + this.orbitalRadius);
        //this.mesh.ellipsoid = new Vector3(1,1,1);
     //   this.mesh.parent = this._parentStar.mesh;
        this.currentAlpha = Scalar.RandomRange(-Scalar.TwoPi, Scalar.TwoPi);
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
        this.radius = this.mass / Math.pow(GravityManager.GRAV_UNIT, 2.76);

        this._mesh = MeshBuilder.CreateSphere('star', { segments: 16, diameter: 2*this.radius }, scene);
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