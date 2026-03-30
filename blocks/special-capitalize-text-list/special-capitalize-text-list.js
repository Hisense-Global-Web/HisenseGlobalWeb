const getSpace = (isSpace = false) => (isSpace ? ' ' : '');

export default function decorate(block) {
  const rows = [...block.children];
  if (rows?.length) {
    rows.forEach((row) => {
      const [titleEl, SpecialLetterEl] = row.children;
      const capitalizeLetter = SpecialLetterEl?.querySelector?.('p')?.textContent?.toUpperCase() ?? '';
      row.classList.add('list-item-wrapper');
      const titleText = titleEl?.querySelector('p')?.textContent ?? '';
      const titleTextList = titleText.trim().split(/\s+/) ?? [];
      if (titleTextList?.length) {
        const titleWrapperEl = document.createElement('div');
        titleWrapperEl.className = 'title-wrapper';
        titleTextList.forEach((word, index) => {
          const commonWordEl = document.createElement('span');
          const isSpace = index !== titleTextList.length - 1;
          if (capitalizeLetter?.length) {
            if (word.toUpperCase().startsWith(capitalizeLetter)) {
              const capitalizeLetterEl = document.createElement('span');
              capitalizeLetterEl.className = 'capitalize-letter';
              capitalizeLetterEl.textContent = capitalizeLetter;
              titleWrapperEl.appendChild(capitalizeLetterEl);
              const otherWordEl = document.createElement('span');
              otherWordEl.textContent = word.slice(capitalizeLetter.length) + getSpace(isSpace);
              titleWrapperEl.append(otherWordEl);
            } else {
              commonWordEl.textContent = word + getSpace(isSpace);
              titleWrapperEl.appendChild(commonWordEl);
            }
          } else {
            commonWordEl.textContent = word + getSpace(isSpace);
            titleWrapperEl.appendChild(commonWordEl);
          }
        });
        row.innerHTML = '';
        row.appendChild(titleWrapperEl);
      }
    });
  }
}
