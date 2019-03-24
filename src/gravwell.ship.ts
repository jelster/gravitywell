import { Scene, Vector3, Mesh, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

export class Ship {
    public velocity: Vector3;
    public maxAcceleration: number;
    public angularVelocity: number;
    public maxAngularVelocity: number;
    public mesh: Mesh;
    public geForce: Vector3;
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

    constructor(scene: Scene, opts = {maxAcceleration: 0.00667, maxAngularVelocity: 0.1}) {
        this.mesh = MeshBuilder.CreateCylinder("ship", { height: 32, diameterTop: 1, diameterBottom: 32 }, scene);

        this.mesh.rotation.x = Math.PI / 2;
     //   this.mesh.rotation.z = Math.PI / 2;
        //this.mesh.rotation.y = Math.PI / 2;
        //set base orientation for mesh
        this.mesh.bakeCurrentTransformIntoVertices();
        this.maxAcceleration = opts.maxAcceleration
        this.maxAngularVelocity = opts.maxAngularVelocity;
        this.velocity = new Vector3();
        this.angularVelocity = 0.0;

        var shipMat = new StandardMaterial("shipMat", scene);
        shipMat.specularColor = Color3.Blue();
        shipMat.ambientColor = Color3.White();
        shipMat.diffuseColor = Color3.White();
        //shipMat.emissiveColor = Color3.Blue();
        this.mesh.material = shipMat;
        this.mesh.outlineColor = Color3.Blue();
        this.mesh.outlineWidth = 2.4;
        
        this.isAlive = false;
    }

    public onUpdate() {
        let dTime = this.mesh.getEngine().getDeltaTime();
        if (this.angularVelocity > this.maxAngularVelocity) {
            this.angularVelocity = this.maxAngularVelocity;
        }
        
        this.mesh.moveWithCollisions(this.velocity.scale(dTime));

    }
    /**
     * fireThrusters
     */
    public fireThrusters() {

        var dx = Math.sin(this.mesh.rotation.y) * this.maxAcceleration;
        var dy = Math.atan(this.mesh.rotation.z) * this.maxAcceleration;
        var dz = Math.cos(this.mesh.rotation.y) * this.maxAcceleration;
        // always accelerate in the direction that the craft is currently pointing
        this.velocity.x += dx;
        this.velocity.y += dy;
        this.velocity.z += dz;
    }
}