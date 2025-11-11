import * as THREE from 'three';
import{ OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'lil-gui';
import {loadVolume} from './loaders/VolumeLoaders.js';
import { loadLabel } from './loaders/VolumeLoaders.js';
import { VolumeRenderShader1 } from 'three/examples/jsm/Addons.js';


//Scene
const scene = new THREE.Scene();


//Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: false, 
  powerPreference: "high-performance"
});
renderer.setPixelRatio(window.devicePixelRatio);

const container =document.getElementById('viewer');
container.appendChild(renderer.domElement);
renderer.setSize(container.clientWidth,container.clientHeight);


//Loading Volume
const { texture, size, spacing } = await loadVolume('/dataset/imagesTr_nrrd/ToothFairy2F_001_0000.nrrd');
const dataOriginal = texture.image.data.slice();

//Loading Labels
const {texture: textureL,data:dataL, size: sizeL, spacing: spacingL}= await loadLabel('/dataset/labelsTr_nrrd/ToothFairy2F_001.nrrd');

const { camera, controls, frustumSize } = setupCamera({x: size[0]*spacing[0], y: size[1]*spacing[1], z: size[2]*spacing[2]}, renderer);
scene.add(camera);


window.addEventListener('resize', () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  const aspect = container.clientWidth / container.clientHeight;
  camera.left   = -frustumSize * aspect / 2;
  camera.right  =  frustumSize * aspect / 2;
  camera.top    =  frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
});



const customShader = {
  uniforms: THREE.UniformsUtils.clone(VolumeRenderShader1.uniforms),
  vertexShader: VolumeRenderShader1.vertexShader,
  fragmentShader: VolumeRenderShader1.fragmentShader.replace(
    'const int MAX_STEPS = 887;',
    'const int MAX_STEPS = 444;' 
  )
};

const shader = customShader;

const geometryBox = new THREE.BoxGeometry(size[0], size[1], size[2]);
geometryBox.translate(size[0]/2 -0.5, size[1] / 2 -0.5, size[2] / 2 -0.5); 


const uniforms= THREE.UniformsUtils.clone(shader.uniforms);


uniforms['u_data'].value= texture;
uniforms['u_size'].value.set(size[0], size[1], size[2]);
uniforms['u_clim'].value= new THREE.Vector2(0,1);
uniforms['u_renderstyle'].value= 1; 
uniforms['u_renderthreshold'].value=0.5;
uniforms['u_cmdata'].value= new THREE.TextureLoader().load('/cm_gray.png');


const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: shader.vertexShader,
  fragmentShader: shader.fragmentShader,
  side: THREE.BackSide,

});


const box = new THREE.Mesh(geometryBox, material);
box.scale.set(spacing[0]*-1, spacing[1], spacing[2]);
box.translateOnAxis(new THREE.Vector3(1, 0, 0), size[0]);
scene.add(box);



let minLabel = Infinity;
let maxLabel = -Infinity;
for (let i = 0; i < dataL.length; i++) {
  if (dataL[i] < minLabel) minLabel = dataL[i];
  if (dataL[i] > maxLabel) maxLabel = dataL[i];
}


const geometryLabelBox = new THREE.BoxGeometry(sizeL[0], sizeL[1], sizeL[2]);
geometryLabelBox.translate(sizeL[0]/2 -0.5, sizeL[1]/2 -0.5, sizeL[2]/2 -0.5);


const labelUniforms = THREE.UniformsUtils.clone(shader.uniforms);


labelUniforms['u_data'].value = textureL;
labelUniforms['u_size'].value.set(sizeL[0], sizeL[1], sizeL[2]);
labelUniforms['u_clim'].value = new THREE.Vector2(minLabel, maxLabel); 
labelUniforms['u_renderstyle'].value = 1;
labelUniforms['u_renderthreshold'].value = 0.15;
labelUniforms['u_cmdata'].value = new THREE.TextureLoader().load('/colormap_80labels.png');


const labelMaterial = new THREE.ShaderMaterial({
  uniforms: labelUniforms,
  vertexShader: shader.vertexShader,
  fragmentShader: shader.fragmentShader,
  side: THREE.BackSide,
 
});


const labelBox = new THREE.Mesh(geometryLabelBox, labelMaterial);
labelBox.scale.set(spacingL[0]*-1, spacingL[1], spacingL[2]);
labelBox.translateOnAxis(new THREE.Vector3(1, 0, 0), sizeL[0]);

scene.add(labelBox);


const uniqueLabels =Array.from(new Set(dataL));
const dataLOriginal = dataL.slice();
const groups = anatomicalGroupsCustom(uniqueLabels);



//GUI
const gui = new GUI({ container: container });
const params = { showRawVolume: true };
const groupNames = Object.keys(groups);
groupNames.forEach(name => params[name] = false);

