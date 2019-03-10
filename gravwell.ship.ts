///<reference path="babylon.d.ts" />

class Ship {
    public velocity: BABYLON.Vector3;
    public maxAcceleration: number;
    public angularVelocity: number;
    public maxAngularVelocity: number;
    public mesh: BABYLON.Mesh;


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

    public get position(): BABYLON.Vector3 {
        return this.mesh.position;
    }
    public set position(p: BABYLON.Vector3) {
        this.mesh.position = p;
    }

    constructor(scene: BABYLON.Scene) {
        this.mesh = BABYLON.MeshBuilder.CreateCylinder("ship", { height: 32, diameterTop: 0, diameterBottom: 32 }, scene);

        this.mesh.rotation.x = Math.PI / 2;
     //   this.mesh.rotation.z = Math.PI / 2;
        //this.mesh.rotation.y = Math.PI / 2;
        //set base orientation for mesh
        this.mesh.bakeCurrentTransformIntoVertices();
        this.maxAcceleration = 0.01;
        this.maxAngularVelocity = 0.1;
        this.velocity = new BABYLON.Vector3(.01, 0, 1);
        this.angularVelocity = 0.0;

        var shipMat = new BABYLON.StandardMaterial("shipMat", scene);
        shipMat.specularColor = BABYLON.Color3.Blue();
        shipMat.ambientColor = BABYLON.Color3.White();
        shipMat.diffuseColor = BABYLON.Color3.White();
        //shipMat.emissiveColor = BABYLON.Color3.Blue();
        this.mesh.material = shipMat;
        this.mesh.outlineColor = BABYLON.Color3.Blue();
        this.mesh.outlineWidth = 2.4;
        this.mesh.renderOutline = true;
        this.isAlive = false;
    }

    public onUpdate() {
        let dTime = this.mesh.getEngine().getDeltaTime();
        if (this.angularVelocity > this.maxAngularVelocity) {
            this.angularVelocity = this.maxAngularVelocity;
        }
        
        this.mesh.moveWithCollisions(new BABYLON.Vector3((this.velocity.x * dTime), this.velocity.y * dTime, (this.velocity.z * dTime)));

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
