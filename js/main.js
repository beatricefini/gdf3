document.addEventListener("DOMContentLoaded", () => {
  const marker = document.getElementById("marker");
  const container = document.getElementById("pieces");
  const cameraEl = document.querySelector("a-camera");

  const modelIds = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];
  const pieces = [];

  const positions = [
    { x: -0.2, y: 0, z: 0 },  
    { x: -0.5, y: 0.6, z: 0 }, 
    { x: 0.2, y: 0, z: 0 },   
    { x: 0.15, y: -0.5, z: 0 }, 
    { x: 0.15, y: -0.45, z: 0 }, 
    { x: -0.1, y: 0.3, z: 0 }  
  ];

  const scales = [0.15,0.35,0.15,0.2,0.35,0.35];
  const centerPos = { x: 0, y: 0, z: 0 };
  const centerScale = 0.3;
  const raggioSnap = 0.1;

  // --- SCRITTA DRAG HERE ---
  const dragText = document.createElement('a-text');
  dragText.setAttribute('value', 'Drag Here');
  dragText.setAttribute('align', 'center');
  dragText.setAttribute('color', '#FFD700');
  dragText.setAttribute('position', `${centerPos.x} ${centerPos.y + 0.05} ${centerPos.z}`);
  dragText.setAttribute('scale', '0.25 0.25 0.25');
  dragText.setAttribute('id', 'dragText');
  container.appendChild(dragText);

  function createPiece(idx){
    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', modelIds[idx]);
    piece.setAttribute('position', { x: positions[idx].x, y: positions[idx].y, z: positions[idx].z });
    piece.setAttribute('scale', { x: 0, y: 0, z: 0 });
    piece.dataset.locked = "false";

    piece.addEventListener('model-loaded', () => {
      piece.setAttribute('animation__pop', {
        property: 'scale',
        from: '0 0 0',
        to: `${scales[idx]} ${scales[idx]} ${scales[idx]}`,
        dur: 500,
        easing: 'easeOutElastic'
      });
    });

    container.appendChild(piece);
    pieces.push(piece);
  }

  // --- Drag & drop ---
  let selectedPiece = null;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function updateMouse(event){
    if(event.touches){
      mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    } else {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
  }

  function checkSnap(piece){
    const pos = piece.object3D.position;
    const distanza = Math.sqrt((pos.x - centerPos.x)**2 + (pos.y - centerPos.y)**2 + (pos.z - centerPos.z)**2);
    if(distanza < raggioSnap){
      piece.setAttribute('position', {...centerPos});
      piece.setAttribute('scale', { x: centerScale, y: centerScale, z: centerScale });
      piece.dataset.locked = "true";
    }
  }

  function onPointerDown(event){
    updateMouse(event);
    raycaster.setFromCamera(mouse, cameraEl.getObject3D('camera'));
    const intersects = raycaster.intersectObjects(
      pieces.filter(p => p.dataset.locked === "false").map(p => p.object3D), true
    );
    if(intersects.length>0){
      selectedPiece = intersects[0].object.el;
      selectedPiece.object3D.position.y += 0.01;
    }
  }

  function onPointerMove(event){
    if(!selectedPiece || selectedPiece.dataset.locked === "true") return;
    updateMouse(event);
    raycaster.setFromCamera(mouse, cameraEl.getObject3D('camera'));

    const distance = cameraEl.object3D.position.z || 1;
    const dir = new THREE.Vector3();
    raycaster.ray.direction.clone().normalize().multiplyScalar(distance);
    const targetPos = raycaster.ray.origin.clone().add(dir);

    const currentPos = selectedPiece.object3D.position;
    const lerpFactor = 0.15;
    currentPos.x += (targetPos.x - currentPos.x) * lerpFactor;
    currentPos.y += (targetPos.y - currentPos.y) * lerpFactor;
    currentPos.z = 0;
    selectedPiece.setAttribute('position', currentPos);

    checkSnap(selectedPiece);

    if(pieces.every(p=>p.dataset.locked==='true')){
      const textEl = document.getElementById('dragText');
      if(textEl) textEl.parentNode.removeChild(textEl);

      pieces.forEach(p => { if(p.parentNode) p.parentNode.removeChild(p); });

      // --- CREA MODELLO FINALE ---
      const finalShape = document.createElement('a-entity');
      finalShape.setAttribute('gltf-model','models/piece_final.glb');
      finalShape.setAttribute('position',{...centerPos});
      finalShape.setAttribute('scale',{x:centerScale, y:centerScale, z:centerScale});
      container.appendChild(finalShape);

      // --- ANIMAZIONE FLUTTUANTE ---
      finalShape.setAttribute('animation__float', {
        property: 'position',
        dir: 'alternate',
        dur: 1000,
        easing: 'easeInOutSine',
        loop: true,
        to: `${centerPos.x} ${centerPos.y + 0.3} ${centerPos.z}`
      });

      // --- DOPO 3 SECONDI ---
      setTimeout(() => {
        finalShape.removeAttribute('animation__float');

        // ridimensiona e sposta in alto a sinistra
        const topLeftPos = { x: -0.5, y: 0.5, z: 0 };
        finalShape.setAttribute('animation__move', {
          property: 'position',
          to: `${topLeftPos.x} ${topLeftPos.y} ${topLeftPos.z}`,
          dur: 800,
          easing: 'easeInOutQuad'
        });
        finalShape.setAttribute('animation__scale', {
          property: 'scale',
          to: '0.15 0.15 0.15',
          dur: 800,
          easing: 'easeInOutQuad'
        });

        // crea cubo con animazione scaling
        const cube = document.createElement('a-box');
        cube.setAttribute('color', '#00FF00');
        cube.setAttribute('depth', 0.2);
        cube.setAttribute('height', 0.2);
        cube.setAttribute('width', 0.2);
        cube.setAttribute('position', topLeftPos);
        cube.setAttribute('scale', '0 0 0');
        container.appendChild(cube);

        cube.setAttribute('animation__pop', {
          property: 'scale',
          to: '1 1 1',
          dur: 500,
          easing: 'easeOutElastic'
        });

        // attacca modello sopra cubo con offset
        const modelOffset = { x: 0, y: 0.15, z: 0 };
        setTimeout(() => {
          finalShape.setAttribute('position', {
            x: topLeftPos.x + modelOffset.x,
            y: topLeftPos.y + modelOffset.y,
            z: topLeftPos.z + modelOffset.z
          });
        }, 500); // dopo che cubo appare
      }, 3000);
    }
  }

  function onPointerUp(){
    if(selectedPiece){
      selectedPiece.object3D.position.y -= 0.01;
      selectedPiece = null;
    }
  }

  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchstart', onPointerDown, {passive:false});
  window.addEventListener('touchmove', onPointerMove, {passive:false});
  window.addEventListener('touchend', onPointerUp);

  // --- POP-UP ANIMATION DOPO TARGET FOUND ---
  marker.addEventListener('targetFound', () => {
    pieces.length = 0;
    let delay = 0;
    for(let i=0;i<modelIds.length;i++){
      setTimeout(()=> createPiece(i), delay);
      delay += 700;
    }
  });
});
