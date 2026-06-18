import {
  decorateBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  loadBlock,
  loadScript,
  loadSections,
} from './aem.js';
import { decorateRichtext } from './editor-support-rte.js';
import { decorateMain } from './scripts.js';
import { applyDynamicMediaVideoPatch } from '../utils/ue-dynamic-media-video.js';

async function applyChanges(event) {
  console.log('applyChanges');
  // redecorate default content and blocks on patches (in the properties rail)
  const { detail } = event;

  const resource = detail?.request?.target?.resource // update, patch components
    || detail?.request?.target?.container?.resource // update, patch, add to sections
    || detail?.request?.to?.container?.resource; // move in sections
  if (!resource) return false;
  const updates = detail?.response?.updates;
  if (!updates.length) return false;
  const { content } = updates[0];
  if (!content) return false;

  // load dompurify
  await loadScript(`${window.hlx.codeBasePath}/scripts/dompurify.min.js`);

  const sanitizedContent = window.DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
  const parsedUpdate = new DOMParser().parseFromString(sanitizedContent, 'text/html');
  const element = document.querySelector(`[data-aue-resource="${resource}"]`);

  if (element) {
    if (element.matches('main')) {
      const newMain = parsedUpdate.querySelector(`[data-aue-resource="${resource}"]`);
      newMain.style.display = 'none';
      element.insertAdjacentElement('afterend', newMain);
      decorateMain(newMain);
      decorateRichtext(newMain);
      await loadSections(newMain);
      element.remove();
      newMain.style.display = null;
      // eslint-disable-next-line no-use-before-define
      attachEventListners(newMain);
      return true;
    }

    const block = element.parentElement?.closest('.block[data-aue-resource]') || element?.closest('.block[data-aue-resource]');
    if (block) {
      const blockResource = block.getAttribute('data-aue-resource');
      const newBlock = parsedUpdate.querySelector(`[data-aue-resource="${blockResource}"]`);
      if (newBlock) {
        newBlock.style.display = 'none';
        block.insertAdjacentElement('afterend', newBlock);
        decorateButtons(newBlock);
        decorateIcons(newBlock);
        decorateBlock(newBlock);
        decorateRichtext(newBlock);
        await loadBlock(newBlock);
        block.remove();
        newBlock.style.display = null;
        return true;
      }
    } else {
      // sections and default content, may be multiple in the case of richtext
      const newElements = parsedUpdate.querySelectorAll(`[data-aue-resource="${resource}"],[data-richtext-resource="${resource}"]`);
      if (newElements.length) {
        const { parentElement } = element;
        if (element.matches('.section')) {
          const [newSection] = newElements;
          newSection.style.display = 'none';
          element.insertAdjacentElement('afterend', newSection);
          decorateButtons(newSection);
          decorateIcons(newSection);
          decorateRichtext(newSection);
          decorateSections(parentElement);
          decorateBlocks(parentElement);
          await loadSections(parentElement);
          element.remove();
          newSection.style.display = null;
        } else {
          element.replaceWith(...newElements);
          decorateButtons(parentElement);
          decorateIcons(parentElement);
          decorateRichtext(parentElement);
        }
        return true;
      }
    }
  }

  return false;
}

async function runCustomAfterUEChange(event) {
  try {
    await applyDynamicMediaVideoPatch(event);
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.warn('Failed to apply Dynamic Media video preview:', error);
  }
}

function attachEventListners(main) {
  console.log('attachEventListners');
  [
    'aue:content-patch',
    'aue:content-update',
    'aue:content-add',
    'aue:content-move',
    'aue:content-remove',
    'aue:content-copy',
    'aue:ui-ready',
    'aue:initialized',
  ].forEach((eventType) => main?.addEventListener(eventType, async (event) => {
    console.log('main addEventListener eventType', eventType);
    event.stopPropagation();
    await runCustomAfterUEChange(event);
    const applied = await applyChanges(event);
    if (!applied) window.location.reload();
  }));
}

attachEventListners(document.querySelector('main'));
console.log('editor-support');
// decorate rich text
// this has to happen after decorateMain(), and everythime decorateBlocks() is called
decorateRichtext();
// in cases where the block decoration is not done in one synchronous iteration we need to listen
// for new richtext-instrumented elements. this happens for example when using experimentation.
const observer = new MutationObserver(() => decorateRichtext());
observer.observe(document, { attributeFilter: ['data-richtext-prop'], subtree: true });

