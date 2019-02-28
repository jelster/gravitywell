///<reference path="babylon.d.ts" />

class Ship {
    public velocity : BABYLON.Vector3;
    public maxAcceleration : number;
    public maxAngularVelocity : number;    
    public mesh : BABYLON.Mesh;

    
    private _isAlive : boolean;
    public get isAlive() : boolean {
        return this._isAlive;
    }
    public set isAlive(v : boolean) {
        this._isAlive = v;
    }
    
    
    public get rotation() : number {
        return this.mesh.rotation.z;
    }
    public set rotation(r : number) {
        
        this.mesh.rotation.x = 0;
        this.mesh.rotation.y = r;
        this.mesh.rotation.z = r;
    }

    public get position() : BABYLON.Vector3 {
        return this.mesh.position;
    }
    public set position(p : BABYLON.Vector3) {
        this.mesh.position = p;
    }

    constructor(scene : BABYLON.Scene) {
        this.mesh = BABYLON.MeshBuilder.CreateCylinder("ship", { height: 24, diameterTop: 0, diameterBottom: 24 }, scene);

        this.mesh.rotation.x = Math.PI/2;
        //set base orientation for mesh
        this.mesh.bakeCurrentTransformIntoVertices();
        this.maxAcceleration = 0.01;
        this.maxAngularVelocity = (2*Math.PI)/60;
        this.velocity = new BABYLON.Vector3(.01, 0, 1);

        var shipMat = new BABYLON.StandardMaterial("shipMat", scene);
        shipMat.specularColor = BABYLON.Color3.Blue();
        shipMat.ambientColor = BABYLON.Color3.White();
        shipMat.diffuseColor = BABYLON.Color3.White();
        //shipMat.emissiveColor = BABYLON.Color3.Blue();
        this.mesh.material = shipMat;

        this.isAlive = false;      
      
    }

    public onUpdate() {
        if (this.isAlive) {
            this.position.x += (this.velocity.x * this.mesh.getEngine().getDeltaTime());
            this.position.z += this.velocity.z * this.mesh.getEngine().getDeltaTime();
        }

    }
    /**
     * fireThrusters
     */
    public fireThrusters() {
        
        var dx = Math.sin(this.mesh.rotation.y) * this.maxAcceleration;
        var dz = Math.cos(this.mesh.rotation.z) * this.maxAcceleration;
        // always accelerate in the direction that the craft is currently pointing
        this.velocity.x += dx;
        this.velocity.z += dz;
    }
}
