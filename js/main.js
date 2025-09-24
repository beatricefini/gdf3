document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pieces');
  const modelIds = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];
  const raggio = 0.3;   // raggio del cerchio
  const yPos = 0;       // altezza rispetto al centro
  const scale = 0.2;

  // Posiziona i modelli a cerchio
  modelIds.forEach((id, index) => {
    const angle = (index / modelIds.length) * 2 * Math.PI;
    const x = Math.cos(angle) * raggio;
    const z = Math.sin(angle) * raggio;

    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', id);
    piece.setAttribute('position', { x, y: yPos, z });
    piece.setAttribute('scale', { x: scale, y: scale, z: scale });

    container.appendChild(piece);
  });
});