(function () {
  const topWindow = window.parent || window.top;
  let rootSrc = '';
  // ---------- 核心：轮询逻辑 (每秒执行) ----------
  function ensureEditorButtons() {
    // 1. 查找所有 "Remove item" 按钮
    const removeButtons = topWindow.document.querySelectorAll('[aria-label="Remove item"]');

    // 2. 遍历每个 remove 按钮
    removeButtons.forEach((removeBtn) => {
      // 获取父容器 (通常 remove 和 editor 是兄弟节点)
      const parent = removeBtn.parentNode;
      if (!parent) return;

      // 检查该 remove 按钮之后是否存在 class="image-editor" 的兄弟元素
      let hasEditor = false;
      let { nextSibling } = removeBtn;
      while (nextSibling) {
        // 只检查元素节点 (nodeType === 1)
        if (nextSibling.nodeType === 1) {
          // 检查是否包含 'image-editor' 类
          if (nextSibling.classList && nextSibling.classList.contains('image-editor')) {
            hasEditor = true;
            break;
          }
        }
        nextSibling = nextSibling.nextSibling;
      }

      // 如果没有找到 editor，则创建一个并插入到 remove 后面
      if (!hasEditor) {
        const editorBtn = topWindow.document.createElement('button');
        editorBtn.className = 'image-editor';
        // 可以加一些样式或文字，方便识别
        editorBtn.textContent = '✎';
        // 给个占位样式 (与演示风格一致)
        editorBtn.style.marginLeft = '8px';
        editorBtn.style.padding = '0 8px';
        editorBtn.style.border = 'none';
        editorBtn.style.fontWeight = '500';
        editorBtn.style.fontSize = '18px';
        editorBtn.style.height = '32px';
        editorBtn.style.cursor = 'pointer';
        editorBtn.style.background = 'transparent';
        editorBtn.addEventListener('click', function (e) {
          e.stopPropagation();

          // 找到最近的 class 为 is-item 的父级
          const itemParent = this.closest('.is-item');
          if (!itemParent) return;

          // 在父级中寻找 img，获取 src 和 alt
          const img = itemParent.querySelector('img');
          if (!img) return;

          const { src } = img;
          const alt = img.alt || 'image.jpg';
          function checkUrl() {
            const pattern1 = /urn:aaid:aem:[^\/]+\/as\/.+/;
            const pattern2 = /urn:aaid:aem:[^\/]+(?!\/as\/)/;

            if (pattern1.test(src)) {
              return src.split('?')[0];
            }
            if (pattern2.test(src)) {
              return `${src}/as/${alt}`;
            }
            return src;
          }
          rootSrc = checkUrl();

          // 查找或创建弹窗
          let modal = topWindow.document.getElementById('imagePreviewModal');
          if (!modal) {
            // 创建弹窗
            modal = topWindow.document.createElement('div');
            modal.id = 'imagePreviewModal';
            modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            cursor: pointer;
        `;

            const content = topWindow.document.createElement('div');
            content.style.cssText = `
            width: 80%;
            height: 80%;
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            cursor: default;
            position: relative;
        `;

            const closeBtn = topWindow.document.createElement('button');
            closeBtn.textContent = '✕';
            closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #f0f0f0;
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        `;
            closeBtn.onmouseover = () => closeBtn.style.background = '#e0e0e0';
            closeBtn.onmouseout = () => closeBtn.style.background = '#f0f0f0';

            const popupTitle = topWindow.document.createElement('div');
            popupTitle.textContent = 'Image Editor';

            const imgContainer = topWindow.document.createElement('div');
            imgContainer.id = 'modalImageContainer';
            imgContainer.style.cssText = `
            width: calc(100% - 400px);`;

            const mediaGroup = topWindow.document.createElement('div');
            mediaGroup.style.cssText = `
            display: flex;
            gap: 20px;
            `;
            const editorGroup = topWindow.document.createElement('div');
            editorGroup.id = 'editorContainer';
            editorGroup.style.cssText = `
            width: 380px`;

            content.appendChild(closeBtn);
            content.appendChild(popupTitle);
            mediaGroup.appendChild(imgContainer);
            mediaGroup.appendChild(editorGroup);
            content.appendChild(mediaGroup);
            modal.appendChild(content);

            // 点击背景关闭
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                closeModal();
              }
            });

            // 关闭按钮
            closeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              closeModal();
            });

            // ESC 键关闭
            topWindow.document.addEventListener('keydown', (e) => {
              if (e.key === 'Escape' && modal.style.display !== 'none') {
                closeModal();
              }
            });

            topWindow.document.body.appendChild(modal);
          }

          // 如果弹窗已存在且隐藏，显示它
          modal.style.display = 'flex';

          // 更新图片内容
          const container = topWindow.document.getElementById('modalImageContainer');
          container.innerHTML = '';

          const previewImg = topWindow.document.createElement('img');
          previewImg.src = rootSrc;
          previewImg.alt = alt;
          previewImg.style.cssText = `
        width: 100%;
        object-fit: contain;
        display: block;
        border-radius: 4px;
    `;
          container.appendChild(previewImg);

          // 添加图片信息
          const info = topWindow.document.createElement('p');
          info.textContent = alt;
          info.style.cssText = `
        margin: 12px 0 0 0;
        color: #333;
        font-size: 14px;
        text-align: center;
        max-width: 70vw;
        word-break: break-all;
    `;
          container.appendChild(info);

          function closeModal() {
            if (modal) {
              modal.style.display = 'none';
              const container = topWindow.document.getElementById('modalImageContainer');
              if (container) container.innerHTML = '';
            }
          }
        });
        // 插入到 remove 之后 (作为下一个兄弟)
        parent.insertBefore(editorBtn, removeBtn.nextSibling);
      }
    });
  }

  // ---------- 启动轮询 (每秒执行) ----------
  let pollingInterval = setInterval(ensureEditorButtons, 1000);
  window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  });

  // ---------- 额外：手动触发一次，确保初始状态完美 ----------
  // 由于 DOM 已渲染，立即执行一次修复。
  // 但此时可能还有部分未加载，使用微任务或延时。
  setTimeout(ensureEditorButtons, 30);

  // 控制台提示
  console.log('✅ 轮询已启动 (每秒检查) ，确保每个 [aria-label="Remove item"] 后有 .image-editor');
  console.log('💡 你可以通过“添加条目”或点击“移除”测试，编辑器按钮会自动补齐。');

  // 为了更健壮：当 DOM 发生变动（比如子节点增删）时，可额外触发，但轮询已足够。
  // 此处留空，保持简洁，轮询是主力。
}());
