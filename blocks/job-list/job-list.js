export default async function decorate(block) {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('id', 'BambooHR');
  wrapper.setAttribute('data-domain', 'hisenseusacorporation.bamboohr.com');
  wrapper.setAttribute('data-version', '1.0.0');
  wrapper.setAttribute('data-departmentId', '');

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://hisenseusacorporation.bamboohr.com/js/embed.js';
  script.async = true;
  script.defer = true;
  wrapper.appendChild(script);

  block.replaceChildren(wrapper);
}
