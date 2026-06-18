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
  console.log(topWindow);
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
        editorBtn.textContent = '✎ 编辑';
        // 给个占位样式 (与演示风格一致)
        editorBtn.style.marginLeft = '6px';
        editorBtn.style.padding = '6px 16px';
        editorBtn.style.borderRadius = '40px';
        editorBtn.style.border = '1px solid #b8d2f0';
        editorBtn.style.background = '#e3f0ff';
        editorBtn.style.color = '#1a5c9e';
        editorBtn.style.fontWeight = '500';
        editorBtn.style.fontSize = '0.8rem';
        editorBtn.style.cursor = 'default';
        editorBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
        // 插入到 remove 之后 (作为下一个兄弟)
        parent.insertBefore(editorBtn, removeBtn.nextSibling);
      }
    });
  }

  // ---------- 启动轮询 (每秒执行) ----------
  let pollingInterval = setInterval(ensureEditorButtons, 1000);

  // ---------- 演示 UI 辅助：动态添加/删除条目 (方便测试) ----------
  const demoContainer = topWindow.document.getElementById('demoContainer');

  // 生成一个带 remove 按钮的 item 行
  function createItemRow(label = `项目 ${Date.now().toString().slice(-4)}`) {
    const row = topWindow.document.createElement('div');
    row.className = 'item-row';

    // 左侧标签
    const labelSpan = topWindow.document.createElement('span');
    labelSpan.className = 'item-label';
    labelSpan.textContent = label;
    row.appendChild(labelSpan);

    // 按钮组 (用来放 remove 和后续 editor)
    const btnGroup = topWindow.document.createElement('div');
    btnGroup.className = 'btn-group';

    // 移除按钮 (aria-label="Remove item")
    const removeBtn = topWindow.document.createElement('button');
    removeBtn.setAttribute('aria-label', 'Remove item');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = '✕ 移除';
    // 点击删除整行 (演示效果)
    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const rowToRemove = this.closest('.item-row');
      if (rowToRemove) {
        rowToRemove.remove();
        // 主动触发一次检查 (轮询也会执行，但为了即时感，额外调用一次)
        ensureEditorButtons();
      }
    });

    btnGroup.appendChild(removeBtn);
    row.appendChild(btnGroup);

    // 注意：这里不主动添加 editor，由轮询自动补全
    return row;
  }

  // 初始化演示数据 (3个条目)
  function initDemoItems() {
    demoContainer.innerHTML = '';
    const labels = ['🖼️ 风景图', '📸 人像', '🎨 插画'];
    labels.forEach((label) => {
      const row = createItemRow(label);
      demoContainer.appendChild(row);
    });
    // 首次渲染后立即执行一次，确保 editor 补全
    setTimeout(ensureEditorButtons, 20);
  }
  initDemoItems();

  // 添加新条目 (按钮)
  topWindow.document.getElementById('addItemBtn').addEventListener('click', () => {
    const newRow = createItemRow(`📁 项目 ${Math.floor(Math.random() * 900 + 100)}`);
    demoContainer.appendChild(newRow);
    // 轮询会自动补全 editor，但为了让用户立刻看到，主动调用一次
    ensureEditorButtons();
  });

  // ---------- (可选) 暴露清除轮询的方法，避免内存泄漏 (但本演示不需要) ----------
  // 如果页面卸载，可以清除，但演示保持。
  // 为了干净，可以监听 beforeunload 清除，但不是必须。
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
