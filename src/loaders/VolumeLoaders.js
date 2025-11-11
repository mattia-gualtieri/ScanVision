
import * as THREE from 'three';
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader.js';


//Images Loader
export async function loadVolume(path) {
  const loader = new NRRDLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (volume) => {
        
        let voxelData = volume.data;
        if (voxelData instanceof Float64Array) {
          voxelData = new Float32Array(voxelData); 
        }

        voxelData = normalizeDataArray(voxelData);
        
        const texture = new THREE.Data3DTexture(
          voxelData,
          volume.xLength,
          volume.yLength,
          volume.zLength
        );
        

        texture.format = THREE.RedFormat;

        texture.type = THREE.FloatType;
        texture.minFilter = texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        resolve({
          texture,
          size: [volume.xLength, volume.yLength, volume.zLength],
          spacing: volume.spacing || [1, 1, 1]
        });
      },
      undefined,
      (err) => reject(err)
    );
  });
} 



//Normalization of data
function normalizeDataArray(dataArray) {
  let minVal = Infinity;
  let maxVal = -Infinity;

  
  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i];
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
  }


  //Normalizza tutti i valori in [0,1]
  const range = maxVal - minVal;
  if (range === 0) return dataArray; 

  const normalized = new Float32Array(dataArray.length);
  for (let i = 0; i < dataArray.length; i++) {
    normalized[i] = (dataArray[i] - minVal) / range;
  }

  return normalized;
}



//Labels Loader
export async function loadLabel(path) {
  const loader = new NRRDLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (volume) => {
        let labelData = volume.data;


        if (!(labelData instanceof Float32Array)) {
          labelData = new Float32Array(labelData);
        } 
        

        const texture = new THREE.Data3DTexture(
          labelData,
          volume.xLength,
          volume.yLength,
          volume.zLength
        );

        
        texture.format = THREE.RedFormat; 
        texture.type = THREE.FloatType;
        texture.minFilter = texture.magFilter = THREE.NearestFilter; 
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        resolve({
          texture,
          data: labelData, 
          size: [volume.xLength, volume.yLength, volume.zLength],
          spacing: volume.spacing || [1, 1, 1],
        });
      },
      undefined,
      (err) => reject(err)
    );
  });
}







