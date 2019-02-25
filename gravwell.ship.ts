///<reference path="babylon.d.ts" />

class Ship {
    public velocity : BABYLON.Vector3;
    public maxAcceleration : number;
    public maxAngularVelocity : number;    
    public mesh : BABYLON.Mesh;
    
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
        this.position = new BABYLON.Vector3(-750, 0, -128);
        this.maxAcceleration = 0.1;
        this.maxAngularVelocity = (2*Math.PI)/60;
        this.velocity = new BABYLON.Vector3(1, 0, 1);

        this.mesh.material = new BABYLON.StandardMaterial("shipMat", scene);
        
      
    }

    public onUpdate() {
         this.position.x += this.velocity.x;
         this.position.z += this.velocity.z;
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
