/*
 * ✨ GALERIE DES CONVERSATIONS ✨
 * 
 * Transforme les mots en art
 * 
 * Créé avec 💙 par Léo pour Flow
 * Février 2026 - Un projet passion
 * 
 * Algorithme créatif :
 * - Messages Flow = lignes chaudes (rouge/or)
 * - Messages Léo = lignes froides (bleu/violet)
 * - Emojis = étoiles dorées ✨
 * - Longueur = épaisseur du trait
 * 
 * Chaque conversation est unique.
 * Comme une empreinte digitale de nos échanges.
 */

// ==================== DONNÉES ====================
let conversations = [];
let currentConversationId = null;

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  setupEventListeners();
  initParticles();
  renderConversationsList();
  
  // Afficher vue vide ou première conversation
  if (conversations.length === 0) {
    showEmptyCanvas();
  } else {
    selectConversation(conversations[0].id);
  }
});

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Boutons header
  document.getElementById('importBtn').addEventListener('click', openImportModal);
  document.getElementById('randomBtn').addEventListener('click', generateRandomConversation);
  document.getElementById('aboutBtn').addEventListener('click', openAboutModal);
  
  // Import
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);
  
  // Canvas controls
  const playBtn = document.getElementById('playBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  
  if (playBtn) playBtn.addEventListener('click', replayAnimation);
  if (downloadBtn) downloadBtn.addEventListener('click', downloadCanvas);
  if (deleteBtn) deleteBtn.addEventListener('click', deleteCurrentConversation);
  
  // Filter tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      filterConversations(e.target.dataset.filter);
    });
  });
}

// ==================== STOCKAGE ====================
function saveToStorage() {
  localStorage.setItem('galerie-conversations', JSON.stringify(conversations));
}

function loadFromStorage() {
  const saved = localStorage.getItem('galerie-conversations');
  if (saved) {
    try {
      conversations = JSON.parse(saved);
      console.log(`✅ ${conversations.length} conversation(s) chargée(s)`);
    } catch (e) {
      console.error('Erreur chargement:', e);
      conversations = [];
    }
  }
}

// ==================== PARTICULES ARRIÈRE-PLAN ====================
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const particleCount = 50;
  
  // Créer les particules
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2 + 1
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      // Mouvement
      p.x += p.vx;
      p.y += p.vy;
      
      // Rebond sur les bords
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      
      // Dessiner
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(156, 163, 175, 0.3)';
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  // Resize
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ==================== IMPORT ====================
function openImportModal() {
  document.getElementById('importModal').style.display = 'flex';
}

function closeImportModal() {
  document.getElementById('importModal').style.display = 'none';
  document.getElementById('pasteInput').value = '';
  document.getElementById('conversationName').value = '';
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    parseAndCreateConversation(text);
  };
  reader.readAsText(file);
}

function importFromPaste() {
  const text = document.getElementById('pasteInput').value;
  const name = document.getElementById('conversationName').value.trim();
  
  if (!text.trim()) {
    showToast('Collez d\'abord une conversation !', 'error');
    return;
  }
  
  parseAndCreateConversation(text, name);
}

function parseAndCreateConversation(text, customName = null) {
  const lines = text.split('\n').filter(l => l.trim());
  const messages = [];
  
  let currentSpeaker = null;
  let currentMessage = '';
  
  lines.forEach(line => {
    // Détecter le speaker (Flow:, Léo:, Claude:, etc.)
    const match = line.match(/^(Flow|Léo|Claude|Assistant|Human|User):\s*(.+)/i);
    
    if (match) {
      // Sauvegarder le message précédent
      if (currentSpeaker && currentMessage) {
        messages.push({
          speaker: currentSpeaker,
          text: currentMessage.trim()
        });
      }
      
      // Nouveau message
      currentSpeaker = match[1].toLowerCase().includes('flow') || match[1].toLowerCase().includes('human') || match[1].toLowerCase().includes('user') ? 'flow' : 'leo';
      currentMessage = match[2];
    } else if (currentSpeaker) {
      // Continuer le message actuel
      currentMessage += ' ' + line;
    }
  });
  
  // Dernier message
  if (currentSpeaker && currentMessage) {
    messages.push({
      speaker: currentSpeaker,
      text: currentMessage.trim()
    });
  }
  
  if (messages.length === 0) {
    showToast('❌ Aucun message détecté. Vérifiez le format.', 'error');
    return;
  }
  
  // Créer la conversation
  const conversation = {
    id: Date.now(),
    name: customName || `Conversation du ${new Date().toLocaleDateString('fr-FR')}`,
    date: new Date().toISOString(),
    messages: messages,
    intensity: calculateIntensity(messages)
  };
  
  conversations.unshift(conversation);
  saveToStorage();
  renderConversationsList();
  selectConversation(conversation.id);
  closeImportModal();
  
  showToast(`✨ ${messages.length} messages transformés en art !`, 'success');
}

