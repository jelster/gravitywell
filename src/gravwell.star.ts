import { Vector3, Mesh, Scene, MeshBuilder, StandardMaterial, Color3, PointLight } from "@babylonjs/core";


export interface IGravityContributor {
    mass: number;
    radius: number;
    position: Vector3;
}

export class Planet implements IGravityContributor {

    mass: number;
    radius: number;


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

    public movePlanetInOrbit(alpha: number) {
        let pPos = this.position,
            sPos = this._parentStar.position,
            rOrbit = Vector3.Distance(pPos, sPos); // TODO: refactor into planet class

        this.position = new Vector3(sPos.x + rOrbit * Math.sin(alpha), this.position.y, sPos.z + rOrbit * Math.cos(alpha));

    }
    constructor(scene: Scene, parentStar: Star) {
        this._parentStar = parentStar;
        this.mass = parentStar.mass * 0.3;
        this.radius = 128;
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
        this.mesh.renderOutline = true;
        this.position = new Vector3(parentStar.position.x - 3*(2*parentStar.radius), parentStar.position.y, parentStar.position.z + 3*(2*parentStar.radius));
        //this.mesh.ellipsoid = new Vector3(1,1,1);

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

    constructor(scene: Scene, initialPos: Vector3) {
        this.mass = 7.5e7;
        this.radius = 240;

        this._mesh = MeshBuilder.CreateSphere('star', { segments: 16, diameter: 2*this.radius }, scene);
        this._mesh.position = initialPos;
        let sphMat = new StandardMaterial("starMat", scene);
        sphMat.emissiveColor = Color3.Yellow();
        sphMat.diffuseColor = Color3.Yellow();
        sphMat.specularColor = Color3.Magenta();

        this._mesh.material = sphMat;
     
      
        this._light = new PointLight("", new Vector3(0, 100, 0), scene);
        this._light.diffuse = Color3.White();
        this._light.specular = Color3.Yellow();
 
        this._light.intensity = 1;
        this._light.parent = this._mesh;

        this.mesh.checkCollisions = true;

    }
}