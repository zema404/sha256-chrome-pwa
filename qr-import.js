(() => {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(() => {
    const qrInput = document.getElementById('qrFileInput');
    const qrBlock = qrInput && qrInput.closest('.box');
    const outputBlock = document.querySelector('.box.output');
    const statusEl = document.getElementById('status');

    if (!qrInput || !qrBlock || !outputBlock) return;

    outputBlock.insertAdjacentElement('afterend', qrBlock);

    const dropzone = document.createElement('div');
    dropzone.className = 'dropzone';
    dropzone.tabIndex = 0;
    dropzone.innerHTML = '<strong>Glisser-déposer une image QR</strong><span>Ou colle une image copiée directement depuis le presse-papiers.</span>';
    qrInput.insertAdjacentElement('beforebegin', dropzone);

    const pasteBtn = document.createElement('button');
    pasteBtn.type = 'button';
    pasteBtn.textContent = 'Coller image';
    const actions = qrInput.parentElement.querySelector('.actions');
    if (actions) actions.insertAdjacentElement('afterbegin', pasteBtn);

    const style = document.createElement('style');
    style.textContent = '.dropzone{border:1px dashed rgba(124,58,237,.65);border-radius:20px;background:rgba(124,58,237,.1);padding:18px;text-align:center;margin-bottom:12px}.dropzone strong{display:block;color:var(--text);font-size:16px;margin-bottom:6px}.dropzone span{display:block;color:var(--muted);font-size:13px;line-height:1.45}.dropzone.dragover{border-color:#06b6d4;background:rgba(6,182,212,.16)}';
    document.head.appendChild(style);

    function setStatus(message, type) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'status' + (type ? ' ' + type : '');
    }

    function importFiles(fileList) {
      const file = [...fileList].find(item => item && item.type && item.type.startsWith('image/'));
      if (!file) {
        setStatus('Aucune image détectée.', 'err');
        return;
      }
      const dt = new DataTransfer();
      dt.items.add(file);
      qrInput.files = dt.files;
      qrInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    }));

    ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
    }));

    dropzone.addEventListener('drop', event => importFiles(event.dataTransfer.files));
    dropzone.addEventListener('click', () => qrInput.click());
    dropzone.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        qrInput.click();
      }
    });

    window.addEventListener('paste', event => {
      if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length) {
        importFiles(event.clipboardData.files);
      }
    });

    pasteBtn.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.read) throw new Error('Lecture image presse-papiers non supportée. Utilise le collage classique ou le glisser-déposer.');
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const type = item.types.find(value => value.startsWith('image/'));
          if (type) {
            const blob = await item.getType(type);
            importFiles([new File([blob], 'qr-pasted.png', { type })]);
            return;
          }
        }
        throw new Error('Aucune image dans le presse-papiers.');
      } catch (error) {
        setStatus(error.message || 'Impossible de coller une image.', 'err');
      }
    });
  });
})();
