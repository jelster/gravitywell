import { Scene, Vector3, Mesh, MeshBuilder, StandardMaterial, Color3, Scalar } from '@babylonjs/core';
import { GameData } from './GameData';

export class Ship {
    public velocity: Vector3;
    public maxAcceleration: number;
    public angularVelocity: number;
    public maxAngularVelocity: number;
    public mesh: Mesh;
    public geForce: Vector3;
    public normal: Vector3 = new Vector3();
    

    public thrustersFiring: boolean = false;

    private _isAlive: boolean;
    public get isAlive(): boolean {
        return this._isAlive;
    }
    public set isAlive(v: boolean) {
        this._isAlive = v;
    }

    public get rotation(): number {
        return this.mesh.rotation.y;
    }
    public set rotation(r: number) {
       
       // this.mesh.rotation.x = 0;
        this.mesh.rotation.y = r;
      //  this.mesh.rotation.z = 0;
    }

    public get position(): Vector3 {
        return this.mesh.position;
    }
    public set position(p: Vector3) {
        this.mesh.position = p;
    }
    private tempVector: Vector3 = new Vector3();
    private _gameData: GameData;

    constructor(scene: Scene, opts: GameData) {
        this._gameData = opts;
        this.mesh = MeshBuilder.CreateCylinder("ship", { height: 8, diameterTop: 1, diameterBottom: 8, tessellation: 2 }, scene);
        this.geForce = new Vector3();
        //this.mesh.rotation.x = Math.PI / 2;
        //this.mesh.rotation.z = -Math.PI / 2;
        //this.mesh.rotation.y = Math.PI / 2;
        //set base orientation for mesh
        this.mesh.bakeCurrentTransformIntoVertices();
        this.maxAcceleration = opts.shipMaxAcceleration
        this.maxAngularVelocity = opts.shipMaxAngularVelocity;
        this.velocity = new Vector3();
        this.angularVelocity = 0.0;

        var shipMat = new StandardMaterial("shipMat", scene);
        shipMat.specularColor = Color3.Blue();
        //shipMat.ambientColor = Color3.White();
        shipMat.diffuseColor = Color3.Blue();
        //shipMat.emissiveColor = Color3.Blue();
        this.mesh.material = shipMat;
        this.mesh.outlineColor = Color3.Blue();
        this.mesh.outlineWidth = 2.4;
        
        this.isAlive = false;
    }

    public onUpdate() {
        let dTime = this.mesh.getEngine().getDeltaTime()/this._gameData.timeScaleFactor, 
            dV = this.velocity.scaleToRef(dTime, this.tempVector);        
       // this.mesh.setDirection(this.normal, this.rotation);
        this.rotation = Scalar.NormalizeRadians(this.rotation + dTime * this.angularVelocity);
        this.angularVelocity = this.angularVelocity - (dTime * (this.angularVelocity * 0.98));
        this.mesh.moveWithCollisions(dV);        
    }
    /**
     * fireThrusters
     */
    public fireThrusters() {
        if (!this.thrustersFiring) {
            this.thrustersFiring = true;
        }
        
    //     var dx = Math.sin(this.mesh.rotation.y) * this.maxAcceleration;
    //     var dy = Math.tan(this.mesh.rotation.y) * this.maxAcceleration;
    //     var dz = Math.cos(this.mesh.rotation.y) * this.maxAcceleration;
    //     // always accelerate in the direction that the craft is currently pointing
    //     this.velocity.x += dx;
    //   //  this.velocity.y += dy;
    //     this.velocity.z += dz;
    }
}