import { Vector3, Mesh, Scene, MeshBuilder, StandardMaterial, Color3, PointLight } from "@babylonjs/core";
import { IGravityContributor } from "./gravwell.gravitymanager";
import { GameData } from "./GameData";
import { Game } from "./game";

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

    constructor(scene: Scene, opts: GameData) {
        let starPos = opts.initialStarPosition;

        this.mass = opts.starMass;
        this.radius = opts.starRadius;

        this._mesh = MeshBuilder.CreateSphere('star', { segments: 16, diameter: 2 * this.radius }, scene);
        this._mesh.position = starPos;
        let sphMat = new StandardMaterial("starMat", scene);
        sphMat.emissiveColor = Color3.FromInts(226, 213, 37);
        sphMat.diffuseColor = Color3.Yellow();
        sphMat.specularColor = Color3.White();
        sphMat.disableLighting = true;

        this._mesh.material = sphMat;


        this._light = new PointLight("starLight", new Vector3(0, 0, 0), scene);
        this._light.diffuse = Color3.FromHexString('#FF8040');
        this._light.specular = Color3.Yellow();
        this._light.includeOnlyWithLayerMask = Game.MAIN_RENDER_MASK;
        this._light.intensity = 5.5;
        this._light.parent = this._mesh;
        this._light.range = opts.gameWorldSizeX * 0.95;

    }
}