document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pieces');
  const models = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];
  const raggio = 0.3;      // raggio del cerchio
  const zFixed = 0;        // profondità
  const pezzoScale = 0.2;
  const pieces = [];

  // Creazione pezzi GLB in cerchio (x e y)
  for (let i = 0; i < models.length; i++) {
    const angle = (i / models.length) * 2 * Math.PI;
    const x = Math.cos(angle) * raggio;
    const y = Math.sin(angle) * raggio + 0.2; // offset sopra il marker

    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', models[i]);
    piece.setAttribute('position', { x, y, z: zFixed });
    piece.setAttribute('scale', { x: pezzoScale, y: pezzoScale, z: pezzoScale });

    container.appendChild(piece);
    pieces.push(piece);
  }
});