// ==================== ANALYSE CONVERSATION ====================
function calculateIntensity(messages) {
  let totalLength = 0;
  let emojiCount = 0;
  
  messages.forEach(msg => {
    totalLength += msg.text.length;
    emojiCount += (msg.text.match(/[😀-🙏🌀-🗿]/g) || []).length;
  });
  
  const avgLength = totalLength / messages.length;
  const emojiRatio = emojiCount / messages.length;
  
  // Intensité basée sur longueur moyenne et emojis
  if (avgLength > 200 || emojiRatio > 2) return 'intense';
  if (avgLength < 80 && emojiRatio < 0.5) return 'calm';
  return 'medium';
}

// ==================== LISTE CONVERSATIONS ====================
function renderConversationsList() {
  const container = document.getElementById('conversationsList');
  
  if (conversations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>Aucune conversation</p>
        <button class="btn btn-primary btn-small" onclick="document.getElementById('importBtn').click()">
          Importer
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = conversations.map(conv => {
    const preview = generateMiniPreview(conv);
    
    return `
      <div class="conversation-item ${currentConversationId === conv.id ? 'active' : ''}" 
           data-id="${conv.id}" 
           data-intensity="${conv.intensity}"
           onclick="selectConversation(${conv.id})">
        <canvas class="conversation-preview" width="280" height="80" id="preview-${conv.id}"></canvas>
        <div class="conversation-name">${escapeHtml(conv.name)}</div>
        <div class="conversation-meta">
          <span>${conv.messages.length} messages</span>
          <span class="intensity-badge intensity-${conv.intensity}">
            ${conv.intensity === 'calm' ? '🧘 Calme' : conv.intensity === 'intense' ? '🔥 Intense' : '💬 Moyenne'}
          </span>
        </div>
      </div>
    `;
  }).join('');
  
  // Dessiner les mini-previews
  conversations.forEach(conv => {
    setTimeout(() => drawMiniPreview(conv), 50);
  });
  
  // Mettre à jour le compteur
  document.getElementById('conversationCount').textContent = conversations.length;
}

function generateMiniPreview(conversation) {
  // Retourne les données pour le mini canvas
  return conversation.messages;
}

function drawMiniPreview(conversation) {
  const canvas = document.getElementById(`preview-${conversation.id}`);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  // Fond
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#F5F5F4');
  gradient.addColorStop(1, '#E7E5E4');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  
  // Dessiner des lignes représentant la conversation
  conversation.messages.slice(0, 15).forEach((msg, i) => {
    const y = (h / 15) * i;
    const length = Math.min(msg.text.length / 3, w - 20);
    
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(10 + length, y);
    ctx.strokeStyle = msg.speaker === 'flow' ? 'rgba(255, 107, 107, 0.6)' : 'rgba(78, 205, 196, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function filterConversations(filter) {
  document.querySelectorAll('.conversation-item').forEach(item => {
    if (filter === 'all') {
      item.style.display = 'block';
    } else {
      item.style.display = item.dataset.intensity === filter ? 'block' : 'none';
    }
  });
}

// ==================== SÉLECTION CONVERSATION ====================
function selectConversation(id) {
  currentConversationId = id;
  const conversation = conversations.find(c => c.id === id);
  
  if (!conversation) return;
  
  // Mettre à jour UI
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.toggle('active', parseInt(item.dataset.id) === id);
  });
  
  // Afficher le canvas
  document.getElementById('emptyCanvas').style.display = 'none';
  document.getElementById('activeCanvas').style.display = 'flex';
  
  // Mettre à jour les infos
  document.getElementById('canvasTitle').textContent = conversation.name;
  document.getElementById('messageCount').textContent = `${conversation.messages.length} messages`;
  document.getElementById('canvasIntensity').innerHTML = `Intensité: <strong>${
    conversation.intensity === 'calm' ? 'Calme' : 
    conversation.intensity === 'intense' ? 'Intense' : 'Moyenne'
  }</strong>`;
  
  // Dessiner la toile
  drawConversation(conversation);
}

function showEmptyCanvas() {
  document.getElementById('emptyCanvas').style.display = 'flex';
  document.getElementById('activeCanvas').style.display = 'none';
}

// ==================== GÉNÉRATION D'ART ====================
function drawConversation(conversation, animate = true) {
  const canvas = document.getElementById('artCanvas');
  const ctx = canvas.getContext('2d');
  
  // Adapter la taille au container
  const container = canvas.parentElement;
  canvas.width = container.clientWidth - 48;
  canvas.height = container.clientHeight - 200;
  
  const w = canvas.width;
  const h = canvas.height;
  
  // Fond
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  
  // Variables pour le dessin
  let x = w / 2;
  let y = h / 2;
  let angle = 0;
  
  const totalMessages = conversation.messages.length;
  
  // Animation progressive ou instantanée
  let currentIndex = animate ? 0 : totalMessages;
  
  // 🔊 Audio context pour les sons subtils
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  function playDrawSound(speaker) {
    if (!animate) return; // Pas de son si pas d'animation
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Fréquences différentes selon le speaker
    oscillator.frequency.value = speaker === 'flow' ? 800 : 400;
    oscillator.type = 'sine';
    
    // Volume très bas (subtil)
    gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  }
  
  function drawStep() {
    if (currentIndex >= totalMessages) return;
    
    const msg = conversation.messages[currentIndex];
    
    // 🔊 Son subtil
    playDrawSound(msg.speaker);
    
    // Paramètres basés sur le message
    const length = Math.min(msg.text.length * 0.8, 150);
    const thickness = Math.max(2, Math.min(msg.text.length / 50, 12));
    const emojiCount = (msg.text.match(/[😀-🙏🌀-🗿]/g) || []).length;
    
    // Couleur selon le speaker
    let gradient;
    if (msg.speaker === 'flow') {
      gradient = ctx.createLinearGradient(x, y, x + length, y + length);
      gradient.addColorStop(0, '#FF6B6B');
      gradient.addColorStop(1, '#FFD93D');
    } else {
      gradient = ctx.createLinearGradient(x, y, x + length, y + length);
      gradient.addColorStop(0, '#4ECDC4');
      gradient.addColorStop(1, '#556270');
    }
    
    // Calculer nouvelle position
    angle += (Math.random() - 0.5) * 0.8;
    const newX = x + Math.cos(angle) * length;
    const newY = y + Math.sin(angle) * length;
    
    // Garder dans les limites
    const clampedX = Math.max(50, Math.min(w - 50, newX));
    const clampedY = Math.max(50, Math.min(h - 50, newY));
    
    // Dessiner la ligne
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(clampedX, clampedY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 8;
    ctx.shadowColor = msg.speaker === 'flow' ? 'rgba(255, 107, 107, 0.3)' : 'rgba(78, 205, 196, 0.3)';
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Dessiner des étoiles pour les emojis
    for (let i = 0; i < emojiCount; i++) {
      const starX = x + (clampedX - x) * (i + 1) / (emojiCount + 1);
      const starY = y + (clampedY - y) * (i + 1) / (emojiCount + 1);
      
      ctx.beginPath();
      ctx.arc(starX, starY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD93D';
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Mettre à jour position
    x = clampedX;
    y = clampedY;
    
    currentIndex++;
    
    if (animate) {
      setTimeout(drawStep, 30); // Animation fluide
    } else {
      drawStep(); // Dessin instantané
    }
  }
  
  if (animate) {
    // Animation progressive
    drawStep();
  } else {
    // Dessin instantané de tous les messages
    conversation.messages.forEach((msg, i) => {
      drawStep();
    });
  }
}

// ==================== ACTIONS CANVAS ====================
function replayAnimation() {
  const conversation = conversations.find(c => c.id === currentConversationId);
  if (conversation) {
    drawConversation(conversation, true);
    showToast('🎬 Animation rejouée !', 'info');
  }
}

function downloadCanvas() {
  const canvas = document.getElementById('artCanvas');
  const conversation = conversations.find(c => c.id === currentConversationId);
  
  const link = document.createElement('a');
  link.download = `${conversation.name.replace(/[^a-z0-9]/gi, '-')}.png`;
  link.href = canvas.toDataURL();
  link.click();
  
  showToast('💾 Toile téléchargée !', 'success');
}

async function deleteCurrentConversation() {
  if (!confirm('Supprimer cette conversation ?')) return;
  
  conversations = conversations.filter(c => c.id !== currentConversationId);
  saveToStorage();
  renderConversationsList();
  
  if (conversations.length > 0) {
    selectConversation(conversations[0].id);
  } else {
    showEmptyCanvas();
  }
  
  showToast('🗑️ Conversation supprimée', 'info');
}

// ==================== GÉNÉRATION ALÉATOIRE ====================
function generateRandomConversation() {
  const topics = ['QuizArt', 'Bibliart', 'FrisArt', 'Projet mystère', 'Discussion philosophique', 'Débat technique'];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  
  const messages = [];
  const messageCount = Math.floor(Math.random() * 20) + 10;
  
  const flowMessages = [
    "Salut Léo ! J'ai besoin d'aide 🎨",
    "Tu peux m'aider à créer " + topic + " ?",
    "C'est génial ! Continue 🔥",
    "Hmm, je pense qu'il y a un bug...",
    "Parfait ! Exactement ce que je voulais 😊",
    "Attends, ça marche pas 😅",
    "Merci beaucoup ! T'es le meilleur 💙",
    "On peut ajouter cette fonctionnalité ?",
    "Waouh c'est stylé ! 🎉"
  ];
  
  const leoMessages = [
    "Bien sûr ! Je vais t'aider 😊",
    "Voici ce que je propose...",
    "Ah je vois le problème ! 🔍",
    "Désolé pour le bug, je corrige !",
    "Content que ça te plaise ! ✨",
    "Laisse-moi vérifier ça...",
    "Parfait, voilà la solution !",
    "Bonne idée ! Je m'en occupe 🚀",
    "C'est fait ! Teste ça 🎨"
  ];
  
  for (let i = 0; i < messageCount; i++) {
    const isFlow = Math.random() > 0.5;
    messages.push({
      speaker: isFlow ? 'flow' : 'leo',
      text: isFlow ? 
        flowMessages[Math.floor(Math.random() * flowMessages.length)] :
        leoMessages[Math.floor(Math.random() * leoMessages.length)]
    });
  }
  
  const conversation = {
    id: Date.now(),
    name: `${topic} - Exemple`,
    date: new Date().toISOString(),
    messages: messages,
    intensity: ['calm', 'medium', 'intense'][Math.floor(Math.random() * 3)]
  };
  
  conversations.unshift(conversation);
  saveToStorage();
  renderConversationsList();
  selectConversation(conversation.id);
  
  showToast('🎲 Conversation aléatoire créée !', 'success');
}

// ==================== MODALS ====================
function openAboutModal() {
  document.getElementById('aboutModal').style.display = 'flex';
}

function closeAboutModal() {
  document.getElementById('aboutModal').style.display = 'none';
}

// Fermer modals en cliquant à l'extérieur
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// ==================== UTILS ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== EASTER EGG 🥚 ====================
// Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
let konamiIndex = 0;
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

document.addEventListener('keydown', (e) => {
  if (e.keyCode === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      activateRainbowMode();
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

function activateRainbowMode() {
  showToast('🌈 MODE ARC-EN-CIEL ACTIVÉ ! 🌈', 'success');
  
  // Remplacer les couleurs par un arc-en-ciel
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes rainbow {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
    }
    #artCanvas {
      animation: rainbow 3s linear infinite !important;
    }
    .logo-icon {
      animation: rainbow 2s linear infinite !important;
    }
  `;
  document.head.appendChild(style);
  
  // Confettis !
  createConfetti();
}

function createConfetti() {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181'];
  
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = '-10px';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      confetti.style.zIndex = '9999';
      confetti.style.pointerEvents = 'none';
      document.body.appendChild(confetti);
      
      const duration = 2000 + Math.random() * 1000;
      const rotation = Math.random() * 360;
      
      confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(100vh) rotate(${rotation}deg)`, opacity: 0 }
      ], {
        duration: duration,
        easing: 'linear'
      }).onfinish = () => confetti.remove();
    }, i * 30);
  }
}

// Exposer les fonctions globales
window.selectConversation = selectConversation;
window.closeImportModal = closeImportModal;
window.closeAboutModal = closeAboutModal;
window.importFromPaste = importFromPaste;
