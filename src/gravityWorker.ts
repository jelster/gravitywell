import { IGravityContributor } from "./gravwell.gravitymanager";
import { VerticesUpdated } from "./heightMapUpdater";

export class GravityWorker {
    private worker:Worker;
    public lastUpdated:Date;
    public latestHeightMap:Float32Array;

    constructor() {
        var self = this;
        this.worker = new Worker('heightMapUpdater.js'); 
        this.worker.onmessage = self.onWorkerMessage;     
    }

    public go(heightMap:Float32Array, gravSources:Array<IGravityContributor>) {
        this.worker.postMessage({heightMap, gravSources});
    }

    private onWorkerMessage(ev:MessageEvent) {
        const data = ev.data as VerticesUpdated;
        this.latestHeightMap = data.heightMap;
        this.lastUpdated = new Date();
    }    
}
