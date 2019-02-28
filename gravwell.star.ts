///<reference path="babylon.d.ts" />

interface IGravityContributor {
    mass: number;
    radius: number;
    position: BABYLON.Vector3
}

class Planet implements IGravityContributor {

    mass: number;
    radius: number;


    public get position(): BABYLON.Vector3 {
        return this._mesh.position;
    }
    public set position(v: BABYLON.Vector3) {
        this._mesh.position = v;
    }
    public get mesh(): BABYLON.Mesh {
        return this._mesh;
    }

    private _parentStar: Star;
    private _mesh: BABYLON.Mesh;

    public movePlanetInOrbit(alpha: number) {
        let pPos = this.position,
            sPos = this._parentStar.position,
            rOrbit = BABYLON.Vector3.Distance(pPos, sPos); // TODO: refactor into planet class

        this.position = new BABYLON.Vector3(sPos.x + rOrbit * Math.sin(alpha), 0, sPos.z + rOrbit * Math.cos(alpha));

    }
    constructor(scene: BABYLON.Scene, parentStar: Star) {
        this._parentStar = parentStar;
        this._mesh = BABYLON.MeshBuilder.CreateSphere("planet", { segments: 16, diameter: 96 }, scene);
        
        
        var plantMat = new BABYLON.StandardMaterial("planetMat", scene);
        var planColor = BABYLON.Color3.Gray();
        plantMat.diffuseColor = planColor;
        plantMat.specularColor = BABYLON.Color3.Random();
        this._mesh.material = plantMat;
        this.mass = parentStar.mass * 0.3;
        this.radius = 52;
        this.position = new BABYLON.Vector3(parentStar.position.x - 8.5*this.radius, 0, parentStar.position.z + 8.5*this.radius);

    }
}

class Star implements IGravityContributor {

    private _mesh: BABYLON.Mesh;
    public get mesh(): BABYLON.Mesh {
        return this._mesh;
    }
    private _light: BABYLON.PointLight;

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

    public get position(): BABYLON.Vector3 {
        return this._mesh.position;
    }
    public set position(v: BABYLON.Vector3) {
        this._mesh.position = v;
    }

    constructor(scene: BABYLON.Scene, initialPos: BABYLON.Vector3) {
        this._mesh = BABYLON.MeshBuilder.CreateSphere('star', { segments: 16, diameter: 160 }, scene);
        let sphMat = new BABYLON.StandardMaterial("starMat", scene);
        sphMat.emissiveColor = BABYLON.Color3.Yellow();
        sphMat.diffuseColor = BABYLON.Color3.Yellow();
        sphMat.specularColor = BABYLON.Color3.Magenta();

        this._mesh.material = sphMat;
        this.mass = 7.5e7;
        this.radius = 80;
        this._mesh.position = initialPos;

        this._light = new BABYLON.PointLight("", new BABYLON.Vector3(0, 100, 0), scene);
        this._light.diffuse = BABYLON.Color3.White();
        this._light.specular = BABYLON.Color3.Yellow();
 
        this._light.intensity = 1;
        this._light.position.x = this._mesh.position.x;
        this._light.position.z = this._mesh.position.z;

        this.mesh.checkCollisions = true;

    }
}