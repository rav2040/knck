const copyButton = document.getElementById('copy-btn');
copyButton.onclick = () => {
  const shortUrl = document.getElementById('hidden-url-container')
    .innerText
    .trim();
  navigator.clipboard.writeText(shortUrl)
    .then(() => {
      copyButton.removeAttribute('id');
      copyButton.setAttribute('id', 'copy-btn');
      copyButton.classList.remove('btn-primary');
      copyButton.classList.add('btn-success');
      copyButton.innerHTML = 'Copied';
      copyButton.blur();
    })
    .catch(console.error);
};
