export default function decorate(block) {
  const recallInfoList = [...block.children] ?? [];
  console.log('recallInfoList', recallInfoList);
  if (recallInfoList?.length) {
    recallInfoList.forEach((recallInfo) => {
      recallInfo.classList.add('recall-text-info-item');
      const [title, content] = recallInfo?.children ?? [];
      if (title) {
        title.classList.add('title');
      }
      if (content) {
        content.classList.add('content');
      }
    });
  }
}
