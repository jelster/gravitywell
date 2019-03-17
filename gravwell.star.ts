///<reference path="babylon.d.ts" />

interface IGravityContributor {
    mass: number;
    radius: number;
    position: BABYLON.Vector3;
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

        this.position = new BABYLON.Vector3(sPos.x + rOrbit * Math.sin(alpha), this.position.y, sPos.z + rOrbit * Math.cos(alpha));

    }
    constructor(scene: BABYLON.Scene, parentStar: Star) {
        this._parentStar = parentStar;
        this.mass = parentStar.mass * 0.3;
        this.radius = 128;
        this._mesh = BABYLON.MeshBuilder.CreateSphere("planet", { segments: 16, diameter: this.radius*2 }, scene);
     //   this._mesh.position.y = 128;
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.rotation.z = Math.PI / 2;
        this.mesh.rotation.y = Math.PI / 2;
        var plantMat = new BABYLON.StandardMaterial("planetMat", scene);
        var planColor = BABYLON.Color3.Gray();
        plantMat.diffuseColor = planColor;
        plantMat.specularColor = BABYLON.Color3.Random();
        this._mesh.material = plantMat;
        this.mesh.outlineColor = BABYLON.Color3.Green();
        this.mesh.outlineWidth = 4;
        this.mesh.renderOutline = true;
        this.position = new BABYLON.Vector3(parentStar.position.x - 3*(2*parentStar.radius), parentStar.position.y, parentStar.position.z + 3*(2*parentStar.radius));
        //this.mesh.ellipsoid = new BABYLON.Vector3(1,1,1);

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
        this.mass = 7.5e7;
        this.radius = 240;

        this._mesh = BABYLON.MeshBuilder.CreateSphere('star', { segments: 16, diameter: 2*this.radius }, scene);
        this._mesh.position = initialPos;
        let sphMat = new BABYLON.StandardMaterial("starMat", scene);
        sphMat.emissiveColor = BABYLON.Color3.Yellow();
        sphMat.diffuseColor = BABYLON.Color3.Yellow();
        sphMat.specularColor = BABYLON.Color3.Magenta();

        this._mesh.material = sphMat;
     
      
        this._light = new BABYLON.PointLight("", new BABYLON.Vector3(0, 100, 0), scene);
        this._light.diffuse = BABYLON.Color3.White();
        this._light.specular = BABYLON.Color3.Yellow();
 
        this._light.intensity = 1;
        this._light.parent = this._mesh;

        this.mesh.checkCollisions = true;

    }
}