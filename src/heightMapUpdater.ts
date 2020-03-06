import { IGravityContributor } from "./gravwell.gravitymanager";
import { Vector3 } from "@babylonjs/core";

const verticesUpdated = {
    heightMap: new Float32Array(),
    gravSources: new Array<IGravityContributor>()
};
let forceVector = new Vector3();
let tmpVector = new Vector3();
let forceLength = 0;

function updateVertices() {
    
}
function updateVertex(vertex, i, j) {
   
    forceVector.setAll(0);
    tmpVector.setAll(0);
    forceLength = 0;

    let heightMapIdx = 3*vertex.mapIndex + 1;
    
    // for (var gidx = 0; gidx < self.gravWells.length; gidx++) {
    //     let gwA = self.gravWells[gidx];
        
    //     self.computeGravitationalForceAtPointToRef(gwA, vertex.worldPosition, 1, self.tmpVector);                 
    //     forceVector.addInPlace(self.tmpVector);
    // }

    // forceLength = Scalar.Clamp(forceVector.length(), forceMinimum, forceLimit);
    // if (forceLength > maxForceEncountered) {
    //     maxForceEncountered = forceLength;
    // }        
    // self.gravityMap.mapData[heightMapIdx] = -(forceLength * terrainGravScaleFactor);
   // var colorPerc = Scalar.RangeToPercent(Math.log(forceLength)-1, 0, Math.log(maxForceEncountered)+1);
   // Color4.LerpToRef(baseColor, endColor, colorPerc, tmpColor);
    //vertex.color.set(tmpColor.r, tmpColor.g, tmpColor.b, tmpColor.a);

};

export type VerticesUpdated = typeof verticesUpdated;