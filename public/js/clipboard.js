const shortUrl = document.getElementById('hidden-url-container')
  .innerText
  .trim();
const copyButton = document.getElementById('copy-btn');
copyButton.onclick = () => {
  copyButton.removeAttribute('id');
  copyButton.classList.remove('btn-primary');
  copyButton.classList.add('btn-success');
  copyButton.innerHTML = 'Copied';
  navigator.clipboard.writeText(shortUrl)
    .then()
    .catch(console.error);
};
