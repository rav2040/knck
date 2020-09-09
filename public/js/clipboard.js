const copyButton = document.getElementById('copy-btn');
copyButton.onclick = () => {
  const shortUrl = document.getElementById('hidden-url-container')
    .innerText
    .trim();
  navigator.clipboard.writeText(shortUrl)
    .then(() => {
      copyButton.innerHTML = 'Copied';
      copyButton.classList.add('btn-success');
      copyButton.classList.remove('btn-primary');
      copyButton.blur();
    })
    .catch(console.error);
};
