document.addEventListener("DOMContentLoaded", () => {
  const marker = document.getElementById("marker");
  const container = document.getElementById("pieces");
  const cameraEl = document.querySelector("a-camera");

  const models = [
    "#piece1",
    "#piece2",
    "#piece3",
    "#piece4",
    "#piece5",
    "#piece6"
  ];

  const pieces = [];
  const originalTransforms = {};

  // Posizioni ellittiche
  const positions = [
    { x: -0.3, y: 0, z: 0 },   // piece1
    { x: 0, y: 0.45, z: 0 },   // piece2
    { x: 0.3, y: 0, z: 0 },    // piece3
    { x: -0.15, y: -0.3, z: 0 }, // piece4
    { x: 0.15, y: -0.3, z: 0 },  // piece5
    { x: 0.1, y: 0.35, z: 0 }    // piece6 leggermente più a sinistra
  ];

  const scales = [0.15, 0.35, 0.15, 0.2, 0.35, 0.35];
  const centerScale = 0.3;
  const raggioSnap = 0.1;

  // --- Crea pezzi all’inizio (invisibili) ---
  models.forEach((model, i) => {
    const piece = document.createElement("a-entity");
    piece.setAttribute("gltf-model", model);
    piece.setAttribute("position", positions[i]);
    piece.setAttribute("scale", {
      x: scales[i],
      y: scales[i],
      z: scales[i]
    });
    piece.setAttribute("visible", "false"); // invisibile fino al pop-up
    piece.dataset.locked = "false";
    container.appendChild(piece);
    pieces.push(piece);

    originalTransforms[i] = {
      position: { ...positions[i] },
      scale: { x: scales[i], y: scales[i], z: scales[i] }
    };
  });

  // --- Drag & Drop ---
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

  function checkSnap(piece) {
    const pos = piece.object3D.position;
    const distanza = Math.sqrt((pos.x)**2 + (pos.y)**2 + (pos.z)**2);
    if (distanza < raggioSnap) {
      piece.setAttribute("position", { x: 0, y: 0, z: 0 });
      piece.setAttribute("scale", { x: centerScale, y: centerScale, z: centerScale });
      piece.dataset.locked = "true";
    }
  }

  function onPointerDown(event){
    updateMouse(event);
    raycaster.setFromCamera(mouse, cameraEl.getObject3D('camera'));

    const intersects = raycaster.intersectObjects(
      pieces.filter(p => p.dataset.locked === "false").map(p => p.object3D), true
    );

    if(intersects.length > 0){
      selectedPiece = intersects[0].object.el;
      selectedPiece.object3D.position.y += 0.01; // piccolo feedback
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

  // --- Pop-up animazione dopo targetFound ---
  marker.addEventListener("targetFound", () => {
    pieces.forEach((piece, i) => {
      setTimeout(() => {
        piece.setAttribute("visible", "true");
        piece.setAttribute("animation__pop", {
          property: "scale",
          from: "0 0 0",
          to: `${scales[i]} ${scales[i]} ${scales[i]}`,
          dur: 600,
          easing: "easeOutElastic"
        });
      }, i * 500); // sequenza uno dopo l'altro
    });
  });

});