box.visible = true;
labelBox.visible = false;



function updateLabelSelection() {
  const selectedSet = new Set();
  for (const gName of groupNames) {
    if (params[gName]) {
      const labels = groups[gName] || [];
      for (const l of labels) selectedSet.add(l);
    }
  }
  const selectedArray = Array.from(selectedSet);

  let filtered;
  if (selectedArray.length === 0) {
    filtered = new Uint8Array(dataLOriginal.length); 
  } else {
    filtered = filterLabels(selectedArray);
  }

  textureL.image.data.set(filtered);
  textureL.needsUpdate = true;
  labelBox.visible = selectedArray.length > 0;
}


gui.add(uniforms['u_renderthreshold'], 'value', 0.0, 1.0).step(0.01).name('Render Style').onChange(function (value) {
  uniforms['u_renderthreshold'].value = value;
});


gui.add(params, 'showRawVolume').name('RAW Volume').onChange((value) => {
  box.visible = value;
});


const controllers = {};
groupNames.forEach(groupName => {
  controllers[groupName] = gui.add(params, groupName).name(groupName).onChange(() => {
    updateLabelSelection();
  });
});


const actions = {
  toggleAll: () => {
    const anyOff = groupNames.some(n => !params[n]);
    groupNames.forEach(n => {
      params[n] = anyOff;
      if (controllers[n]) controllers[n].setValue(anyOff);
      const dom = controllers[n]?.domElement;
      if (dom) {
        const input = dom.querySelector('input[type="checkbox"]');
        if (input) input.checked = anyOff;
      }
    });
    updateLabelSelection();
  }
};

const actionControllers = {};
actionControllers.toggleAll = gui.add(actions, 'toggleAll').name('Select / Deselect All');




function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();




function filterLabels(selectedLabels) {
  if (!Array.isArray(selectedLabels)) selectedLabels = [selectedLabels];
  const filtered = new Uint8Array(dataLOriginal.length);
  for (let i = 0; i < dataLOriginal.length; i++) {
    if (selectedLabels.includes(dataLOriginal[i])) {
      filtered[i] = dataLOriginal[i];
    } else {
      filtered[i] = 0;
    }
  }
  return filtered;
}





function anatomicalGroupsCustom(uniqueLabels) {
  const groups = {
    'Upper dentition': [],
    'Lower dentition': [],
    'Lower Jawbone': [],
    'Upper Jawbone': [],
    'Left Inferior Alveolar Canal': [],
    'Right Inferior Alveolar Canal': [],
    'Left Maxillary Sinus': [],
    'Right Maxillary Sinus': [],
    'Pharynx': [],
    'Crown': [],
    'Bridge': [],
    'Implant': [],
  };

  for (const label of uniqueLabels) {
    if (label >= 11 && label <= 28) {
      groups['Upper dentition'].push(label);
    } else if (label >= 31) {
      groups['Lower dentition'].push(label);
    } else if (label === 1) {
      groups['Lower Jawbone'].push(label);
    } else if (label === 2) {
      groups['Upper Jawbone'].push(label);
    } else if (label === 3) {
      groups['Left Inferior Alveolar Canal'].push(label);
    } else if (label === 4) {
      groups['Right Inferior Alveolar Canal'].push(label);
    } else if (label === 5) {
      groups['Left Maxillary Sinus'].push(label);
    } else if (label === 6) {
      groups['Right Maxillary Sinus'].push(label);
    } else if (label === 7) {
      groups['Pharynx'].push(label);
    } else if (label === 8) {
      groups['Bridge'].push(label);
    } else if (label === 9) {
      groups['Crown'].push(label);
    } else if (label === 10) {
      groups['Implant'].push(label);
    }
  }

  return groups;
}




function setupCamera(volumeDims, renderer) {
  const aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  const maxDim = Math.max(volumeDims.x, volumeDims.y, volumeDims.z);
  const frustumSize = maxDim * 1.2; 

  const camera = new THREE.OrthographicCamera(
    -frustumSize * aspect / 2,
     frustumSize * aspect / 2,
     frustumSize / 2,
    -frustumSize / 2,
    0.1,
    5000
  );

  const center = {
    x: volumeDims.x / 2,
    y: volumeDims.y / 2,
    z: volumeDims.z / 2
  };

  const offset = maxDim*0.8;
  camera.position.set(center.x + offset, center.y - offset*1.5, center.z + offset);
  camera.up.set(1, 0, 0); 
  camera.lookAt(center.x, center.y, center.z);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(center.x, center.y, center.z);
  controls.enableDamping = false;
  controls.minZoom = 0.2;
  controls.maxZoom = 5;
  controls.enablePan = false;
  controls.update();

  return { camera, controls, frustumSize };
}